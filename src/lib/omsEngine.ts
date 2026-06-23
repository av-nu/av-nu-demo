// avnu OMS — mock lifecycle engine + derived selectors.
//
// Pure, side-effect-free helpers used by the admin OMS demo. In the real
// avnu-marketplace these behaviours are backed by NestJS services + BullMQ
// jobs reacting to Stripe / Shopify / EasyPost webhooks. Here we simulate them
// so the demo can advance and surface orders into operational queues.
//
// Phase 1 implements the read/derive side (rollups, queues, search). Later
// phases (simulate order creation, writeback, label, tracking, returns,
// refunds) extend the mutation helpers stubbed at the bottom.

import {
  type MerchantOrder,
  type Order,
  type OrderEvent,
  type Refund,
  type RefundType,
  type ReturnRequest,
  type ShipmentStatus,
  type StripeCheckoutEvent,
  type TrackingEvent,
  type WebhookEvent,
  ORDER_NUMBER_START,
  buildNewPaidOrder,
  buildShopifyPayloadMeta,
  makeShopifyOrderRef,
  makeEasyPostShipment,
  makeReturnLabelShipment,
  parseOrderSeq,
  returnRefundAmount,
  rollupOrderStatus,
  formatUsd,
  humanizeStatus,
} from "@/data/oms";

// ---------------------------------------------------------------------------
// Needs-attention detection
// ---------------------------------------------------------------------------

export type AttentionReason = {
  code:
    | "writeback_failed"
    | "label_failed"
    | "delivery_exception"
    | "payout_hold"
    | "return_pending"
    | "refund_pending"
    | "unfulfilled_sla";
  label: string;
  merchantOrderId?: string;
};

// Orders older than this (days) that are still unfulfilled are SLA risks.
const UNFULFILLED_SLA_DAYS = 2;

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

export function attentionReasons(order: Order): AttentionReason[] {
  const reasons: AttentionReason[] = [];

  for (const m of order.merchantOrders) {
    if (m.shopifyWritebackStatus === "failed") {
      reasons.push({
        code: "writeback_failed",
        label: `Shopify writeback failed · ${m.vendorName}`,
        merchantOrderId: m.id,
      });
    }
    if (m.labelStatus === "failed") {
      reasons.push({
        code: "label_failed",
        label: `Label generation failed · ${m.vendorName}`,
        merchantOrderId: m.id,
      });
    }
    if (m.shipmentStatus === "delivery_exception") {
      reasons.push({
        code: "delivery_exception",
        label: `Delivery exception · ${m.vendorName}`,
        merchantOrderId: m.id,
      });
    }
    if (m.payoutStatus === "on_hold") {
      reasons.push({
        code: "payout_hold",
        label: `Payout on hold · ${m.vendorName}`,
        merchantOrderId: m.id,
      });
    }
    const unfulfilled =
      m.fulfillmentStatus === "unfulfilled" ||
      m.fulfillmentStatus === "partially_fulfilled";
    if (unfulfilled && daysSince(order.createdAt) > UNFULFILLED_SLA_DAYS) {
      reasons.push({
        code: "unfulfilled_sla",
        label: `Unfulfilled > ${UNFULFILLED_SLA_DAYS}d · ${m.vendorName}`,
        merchantOrderId: m.id,
      });
    }
  }

  for (const r of order.returns) {
    if (r.status === "requested") {
      reasons.push({ code: "return_pending", label: "Return awaiting review" });
    }
  }
  for (const rf of order.refunds) {
    if (rf.status === "pending" || rf.status === "processing") {
      reasons.push({ code: "refund_pending", label: "Refund pending" });
    }
  }

  return reasons;
}

export function needsAttention(order: Order): boolean {
  return attentionReasons(order).length > 0;
}

// ---------------------------------------------------------------------------
// Operational queues
// ---------------------------------------------------------------------------

export type QueueId =
  | "all"
  | "attention"
  | "writeback_failures"
  | "label_failures"
  | "unfulfilled"
  | "shipment_exceptions"
  | "delivered"
  | "returns"
  | "refunds_pending"
  | "payout_holds";

export type QueueDef = {
  id: QueueId;
  label: string;
  predicate: (order: Order) => boolean;
};

const anyMerchant = (order: Order, fn: (m: MerchantOrder) => boolean) =>
  order.merchantOrders.some(fn);

export const QUEUES: QueueDef[] = [
  { id: "all", label: "All orders", predicate: () => true },
  { id: "attention", label: "Needs attention", predicate: needsAttention },
  {
    id: "writeback_failures",
    label: "Shopify writeback failures",
    predicate: (o) => anyMerchant(o, (m) => m.shopifyWritebackStatus === "failed"),
  },
  {
    id: "label_failures",
    label: "Label failures",
    predicate: (o) => anyMerchant(o, (m) => m.labelStatus === "failed"),
  },
  {
    id: "unfulfilled",
    label: "Unfulfilled",
    predicate: (o) =>
      anyMerchant(
        o,
        (m) =>
          m.fulfillmentStatus === "unfulfilled" ||
          m.fulfillmentStatus === "partially_fulfilled",
      ),
  },
  {
    id: "shipment_exceptions",
    label: "Shipment exceptions",
    predicate: (o) =>
      anyMerchant(o, (m) =>
        ["delivery_exception", "returned_to_sender", "lost"].includes(
          m.shipmentStatus,
        ),
      ),
  },
  {
    id: "delivered",
    label: "Delivered",
    predicate: (o) =>
      o.merchantOrders.length > 0 &&
      o.merchantOrders.every((m) => m.shipmentStatus === "delivered"),
  },
  {
    id: "returns",
    label: "Return requests",
    predicate: (o) => o.returns.length > 0,
  },
  {
    id: "refunds_pending",
    label: "Refunds pending",
    predicate: (o) =>
      o.refunds.some((r) => r.status === "pending" || r.status === "processing"),
  },
  {
    id: "payout_holds",
    label: "Payout holds",
    predicate: (o) => anyMerchant(o, (m) => m.payoutStatus === "on_hold"),
  },
];

export function queueCounts(orders: Order[]): Record<QueueId, number> {
  const counts = {} as Record<QueueId, number>;
  for (const q of QUEUES) {
    counts[q.id] = orders.filter(q.predicate).length;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

// Mirrors the real admin search surface: avnu/merchant order numbers, customer
// email/name, merchant, Shopify ID/name, Stripe IDs, EasyPost shipment ID,
// tracking number, product title, SKU.
export function orderMatchesQuery(order: Order, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const haystack: string[] = [
    order.orderNumber,
    order.customer.name,
    order.customer.email,
    order.status,
    order.payment.stripePaymentIntentId ?? "",
    order.payment.stripeChargeId ?? "",
  ];

  for (const m of order.merchantOrders) {
    haystack.push(
      m.merchantOrderNumber,
      m.vendorName,
      m.vendorId,
      m.shopifyOrderId ?? "",
      m.shopifyOrderName ?? "",
      m.shipment?.easypostShipmentId ?? "",
      m.shipment?.trackingCode ?? "",
    );
    for (const it of m.items) {
      haystack.push(it.productTitle, it.sku ?? "", it.productId);
    }
  }

  return haystack.some((h) => h.toLowerCase().includes(q));
}

// ---------------------------------------------------------------------------
// Small display helpers
// ---------------------------------------------------------------------------

export function orderItemCount(order: Order): number {
  return order.merchantOrders.reduce(
    (sum, m) => sum + m.items.reduce((s, it) => s + it.quantity, 0),
    0,
  );
}

export function merchantSummary(order: Order): string {
  const names = order.merchantOrders.map((m) => m.vendorName);
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export function shipmentStatusLabel(m: MerchantOrder): string {
  return humanizeStatus(m.shipmentStatus);
}

// ---------------------------------------------------------------------------
// Lifecycle transforms (pure: Order in → new Order out)
// ---------------------------------------------------------------------------
// These mirror the real BullMQ jobs reacting to webhooks/admin actions. They
// are pure so the hook can apply them via patchOrder. Each appends to the
// immutable OrderEvent timeline and (where relevant) the WebhookEvent store.

let transformSeq = 0;
function uid(prefix: string): string {
  transformSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${transformSeq}`;
}

function event(
  order: Order,
  e: Omit<OrderEvent, "id" | "orderId" | "createdAt">,
): OrderEvent {
  return {
    ...e,
    id: uid("ev"),
    orderId: order.id,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Phase 3 — Shopify writeback for a single merchant order.
 *
 * Idempotent: a merchant order that is already `synced` is returned unchanged,
 * so retries never create a duplicate Shopify order. On success it stores the
 * Shopify order id/name + the tag/metafield payload, queues the order for
 * label generation (Phase 4), and records both an OrderEvent and a Shopify
 * `orders/create` WebhookEvent.
 */
export function applyShopifyWriteback(
  order: Order,
  merchantOrderId: string,
): Order {
  const index = order.merchantOrders.findIndex((m) => m.id === merchantOrderId);
  if (index < 0) return order;
  const m = order.merchantOrders[index];

  // Already written → no-op (idempotency / duplicate prevention).
  if (m.shopifyWritebackStatus === "synced" && m.shopifyOrderId) return order;

  const ref = makeShopifyOrderRef(order.orderNumber, index);
  const labelReady =
    m.labelStatus === "purchased" || m.labelStatus === "delivered_to_shopify";

  const updated: MerchantOrder = {
    ...m,
    shopifyWritebackStatus: "synced",
    shopifyOrderId: ref.shopifyOrderId,
    shopifyOrderName: ref.shopifyOrderName,
    shopifySync: {
      ...buildShopifyPayloadMeta(order, m),
      writtenAt: new Date().toISOString(),
    },
    // Queue label generation if it hasn't happened yet.
    labelStatus: labelReady ? m.labelStatus : "pending",
    shipmentStatus:
      m.shipmentStatus === "not_ready" ? "pending_label" : m.shipmentStatus,
  };

  const merchantOrders = [...order.merchantOrders];
  merchantOrders[index] = updated;

  const wh: WebhookEvent = {
    id: uid("wh"),
    orderId: order.id,
    source: "shopify",
    eventType: "orders/create",
    idempotencyKey: `${updated.vendorShopDomain}-${ref.shopifyOrderId}`,
    status: "processed",
    receivedAt: new Date().toISOString(),
    summary: `${updated.vendorName} ${ref.shopifyOrderName} created`,
  };

  return {
    ...order,
    merchantOrders,
    events: [
      ...order.events,
      event(order, {
        merchantOrderId,
        type: "shopify.writeback.succeeded",
        message: `Written to ${updated.vendorName} Shopify (${ref.shopifyOrderName})`,
        actor: "system",
      }),
    ],
    webhookEvents: [...order.webhookEvents, wh],
  };
}

/** Runs writeback for every merchant order still pending/failed. */
export function applyWritebackForOrder(order: Order): Order {
  return order.merchantOrders.reduce((acc, m) => {
    if (m.shopifyWritebackStatus === "synced") return acc;
    return applyShopifyWriteback(acc, m.id);
  }, order);
}

export function pendingWritebackCount(order: Order): number {
  return order.merchantOrders.filter(
    (m) => m.shopifyWritebackStatus !== "synced",
  ).length;
}

function replaceMerchant(
  order: Order,
  index: number,
  updated: MerchantOrder,
): MerchantOrder[] {
  const next = [...order.merchantOrders];
  next[index] = updated;
  return next;
}

/**
 * Idempotent Stripe checkout-event processing (Phase 2 core, extracted pure so
 * it is unit-testable). Re-processing the same event id or payment intent
 * returns the existing order instead of creating a duplicate.
 */
export function applyStripeCheckoutEvent(
  orders: Order[],
  event: StripeCheckoutEvent,
): { orders: Order[]; created: boolean; order: Order } {
  const existing = orders.find(
    (o) =>
      o.webhookEvents.some((w) => w.idempotencyKey === event.id) ||
      o.payment.stripePaymentIntentId === event.paymentIntentId,
  );
  if (existing) return { orders, created: false, order: existing };

  const maxSeq = orders.reduce(
    (m, o) => Math.max(m, parseOrderSeq(o.orderNumber)),
    ORDER_NUMBER_START - 1,
  );
  const order = buildNewPaidOrder(maxSeq + 1, event.checkout, {
    stripeEventId: event.id,
    paymentIntentId: event.paymentIntentId,
    createdAt: event.createdAt,
  });
  return { orders: [order, ...orders], created: true, order };
}

/**
 * Phase 4a — avnu purchases the EasyPost label for a merchant shipment.
 *
 * Idempotent: a label already purchased/delivered is a no-op (the label is
 * never bought twice). On success it stores the EasyPost shipment/tracker,
 * carrier/service, tracking number/url, label url, shipping cost and ETA, and
 * sets shipmentStatus = ready_for_fulfillment. Crucially fulfillmentStatus
 * stays `unfulfilled` — buying a label does NOT mark the order fulfilled.
 */
export function applyLabelPurchase(
  order: Order,
  merchantOrderId: string,
): Order {
  const index = order.merchantOrders.findIndex((m) => m.id === merchantOrderId);
  if (index < 0) return order;
  const m = order.merchantOrders[index];

  if (m.labelStatus === "purchased" || m.labelStatus === "delivered_to_shopify") {
    return order;
  }

  const shipment = makeEasyPostShipment(m.id);

  // Reflect the real shipping cost in the merchant transfer.
  const transfer = m.transfer
    ? {
        ...m.transfer,
        shippingDeduction: shipment.shippingCost ?? 0,
        netAmount:
          m.transfer.grossAmount -
          m.transfer.commissionAmount -
          (shipment.shippingCost ?? 0),
      }
    : m.transfer;

  const updated: MerchantOrder = {
    ...m,
    shipment,
    transfer,
    labelStatus: "purchased",
    shipmentStatus: "ready_for_fulfillment",
    // NOT fulfilled — explicit per the fulfillment rule.
    fulfillmentStatus: "unfulfilled",
  };

  return {
    ...order,
    merchantOrders: replaceMerchant(order, index, updated),
    events: [
      ...order.events,
      event(order, {
        merchantOrderId,
        type: "label.purchased",
        message: `EasyPost label purchased · ${shipment.carrier} ${shipment.service} · ${shipment.trackingCode} — ready for fulfillment (not yet fulfilled)`,
        actor: "system",
        metadata: {
          easypostShipmentId: shipment.easypostShipmentId ?? "",
          shippingCost: formatUsd(shipment.shippingCost ?? 0),
        },
      }),
    ],
  };
}

/**
 * Phase 4b — avnu delivers the purchased label/tracking into the merchant's
 * Shopify admin (metafields + note attributes). Requires writeback done and a
 * purchased label. Idempotent once delivered.
 */
export function applyLabelDelivery(
  order: Order,
  merchantOrderId: string,
): Order {
  const index = order.merchantOrders.findIndex((m) => m.id === merchantOrderId);
  if (index < 0) return order;
  const m = order.merchantOrders[index];

  if (m.labelStatus === "delivered_to_shopify") return order;
  if (m.labelStatus !== "purchased" || !m.shipment || !m.shopifySync) {
    return order;
  }

  const s = m.shipment;
  const easypostMeta = [
    {
      namespace: "avnu",
      key: "easypost_shipment_id",
      value: s.easypostShipmentId ?? "",
    },
    { namespace: "avnu", key: "tracking_number", value: s.trackingCode ?? "" },
    { namespace: "avnu", key: "label_url", value: s.labelUrl ?? "" },
  ];
  const easypostNotes = [
    { name: "avnu_tracking_number", value: s.trackingCode ?? "" },
    { name: "avnu_label_url", value: s.labelUrl ?? "" },
  ];

  const updated: MerchantOrder = {
    ...m,
    labelStatus: "delivered_to_shopify",
    shopifySync: {
      ...m.shopifySync,
      metafields: [...m.shopifySync.metafields, ...easypostMeta],
      noteAttributes: [...m.shopifySync.noteAttributes, ...easypostNotes],
    },
  };

  return {
    ...order,
    merchantOrders: replaceMerchant(order, index, updated),
    events: [
      ...order.events,
      event(order, {
        merchantOrderId,
        type: "label.delivered_to_shopify",
        message: `Label + tracking delivered to ${m.vendorName} Shopify admin`,
        actor: "system",
      }),
    ],
  };
}

/** Convenience: purchase the label then deliver it to Shopify. */
export function applyGenerateLabel(
  order: Order,
  merchantOrderId: string,
): Order {
  return applyLabelDelivery(
    applyLabelPurchase(order, merchantOrderId),
    merchantOrderId,
  );
}

export function pendingLabelCount(order: Order): number {
  return order.merchantOrders.filter(
    (m) =>
      m.shopifyWritebackStatus === "synced" &&
      m.labelStatus !== "purchased" &&
      m.labelStatus !== "delivered_to_shopify" &&
      m.labelStatus !== "not_required",
  ).length;
}

// ---------------------------------------------------------------------------
// Phase 5 — EasyPost tracking + customer status
// ---------------------------------------------------------------------------

const TRACKING_MESSAGES: Record<ShipmentStatus, string> = {
  pre_transit: "Shipping label scanned — carrier has the package",
  in_transit: "Package in transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  delivery_exception: "Delivery exception reported by carrier",
  returned_to_sender: "Package being returned to sender",
  lost: "Carrier reported package as lost",
  not_ready: "",
  pending_label: "",
  label_created: "",
  ready_for_fulfillment: "",
  fulfilled_pending_carrier_scan: "",
  cancelled: "",
  label_voided: "",
  unknown: "",
};

// Next tracking status in the normal delivery lifecycle.
function nextTrackingStatus(current: ShipmentStatus): ShipmentStatus | null {
  switch (current) {
    case "label_created":
    case "ready_for_fulfillment":
    case "fulfilled_pending_carrier_scan":
      return "pre_transit";
    case "pre_transit":
      return "in_transit";
    case "in_transit":
      return "out_for_delivery";
    case "delivery_exception":
      return "out_for_delivery";
    case "out_for_delivery":
      return "delivered";
    default:
      return null;
  }
}

/**
 * Applies an EasyPost tracker update to a merchant shipment.
 *
 * Idempotent: keyed on tracker id + status via the WebhookEvent store, so the
 * same carrier scan never double-advances. A carrier scan (pre_transit/
 * in_transit) auto-marks the merchant order fulfilled per business rules,
 * rolls up the parent order status, and emits customer notifications on
 * "shipped" and "delivered".
 */
export function applyTrackingEvent(
  order: Order,
  merchantOrderId: string,
  status: ShipmentStatus,
): Order {
  const index = order.merchantOrders.findIndex((m) => m.id === merchantOrderId);
  if (index < 0) return order;
  const m = order.merchantOrders[index];
  if (!m.shipment) return order;

  const idempotencyKey = `${m.shipment.easypostTrackerId ?? m.id}-${status}`;
  if (order.webhookEvents.some((w) => w.idempotencyKey === idempotencyKey)) {
    return order; // duplicate carrier scan — ignore
  }

  const now = new Date().toISOString();
  const trackingEvent: TrackingEvent = {
    id: uid("te"),
    status,
    message: TRACKING_MESSAGES[status] || humanizeStatus(status),
    location: status === "delivered" ? "Front door" : "In network",
    occurredAt: now,
  };

  const carrierScanned =
    status === "in_transit" ||
    status === "out_for_delivery" ||
    status === "delivered";

  const updated: MerchantOrder = {
    ...m,
    shipment: {
      ...m.shipment,
      status,
      trackingEvents: [...m.shipment.trackingEvents, trackingEvent],
    },
    shipmentStatus: status,
    // Carrier scan advances fulfillment per the auto-mark rule.
    fulfillmentStatus: carrierScanned ? "fulfilled" : m.fulfillmentStatus,
  };

  const events: OrderEvent[] = [
    event(order, {
      merchantOrderId,
      type: `tracking.${status}`,
      message: `${m.vendorName}: ${trackingEvent.message}`,
      actor: "system",
    }),
  ];
  // Customer notifications.
  if (status === "in_transit") {
    events.push(
      event(order, {
        merchantOrderId,
        type: "notification.shipping_sent",
        message: `Shipping confirmation emailed to customer · ${m.shipment.trackingCode}`,
        actor: "system",
      }),
    );
  }
  if (status === "delivered") {
    events.push(
      event(order, {
        merchantOrderId,
        type: "notification.delivered_sent",
        message: "Delivery confirmation emailed to customer",
        actor: "system",
      }),
    );
  }

  const wh: WebhookEvent = {
    id: uid("wh"),
    orderId: order.id,
    source: "easypost",
    eventType: "tracker.updated",
    idempotencyKey,
    status: "processed",
    receivedAt: now,
    summary: `${m.shipment.trackingCode} → ${humanizeStatus(status)}`,
  };

  const merchantOrders = replaceMerchant(order, index, updated);

  return {
    ...order,
    merchantOrders,
    status: rollupOrderStatus(merchantOrders),
    events: [...order.events, ...events],
    webhookEvents: [...order.webhookEvents, wh],
  };
}

/** Advances a merchant shipment to the next tracking status (no-op if delivered). */
export function advanceTracking(order: Order, merchantOrderId: string): Order {
  const m = order.merchantOrders.find((x) => x.id === merchantOrderId);
  if (!m) return order;
  const next = nextTrackingStatus(m.shipmentStatus);
  if (!next) return order;
  return applyTrackingEvent(order, merchantOrderId, next);
}

export function canAdvanceTracking(m: MerchantOrder): boolean {
  if (!m.shipment) return false;
  if (m.labelStatus !== "purchased" && m.labelStatus !== "delivered_to_shopify")
    return false;
  return nextTrackingStatus(m.shipmentStatus) !== null;
}

// ---------------------------------------------------------------------------
// Phase 6 — returns + refunds
// ---------------------------------------------------------------------------

function replaceReturn(
  order: Order,
  returnId: string,
  patch: (r: ReturnRequest) => ReturnRequest,
): ReturnRequest[] {
  return order.returns.map((r) => (r.id === returnId ? patch(r) : r));
}

function setMerchantReturnStatus(
  order: Order,
  merchantOrderId: string,
  patch: Partial<MerchantOrder>,
): MerchantOrder[] {
  return order.merchantOrders.map((m) =>
    m.id === merchantOrderId ? { ...m, ...patch } : m,
  );
}

/** Customer requests a return for specific items + quantities. */
export function createReturnRequest(
  order: Order,
  merchantOrderId: string,
  items: { orderItemId: string; quantity: number; reason?: string }[],
  reason?: string,
): Order {
  const m = order.merchantOrders.find((x) => x.id === merchantOrderId);
  if (!m || items.length === 0) return order;

  const returnId = uid("ret");
  const ret: ReturnRequest = {
    id: returnId,
    orderId: order.id,
    merchantOrderId,
    status: "requested",
    reason,
    createdAt: new Date().toISOString(),
    items: items.map((i) => {
      const item = m.items.find((it) => it.id === i.orderItemId);
      return {
        id: uid("reti"),
        orderItemId: i.orderItemId,
        productTitle: item?.productTitle ?? "Item",
        quantity: i.quantity,
        reason: i.reason ?? reason,
      };
    }),
  };

  return {
    ...order,
    returns: [...order.returns, ret],
    merchantOrders: setMerchantReturnStatus(order, merchantOrderId, {
      returnStatus: "requested",
    }),
    events: [
      ...order.events,
      event(order, {
        merchantOrderId,
        type: "return.requested",
        message: `Return requested · ${ret.items
          .map((i) => `${i.quantity}× ${i.productTitle}`)
          .join(", ")}`,
        actor: "customer",
      }),
    ],
  };
}

/** Admin approves a return and avnu generates the EasyPost return label. */
export function approveReturn(order: Order, returnId: string): Order {
  const ret = order.returns.find((r) => r.id === returnId);
  if (!ret || ret.status !== "requested") return order;

  const shipment = makeReturnLabelShipment(ret.merchantOrderId);

  return {
    ...order,
    returns: replaceReturn(order, returnId, (r) => ({
      ...r,
      status: "label_created",
      returnShipment: shipment,
    })),
    merchantOrders: setMerchantReturnStatus(order, ret.merchantOrderId, {
      returnStatus: "label_created",
    }),
    events: [
      ...order.events,
      event(order, {
        merchantOrderId: ret.merchantOrderId,
        type: "return.approved",
        message: `Return approved · EasyPost return label ${shipment.trackingCode} generated`,
        actor: "admin",
      }),
    ],
  };
}

export function rejectReturn(order: Order, returnId: string): Order {
  const ret = order.returns.find((r) => r.id === returnId);
  if (!ret || ret.status !== "requested") return order;
  return {
    ...order,
    returns: replaceReturn(order, returnId, (r) => ({ ...r, status: "rejected" })),
    merchantOrders: setMerchantReturnStatus(order, ret.merchantOrderId, {
      returnStatus: "rejected",
    }),
    events: [
      ...order.events,
      event(order, {
        merchantOrderId: ret.merchantOrderId,
        type: "return.rejected",
        message: "Return request rejected",
        actor: "admin",
      }),
    ],
  };
}

const RETURN_FLOW: Record<string, ReturnRequest["status"] | null> = {
  label_created: "in_transit",
  in_transit: "delivered",
  delivered: "inspected",
};

/** Advances the return shipment (carrier scan) or marks it inspected. */
export function advanceReturn(order: Order, returnId: string): Order {
  const ret = order.returns.find((r) => r.id === returnId);
  if (!ret) return order;
  const next = RETURN_FLOW[ret.status];
  if (!next) return order;

  const now = new Date().toISOString();
  const isScan = next === "in_transit" || next === "delivered";

  const updatedReturns = replaceReturn(order, returnId, (r) => ({
    ...r,
    status: next,
    returnShipment:
      r.returnShipment && isScan
        ? {
            ...r.returnShipment,
            status: next === "delivered" ? "delivered" : "in_transit",
            trackingEvents: [
              ...r.returnShipment.trackingEvents,
              {
                id: uid("te"),
                status: (next === "delivered"
                  ? "delivered"
                  : "in_transit") as ShipmentStatus,
                message:
                  next === "delivered"
                    ? "Return delivered to merchant"
                    : "Return in transit",
                occurredAt: now,
              },
            ],
          }
        : r.returnShipment,
  }));

  const events: OrderEvent[] = [
    event(order, {
      merchantOrderId: ret.merchantOrderId,
      type: `return.${next}`,
      message:
        next === "inspected"
          ? "Return received and inspected — ready to refund"
          : next === "delivered"
            ? "Return delivered to merchant"
            : "Return in transit",
      actor: next === "inspected" ? "admin" : "system",
    }),
  ];

  const webhookEvents = isScan
    ? [
        ...order.webhookEvents,
        {
          id: uid("wh"),
          orderId: order.id,
          source: "easypost" as const,
          eventType: "tracker.updated",
          idempotencyKey: `${ret.returnShipment?.easypostTrackerId ?? returnId}-${next}`,
          status: "processed" as const,
          receivedAt: now,
          summary: `Return ${ret.returnShipment?.trackingCode ?? ""} → ${humanizeStatus(next)}`,
        },
      ]
    : order.webhookEvents;

  return {
    ...order,
    returns: updatedReturns,
    merchantOrders: setMerchantReturnStatus(order, ret.merchantOrderId, {
      returnStatus: next,
    }),
    events: [...order.events, ...events],
    webhookEvents,
  };
}

/**
 * avnu-controlled Stripe refund. Updates the Refund record, payment, merchant
 * order refund + payout status, the linked return, and item returned-quantity,
 * then re-rolls the parent order status.
 */
export function processRefund(
  order: Order,
  opts: {
    amount: number;
    type: RefundType;
    reason?: string;
    merchantOrderId?: string;
    returnId?: string;
  },
): Order {
  if (opts.amount <= 0) return order;

  const ret = opts.returnId
    ? order.returns.find((r) => r.id === opts.returnId)
    : undefined;
  const merchantOrderId = opts.merchantOrderId ?? ret?.merchantOrderId;

  const refund: Refund = {
    id: uid("rf"),
    orderId: order.id,
    merchantOrderId,
    stripeRefundId: `re_${Date.now().toString(36)}`,
    type: opts.type,
    amount: opts.amount,
    reason: opts.reason,
    status: "succeeded",
    createdAt: new Date().toISOString(),
  };

  const refundedAmount = order.payment.refundedAmount + opts.amount;
  const paymentStatus =
    refundedAmount >= order.grandTotal ? "refunded" : "partially_refunded";

  // Which merchant orders does this refund touch? A targeted/return refund hits
  // one; an order-level refund (no target) cascades to all merchant orders.
  const affected = new Set(
    merchantOrderId
      ? [merchantOrderId]
      : order.merchantOrders.map((m) => m.id),
  );
  const merchantOrders = order.merchantOrders.map((m): MerchantOrder => {
    if (!affected.has(m.id)) return m;
    const fully = opts.amount >= m.total;
    let items = m.items;
    if (ret) {
      items = m.items.map((it) => {
        const ri = ret.items.find((x) => x.orderItemId === it.id);
        return ri
          ? { ...it, returnedQuantity: it.returnedQuantity + ri.quantity }
          : it;
      });
    }
    return {
      ...m,
      items,
      refundStatus: fully ? "succeeded" : "partially_refunded",
      payoutStatus: m.transfer ? "reversed" : m.payoutStatus,
      returnStatus: ret ? "refunded" : m.returnStatus,
    };
  });

  const returns = opts.returnId
    ? replaceReturn(order, opts.returnId, (r) => ({
        ...r,
        status: "refunded",
        refundId: refund.id,
      }))
    : order.returns;

  const next: Order = {
    ...order,
    payment: { ...order.payment, refundedAmount, status: paymentStatus },
    paymentStatus,
    refunds: [...order.refunds, refund],
    merchantOrders,
    returns,
    events: [
      ...order.events,
      event(order, {
        merchantOrderId,
        type: "refund.processed",
        message: `${humanizeStatus(opts.type)} refund issued · ${formatUsd(opts.amount)}`,
        actor: "admin",
      }),
    ],
    webhookEvents: [
      ...order.webhookEvents,
      {
        id: uid("wh"),
        orderId: order.id,
        source: "stripe",
        eventType: "charge.refunded",
        idempotencyKey: refund.stripeRefundId ?? refund.id,
        status: "processed",
        receivedAt: new Date().toISOString(),
        summary: `${formatUsd(opts.amount)} refunded`,
      },
    ],
  };

  next.status = rollupOrderStatus(next.merchantOrders);
  return next;
}

/** Default refund amount for a return (item value + tax). */
export { returnRefundAmount };

// ---------------------------------------------------------------------------
// Phase 7 — holds, notifications, exports
// ---------------------------------------------------------------------------

/** Hold or release a merchant payout (populates the Payout holds queue). */
export function setPayoutHold(
  order: Order,
  merchantOrderId: string,
  hold: boolean,
  reason?: string,
): Order {
  const m = order.merchantOrders.find((x) => x.id === merchantOrderId);
  if (!m) return order;
  const released: MerchantOrder["payoutStatus"] =
    m.shipmentStatus === "delivered" ? "completed" : "scheduled";
  return {
    ...order,
    merchantOrders: order.merchantOrders.map((x) =>
      x.id === merchantOrderId
        ? {
            ...x,
            payoutStatus: hold ? "on_hold" : released,
            transfer: x.transfer
              ? {
                  ...x.transfer,
                  status: hold ? "on_hold" : released,
                  holdReason: hold ? reason ?? "Manual hold" : undefined,
                }
              : x.transfer,
          }
        : x,
    ),
    events: [
      ...order.events,
      event(order, {
        merchantOrderId,
        type: hold ? "payout.held" : "payout.released",
        message: hold
          ? `Payout held for ${m.vendorName}${reason ? ` · ${reason}` : ""}`
          : `Payout released for ${m.vendorName}`,
        actor: "admin",
      }),
    ],
  };
}

/** Put the whole order on hold or release it back to its rolled-up status. */
export function setOrderHold(order: Order, hold: boolean): Order {
  const next: Order = {
    ...order,
    status: hold ? "on_hold" : rollupOrderStatus(order.merchantOrders),
    events: [
      ...order.events,
      event(order, {
        type: hold ? "order.held" : "order.released",
        message: hold ? "Order placed on hold" : "Order hold released",
        actor: "admin",
      }),
    ],
  };
  return next;
}

/** Re-send a customer notification (records it on the timeline). */
export function resendNotification(
  order: Order,
  kind: "order_confirmation" | "shipping_update" | "delivery" | "refund",
): Order {
  const labels: Record<typeof kind, string> = {
    order_confirmation: "Order confirmation",
    shipping_update: "Shipping update",
    delivery: "Delivery confirmation",
    refund: "Refund confirmation",
  };
  return {
    ...order,
    events: [
      ...order.events,
      event(order, {
        type: "notification.resent",
        message: `${labels[kind]} re-sent to ${order.customer.email}`,
        actor: "admin",
      }),
    ],
  };
}

/** Remaining refundable amount on an order. */
export function refundableRemaining(order: Order): number {
  return Math.max(0, order.grandTotal - order.payment.refundedAmount);
}

// CSV export of orders for the admin list. Flat, one row per order.
export function ordersToCsv(orders: Order[]): string {
  const headers = [
    "order_number",
    "created_at",
    "customer_name",
    "customer_email",
    "status",
    "payment_status",
    "merchants",
    "items",
    "grand_total_usd",
    "refunded_usd",
  ];
  const rows = orders.map((o) => [
    o.orderNumber,
    new Date(o.createdAt).toISOString(),
    o.customer.name,
    o.customer.email,
    o.status,
    o.paymentStatus,
    o.merchantOrders.map((m) => m.vendorName).join(" | "),
    String(orderItemCount(o)),
    (o.grandTotal / 100).toFixed(2),
    (o.payment.refundedAmount / 100).toFixed(2),
  ]);
  const escape = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  return [headers, ...rows]
    .map((r) => r.map((c) => escape(String(c))).join(","))
    .join("\n");
}
