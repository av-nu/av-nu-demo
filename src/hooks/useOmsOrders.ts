"use client";

import { useCallback, useEffect, useMemo } from "react";

import { useLocalStorage } from "./useLocalStorage";
import {
  buildSeedOrders,
  generateRandomCheckout,
  makeStripeCheckoutEvent,
  SEED_VERSION,
  type AdminActionLog,
  type AdminNote,
  type Order,
  type OrderEvent,
  type StripeCheckoutEvent,
} from "@/data/oms";
import {
  applyStripeCheckoutEvent,
  applyShopifyWriteback,
  applyWritebackForOrder,
  applyGenerateLabel,
  advanceTracking as advanceTrackingTransform,
  createReturnRequest,
  approveReturn as approveReturnTransform,
  rejectReturn as rejectReturnTransform,
  advanceReturn as advanceReturnTransform,
  processRefund as processRefundTransform,
  setPayoutHold as setPayoutHoldTransform,
  setOrderHold as setOrderHoldTransform,
  resendNotification as resendNotificationTransform,
} from "@/lib/omsEngine";
import { type RefundType } from "@/data/oms";

const ORDERS_KEY = "avnu-oms-orders";
const VERSION_KEY = "avnu-oms-seed-version";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Source of truth for the demo OMS. Seeds localStorage on first run and
 * re-seeds when SEED_VERSION changes so updated demo data shows up.
 */
export function useOmsOrders() {
  const [orders, setOrders, isHydrated] = useLocalStorage<Order[]>(
    ORDERS_KEY,
    [],
  );
  const [seedVersion, setSeedVersion] = useLocalStorage<number>(VERSION_KEY, 0);

  // Seed / re-seed.
  useEffect(() => {
    if (!isHydrated) return;
    if (orders.length === 0 || seedVersion !== SEED_VERSION) {
      setOrders(buildSeedOrders());
      setSeedVersion(SEED_VERSION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const getOrder = useCallback(
    (id: string) => orders.find((o) => o.id === id || o.orderNumber === id),
    [orders],
  );

  const patchOrder = useCallback(
    (id: string, patch: (order: Order) => Order) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? patch(o) : o)));
    },
    [setOrders],
  );

  const appendEvent = useCallback(
    (orderId: string, event: Omit<OrderEvent, "id" | "orderId" | "createdAt">) => {
      patchOrder(orderId, (o) => ({
        ...o,
        events: [
          ...o.events,
          { ...event, id: makeId("ev"), orderId, createdAt: nowIso() },
        ],
      }));
    },
    [patchOrder],
  );

  const addNote = useCallback(
    (orderId: string, author: string, body: string) => {
      if (!body.trim()) return;
      const note: AdminNote = {
        id: makeId("note"),
        orderId,
        author,
        body: body.trim(),
        createdAt: nowIso(),
      };
      patchOrder(orderId, (o) => ({ ...o, notes: [...o.notes, note] }));
      appendEvent(orderId, {
        type: "admin.note.added",
        message: `Note added by ${author}`,
        actor: "admin",
      });
    },
    [patchOrder, appendEvent],
  );

  const logAction = useCallback(
    (
      orderId: string,
      action: string,
      actor: string,
      role: string,
      detail?: string,
    ) => {
      const entry: AdminActionLog = {
        id: makeId("act"),
        orderId,
        action,
        actor,
        role,
        detail,
        createdAt: nowIso(),
      };
      patchOrder(orderId, (o) => ({ ...o, actionLog: [...o.actionLog, entry] }));
    },
    [patchOrder],
  );

  // Idempotent Stripe-event → order creation. Re-processing the same event
  // (matched by Stripe event id or payment intent) never creates a duplicate,
  // mirroring the real webhook handler keyed on WebhookEvent.
  const processStripeEvent = useCallback(
    (event: StripeCheckoutEvent): { created: boolean; order: Order } => {
      let result: { created: boolean; order: Order } | undefined;
      setOrders((prev) => {
        const r = applyStripeCheckoutEvent(prev, event);
        result = { created: r.created, order: r.order };
        return r.orders;
      });
      // setOrders runs its updater synchronously, so result is populated here.
      return result as { created: boolean; order: Order };
    },
    [setOrders],
  );

  // Demo affordance: fabricate a random paid checkout + Stripe event, process
  // it, and return both so the UI can offer a "replay" to show idempotency.
  const simulateNewOrder = useCallback((): {
    event: StripeCheckoutEvent;
    order: Order;
  } => {
    const event = makeStripeCheckoutEvent(generateRandomCheckout());
    const { order } = processStripeEvent(event);
    return { event, order };
  }, [processStripeEvent]);

  // Phase 3 — Shopify writeback actions.
  const retryShopifyWriteback = useCallback(
    (orderId: string, merchantOrderId: string, actor: string, role: string) => {
      patchOrder(orderId, (o) => applyShopifyWriteback(o, merchantOrderId));
      logAction(
        orderId,
        "retry_shopify_writeback",
        actor,
        role,
        merchantOrderId,
      );
    },
    [patchOrder, logAction],
  );

  const runWriteback = useCallback(
    (orderId: string, actor: string, role: string) => {
      patchOrder(orderId, (o) => applyWritebackForOrder(o));
      logAction(orderId, "run_shopify_writeback", actor, role);
    },
    [patchOrder, logAction],
  );

  // Phase 4 — EasyPost label generation + delivery into Shopify.
  const generateLabel = useCallback(
    (orderId: string, merchantOrderId: string, actor: string, role: string) => {
      patchOrder(orderId, (o) => applyGenerateLabel(o, merchantOrderId));
      logAction(orderId, "generate_label", actor, role, merchantOrderId);
    },
    [patchOrder, logAction],
  );

  // Phase 5 — simulate an EasyPost tracking webhook advancing the shipment.
  const advanceTracking = useCallback(
    (orderId: string, merchantOrderId: string, actor: string, role: string) => {
      patchOrder(orderId, (o) => advanceTrackingTransform(o, merchantOrderId));
      logAction(orderId, "advance_tracking", actor, role, merchantOrderId);
    },
    [patchOrder, logAction],
  );

  // Phase 6 — returns + refunds.
  const requestReturn = useCallback(
    (
      orderId: string,
      merchantOrderId: string,
      items: { orderItemId: string; quantity: number; reason?: string }[],
      reason?: string,
    ) => {
      patchOrder(orderId, (o) =>
        createReturnRequest(o, merchantOrderId, items, reason),
      );
    },
    [patchOrder],
  );

  const approveReturn = useCallback(
    (orderId: string, returnId: string, actor: string, role: string) => {
      patchOrder(orderId, (o) => approveReturnTransform(o, returnId));
      logAction(orderId, "approve_return", actor, role, returnId);
    },
    [patchOrder, logAction],
  );

  const rejectReturn = useCallback(
    (orderId: string, returnId: string, actor: string, role: string) => {
      patchOrder(orderId, (o) => rejectReturnTransform(o, returnId));
      logAction(orderId, "reject_return", actor, role, returnId);
    },
    [patchOrder, logAction],
  );

  const advanceReturn = useCallback(
    (orderId: string, returnId: string, actor: string, role: string) => {
      patchOrder(orderId, (o) => advanceReturnTransform(o, returnId));
      logAction(orderId, "advance_return", actor, role, returnId);
    },
    [patchOrder, logAction],
  );

  const processRefund = useCallback(
    (
      orderId: string,
      opts: {
        amount: number;
        type: RefundType;
        reason?: string;
        merchantOrderId?: string;
        returnId?: string;
      },
      actor: string,
      role: string,
    ) => {
      patchOrder(orderId, (o) => processRefundTransform(o, opts));
      logAction(
        orderId,
        "process_refund",
        actor,
        role,
        `${opts.type} ${opts.amount}`,
      );
    },
    [patchOrder, logAction],
  );

  // Phase 7 — holds + notifications.
  const setPayoutHold = useCallback(
    (
      orderId: string,
      merchantOrderId: string,
      hold: boolean,
      actor: string,
      role: string,
      reason?: string,
    ) => {
      patchOrder(orderId, (o) =>
        setPayoutHoldTransform(o, merchantOrderId, hold, reason),
      );
      logAction(
        orderId,
        hold ? "hold_payout" : "release_payout",
        actor,
        role,
        merchantOrderId,
      );
    },
    [patchOrder, logAction],
  );

  const setOrderHold = useCallback(
    (orderId: string, hold: boolean, actor: string, role: string) => {
      patchOrder(orderId, (o) => setOrderHoldTransform(o, hold));
      logAction(orderId, hold ? "hold_order" : "release_order", actor, role);
    },
    [patchOrder, logAction],
  );

  const resendNotification = useCallback(
    (
      orderId: string,
      kind: "order_confirmation" | "shipping_update" | "delivery" | "refund",
      actor: string,
      role: string,
    ) => {
      patchOrder(orderId, (o) => resendNotificationTransform(o, kind));
      logAction(orderId, `resend_${kind}`, actor, role);
    },
    [patchOrder, logAction],
  );

  const resetDemo = useCallback(() => {
    setOrders(buildSeedOrders());
    setSeedVersion(SEED_VERSION);
  }, [setOrders, setSeedVersion]);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders],
  );

  return {
    orders: sorted,
    isHydrated,
    getOrder,
    patchOrder,
    appendEvent,
    addNote,
    logAction,
    processStripeEvent,
    simulateNewOrder,
    retryShopifyWriteback,
    runWriteback,
    generateLabel,
    advanceTracking,
    requestReturn,
    approveReturn,
    rejectReturn,
    advanceReturn,
    processRefund,
    setPayoutHold,
    setOrderHold,
    resendNotification,
    resetDemo,
  };
}
