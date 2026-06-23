"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Package, Truck, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { useOmsOrders } from "@/hooks/useOmsOrders";
import { useAdminRole, ADMIN_ROLE_LABELS } from "@/hooks/useAdminRole";
import { attentionReasons, canAdvanceTracking } from "@/lib/omsEngine";
import { useToast } from "@/components/ui/Toast";
import { ManualRefundDialog } from "@/components/oms/ManualRefundDialog";
import {
  type MerchantOrder,
  type Order,
  type ReturnRequest,
  formatUsd,
  humanizeStatus,
  returnRefundAmount,
} from "@/data/oms";
import { StatusBadge, StatusField } from "@/components/oms/StatusBadge";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    getOrder,
    isHydrated,
    addNote,
    retryShopifyWriteback,
    generateLabel,
    advanceTracking,
    approveReturn,
    rejectReturn,
    advanceReturn,
    processRefund,
    setPayoutHold,
    setOrderHold,
    resendNotification,
  } = useOmsOrders();
  const { role, can } = useAdminRole();
  const { showToast, ToastContainer } = useToast();
  const [noteDraft, setNoteDraft] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);

  if (!isHydrated) {
    return <p className="text-sm text-text/50">Loading order…</p>;
  }

  const order = getOrder(params.id);
  if (!order) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="rounded-xl border border-divider/60 bg-bg px-4 py-8 text-center text-sm text-text/50">
          Order not found.
        </p>
      </div>
    );
  }

  const reasons = attentionReasons(order);

  const submitNote = () => {
    if (!noteDraft.trim() || !can("edit_order_notes")) return;
    addNote(order.id, ADMIN_ROLE_LABELS[role], noteDraft);
    setNoteDraft("");
  };

  const onWriteback = (merchantOrderId: string, vendorName: string) => {
    if (!can("retry_shopify_writeback")) {
      showToast("Your role can't run Shopify writeback", "error");
      return;
    }
    retryShopifyWriteback(order.id, merchantOrderId, ADMIN_ROLE_LABELS[role], role);
    showToast(`Shopify writeback queued for ${vendorName}`);
  };

  const onGenerateLabel = (merchantOrderId: string, vendorName: string) => {
    if (!can("retry_label_generation")) {
      showToast("Your role can't generate labels", "error");
      return;
    }
    generateLabel(order.id, merchantOrderId, ADMIN_ROLE_LABELS[role], role);
    showToast(`Label generated & delivered to ${vendorName} Shopify`);
  };

  const onAdvanceTracking = (merchantOrderId: string, vendorName: string) => {
    if (!can("retry_label_generation")) {
      showToast("Your role can't update tracking", "error");
      return;
    }
    advanceTracking(order.id, merchantOrderId, ADMIN_ROLE_LABELS[role], role);
    showToast(`Simulated carrier scan for ${vendorName}`);
  };

  const roleLabel = ADMIN_ROLE_LABELS[role];

  const onApproveReturn = (ret: ReturnRequest) => {
    if (!can("approve_returns")) return showToast("Not permitted", "error");
    approveReturn(order.id, ret.id, roleLabel, role);
    showToast("Return approved — EasyPost return label generated");
  };
  const onRejectReturn = (ret: ReturnRequest) => {
    if (!can("approve_returns")) return showToast("Not permitted", "error");
    rejectReturn(order.id, ret.id, roleLabel, role);
    showToast("Return rejected");
  };
  const onAdvanceReturn = (ret: ReturnRequest) => {
    advanceReturn(order.id, ret.id, roleLabel, role);
    showToast("Return status advanced");
  };
  const onRefundReturn = (ret: ReturnRequest) => {
    if (!can("process_refunds")) return showToast("Not permitted", "error");
    const amount = returnRefundAmount(order, ret);
    processRefund(
      order.id,
      { amount, type: "item", reason: "Return received", returnId: ret.id },
      roleLabel,
      role,
    );
    showToast(`Refund issued · ${formatUsd(amount)}`);
  };

  const onManualRefund = (
    amount: number,
    type: Parameters<typeof processRefund>[1]["type"],
    reason: string,
  ) => {
    processRefund(
      order.id,
      { amount, type, reason: reason || "Manual refund" },
      roleLabel,
      role,
    );
    setRefundOpen(false);
    showToast(`Refund issued · ${formatUsd(amount)}`);
  };

  const onToggleOrderHold = () => {
    const hold = order.status !== "on_hold";
    setOrderHold(order.id, hold, roleLabel, role);
    showToast(hold ? "Order placed on hold" : "Order hold released");
  };

  const onTogglePayoutHold = (m: MerchantOrder) => {
    if (!can("manage_payouts")) return showToast("Not permitted", "error");
    const hold = m.payoutStatus !== "on_hold";
    setPayoutHold(order.id, m.id, hold, roleLabel, role);
    showToast(hold ? `Payout held for ${m.vendorName}` : `Payout released for ${m.vendorName}`);
  };

  const onResend = (
    kind: "order_confirmation" | "shipping_update" | "delivery" | "refund",
    label: string,
  ) => {
    resendNotification(order.id, kind, roleLabel, role);
    showToast(`${label} re-sent`);
  };

  const refundDisabled =
    !can("process_refunds") || order.payment.refundedAmount >= order.grandTotal;

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-2xl tracking-tight">
              {order.orderNumber}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-text/50">
            Placed{" "}
            {new Date(order.createdAt).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            · {order.merchantOrders.length} merchant order
            {order.merchantOrders.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text/50">Order total</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatUsd(order.grandTotal)}
          </p>
        </div>
      </div>

      {/* Attention banner */}
      {reasons.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Needs attention</p>
            <ul className="mt-0.5 list-disc pl-4">
              {reasons.map((r, i) => (
                <li key={i}>{r.label}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.8fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          {order.merchantOrders.map((m) => (
            <MerchantOrderPanel
              key={m.id}
              m={m}
              canWriteback={can("retry_shopify_writeback")}
              onWriteback={() => onWriteback(m.id, m.vendorName)}
              canLabel={can("retry_label_generation")}
              onGenerateLabel={() => onGenerateLabel(m.id, m.vendorName)}
              canTrack={can("retry_label_generation")}
              onAdvanceTracking={() => onAdvanceTracking(m.id, m.vendorName)}
              canPayout={can("manage_payouts")}
              onTogglePayout={() => onTogglePayoutHold(m)}
            />
          ))}

          {/* Returns / refunds */}
          {(order.returns.length > 0 || order.refunds.length > 0) && (
            <ReturnsRefundsPanel
              order={order}
              canApprove={can("approve_returns")}
              canRefund={can("process_refunds")}
              onApprove={onApproveReturn}
              onReject={onRejectReturn}
              onAdvance={onAdvanceReturn}
              onRefund={onRefundReturn}
            />
          )}

          {/* Timeline */}
          <TimelinePanel order={order} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <OrderActionsCard
            order={order}
            onHoldToggle={onToggleOrderHold}
            onRefund={() => setRefundOpen(true)}
            refundDisabled={refundDisabled}
            onResend={onResend}
          />
          <CustomerPanel order={order} canViewPii={true} />
          <PaymentPanel order={order} canViewStripe={can("view_payouts")} />
          <NotesPanel
            order={order}
            noteDraft={noteDraft}
            setNoteDraft={setNoteDraft}
            onSubmit={submitNote}
            canEdit={can("edit_order_notes")}
          />
          <WebhookPanel order={order} />
          <AdminActivityPanel order={order} />
        </div>
      </div>

      {refundOpen && (
        <ManualRefundDialog
          order={order}
          onClose={() => setRefundOpen(false)}
          onSubmit={onManualRefund}
        />
      )}
      <ToastContainer />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/orders"
      className="inline-flex items-center gap-1.5 text-sm text-text/50 transition-colors hover:text-text"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to orders
    </Link>
  );
}

function Card({
  title,
  icon,
  children,
  right,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-divider/60 bg-bg">
      <div className="flex items-center justify-between gap-2 border-b border-divider/60 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </h2>
        {right}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function MerchantOrderPanel({
  m,
  canWriteback,
  onWriteback,
  canLabel,
  onGenerateLabel,
  canTrack,
  onAdvanceTracking,
  canPayout,
  onTogglePayout,
}: {
  m: MerchantOrder;
  canWriteback: boolean;
  onWriteback: () => void;
  canLabel: boolean;
  onGenerateLabel: () => void;
  canTrack: boolean;
  onAdvanceTracking: () => void;
  canPayout: boolean;
  onTogglePayout: () => void;
}) {
  const needsWriteback = m.shopifyWritebackStatus !== "synced";
  const needsLabel =
    m.shopifyWritebackStatus === "synced" &&
    m.labelStatus !== "purchased" &&
    m.labelStatus !== "delivered_to_shopify" &&
    m.labelStatus !== "not_required";
  const labelDelivered = m.labelStatus === "delivered_to_shopify";
  const trackable = canAdvanceTracking(m);
  return (
    <Card
      title={`${m.vendorName} · ${m.merchantOrderNumber}`}
      icon={<Package className="h-4 w-4 text-text/40" />}
      right={
        m.shopifyOrderName ? (
          <span className="inline-flex items-center gap-1 text-xs text-text/50">
            Shopify {m.shopifyOrderName}
            <ExternalLink className="h-3 w-3" />
          </span>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Items */}
        <ul className="space-y-2">
          {m.items.map((it) => (
            <li key={it.id} className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.image && (
                  <img
                    src={it.image}
                    alt={it.productTitle}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{it.productTitle}</p>
                <p className="text-xs text-text/40">
                  SKU {it.sku} · Qty {it.quantity}
                  {it.returnedQuantity > 0 && ` · ${it.returnedQuantity} returned`}
                </p>
              </div>
              <p className="text-sm tabular-nums">
                {formatUsd(it.unitPrice * it.quantity)}
              </p>
            </li>
          ))}
        </ul>

        {/* Statuses */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg bg-surface px-3 py-3 sm:grid-cols-2">
          <StatusField label="Fulfillment" status={m.fulfillmentStatus} />
          <StatusField label="Shipment" status={m.shipmentStatus} />
          <StatusField label="Shopify writeback" status={m.shopifyWritebackStatus} />
          <StatusField label="Label" status={m.labelStatus} />
          <StatusField label="Payout" status={m.payoutStatus} />
          {m.returnStatus && (
            <StatusField label="Return" status={m.returnStatus} />
          )}
        </div>

        {/* Shopify writeback action + payload */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {needsWriteback && (
              <button
                type="button"
                onClick={onWriteback}
                disabled={!canWriteback}
                className="inline-flex items-center gap-1.5 rounded-lg bg-burgundy px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {m.shopifyWritebackStatus === "failed"
                  ? "Retry Shopify writeback"
                  : "Run Shopify writeback"}
              </button>
            )}
            {needsLabel && (
              <button
                type="button"
                onClick={onGenerateLabel}
                disabled={!canLabel}
                className="inline-flex items-center gap-1.5 rounded-lg bg-burgundy px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {m.labelStatus === "failed"
                  ? "Retry label generation"
                  : "Generate label"}
              </button>
            )}
            {labelDelivered && m.shipment?.labelUrl && (
              <a
                href={m.shipment.labelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-divider/60 bg-bg px-3 py-1.5 text-xs font-medium text-text/70 transition-colors hover:bg-surface"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View label PDF
              </a>
            )}
            {trackable && (
              <button
                type="button"
                onClick={onAdvanceTracking}
                disabled={!canTrack}
                className="inline-flex items-center gap-1.5 rounded-lg border border-divider/60 bg-bg px-3 py-1.5 text-xs font-medium text-text/70 transition-colors hover:bg-surface disabled:opacity-40"
              >
                <Truck className="h-3.5 w-3.5" />
                Simulate carrier scan
              </button>
            )}
            {m.transfer && (
              <button
                type="button"
                onClick={onTogglePayout}
                disabled={!canPayout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-divider/60 bg-bg px-3 py-1.5 text-xs font-medium text-text/70 transition-colors hover:bg-surface disabled:opacity-40"
              >
                {m.payoutStatus === "on_hold" ? "Release payout" : "Hold payout"}
              </button>
            )}
          </div>
          {m.shopifySync && (
            <details className="rounded-lg border border-divider/60 px-3 py-2 text-xs">
              <summary className="cursor-pointer text-text/60">
                Shopify payload · written{" "}
                {new Date(m.shopifySync.writtenAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <p className="text-text/40">Tags</p>
                  <p className="font-mono">{m.shopifySync.tags.join(", ")}</p>
                </div>
                <div>
                  <p className="text-text/40">Metafields</p>
                  <ul className="space-y-0.5 font-mono">
                    {m.shopifySync.metafields.map((mf) => (
                      <li key={`${mf.namespace}.${mf.key}`}>
                        {mf.namespace}.{mf.key}: {mf.value}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          )}
        </div>

        {/* Shipment / tracking */}
        {m.shipment && (
          <div className="rounded-lg border border-divider/60 px-3 py-3 text-sm">
            <div className="mb-2 flex items-center gap-2 text-text/70">
              <Truck className="h-4 w-4" />
              <span className="font-medium">
                {m.shipment.carrier ?? "Carrier"}{" "}
                {m.shipment.service ?? ""}
              </span>
              {m.shipment.trackingCode && (
                <span className="text-text/40">· {m.shipment.trackingCode}</span>
              )}
            </div>
            {m.shipment.estimatedDeliveryDate && (
              <p className="mb-2 text-xs text-text/40">
                Est. delivery{" "}
                {new Date(m.shipment.estimatedDeliveryDate).toLocaleDateString(
                  "en-US",
                  { dateStyle: "medium" },
                )}
                {m.shipment.easypostShipmentId
                  ? ` · ${m.shipment.easypostShipmentId}`
                  : ""}
              </p>
            )}
            {m.shipment.trackingEvents.length > 0 ? (
              <ol className="space-y-1.5">
                {m.shipment.trackingEvents.map((te) => (
                  <li key={te.id} className="flex items-start gap-2 text-xs">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="text-text/70">
                      <span className="font-medium text-text">
                        {humanizeStatus(te.status)}
                      </span>{" "}
                      — {te.message}
                      {te.location ? ` (${te.location})` : ""}
                      <span className="block text-text/40">
                        {new Date(te.occurredAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-text/40">No tracking scans yet.</p>
            )}
          </div>
        )}

        {/* Transfer summary */}
        {m.transfer && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
            <Money label="Gross" value={m.transfer.grossAmount} />
            <Money
              label={`Commission (${Math.round(m.transfer.commissionRate * 100)}%)`}
              value={-m.transfer.commissionAmount}
            />
            <Money label="Shipping" value={-m.transfer.shippingDeduction} />
            <Money label="Net payout" value={m.transfer.netAmount} strong />
          </div>
        )}
      </div>
    </Card>
  );
}

function Money({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-text/40">{label}</p>
      <p className={cn("tabular-nums", strong && "font-semibold")}>
        {formatUsd(value)}
      </p>
    </div>
  );
}

function CustomerPanel({
  order,
  canViewPii,
}: {
  order: Order;
  canViewPii: boolean;
}) {
  const a = order.customer.shippingAddress;
  return (
    <Card title="Customer">
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium">{order.customer.name}</p>
          <p className="text-text/50">
            {canViewPii ? order.customer.email : "•••• hidden ••••"}
          </p>
          {order.customer.phone && canViewPii && (
            <p className="text-text/50">{order.customer.phone}</p>
          )}
        </div>
        <div className="border-t border-divider/60 pt-3">
          <p className="text-xs font-medium text-text/40">Shipping address</p>
          {canViewPii ? (
            <address className="mt-1 not-italic text-text/70">
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}
              <br />
              {a.city}, {a.state} {a.zip}
              <br />
              {a.country}
            </address>
          ) : (
            <p className="mt-1 text-text/40">Hidden for this role</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function PaymentPanel({
  order,
  canViewStripe,
}: {
  order: Order;
  canViewStripe: boolean;
}) {
  const p = order.payment;
  return (
    <Card title="Payment">
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text/50">Status</span>
          <StatusBadge status={p.status} />
        </div>
        <Row label="Subtotal" value={formatUsd(order.subtotal)} />
        <Row label="Shipping" value={formatUsd(order.shippingTotal)} />
        <Row label="Tax" value={formatUsd(order.taxTotal)} />
        <Row label="Total" value={formatUsd(order.grandTotal)} strong />
        {p.refundedAmount > 0 && (
          <Row label="Refunded" value={`- ${formatUsd(p.refundedAmount)}`} />
        )}
        {canViewStripe && (
          <div className="mt-2 space-y-1 border-t border-divider/60 pt-2 text-xs text-text/40">
            <p>PaymentIntent: {p.stripePaymentIntentId}</p>
            <p>Charge: {p.stripeChargeId}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text/50">{label}</span>
      <span className={cn("tabular-nums", strong && "font-semibold")}>{value}</span>
    </div>
  );
}

function ReturnsRefundsPanel({
  order,
  canApprove,
  canRefund,
  onApprove,
  onReject,
  onAdvance,
  onRefund,
}: {
  order: Order;
  canApprove: boolean;
  canRefund: boolean;
  onApprove: (r: ReturnRequest) => void;
  onReject: (r: ReturnRequest) => void;
  onAdvance: (r: ReturnRequest) => void;
  onRefund: (r: ReturnRequest) => void;
}) {
  const actionBtn =
    "rounded-lg px-2.5 py-1 text-xs font-medium transition-opacity disabled:opacity-40";
  return (
    <Card title="Returns & refunds">
      <div className="space-y-3 text-sm">
        {order.returns.map((r) => {
          const canAdvance = ["label_created", "in_transit", "delivered"].includes(
            r.status,
          );
          const canIssueRefund = r.status === "inspected";
          const advanceLabel =
            r.status === "delivered" ? "Mark inspected" : "Simulate return scan";
          return (
            <div
              key={r.id}
              className="space-y-2 rounded-lg border border-divider/60 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  Return · {r.items.length} item(s)
                </span>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-xs text-text/50">
                {r.items.map((i) => `${i.quantity}× ${i.productTitle}`).join(", ")}
                {r.reason ? ` · ${r.reason}` : ""}
              </p>
              {r.returnShipment?.labelUrl && r.status !== "refunded" && (
                <a
                  href={r.returnShipment.labelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent"
                >
                  <ExternalLink className="h-3 w-3" />
                  Return label · {r.returnShipment.trackingCode}
                </a>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {r.status === "requested" && (
                  <>
                    <button
                      type="button"
                      onClick={() => onApprove(r)}
                      disabled={!canApprove}
                      className={cn(actionBtn, "bg-burgundy text-white hover:opacity-90")}
                    >
                      Approve & generate label
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject(r)}
                      disabled={!canApprove}
                      className={cn(actionBtn, "border border-divider/60 text-text/70 hover:bg-surface")}
                    >
                      Reject
                    </button>
                  </>
                )}
                {canAdvance && (
                  <button
                    type="button"
                    onClick={() => onAdvance(r)}
                    className={cn(actionBtn, "border border-divider/60 text-text/70 hover:bg-surface")}
                  >
                    {advanceLabel}
                  </button>
                )}
                {canIssueRefund && (
                  <button
                    type="button"
                    onClick={() => onRefund(r)}
                    disabled={!canRefund}
                    className={cn(actionBtn, "bg-burgundy text-white hover:opacity-90")}
                  >
                    Process refund · {formatUsd(returnRefundAmount(order, r))}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {order.refunds.map((rf) => (
          <div
            key={rf.id}
            className="flex items-center justify-between rounded-lg border border-divider/60 px-3 py-2"
          >
            <div>
              <span className="font-medium">
                {humanizeStatus(rf.type)} refund
              </span>
              <p className="text-xs text-text/50">{rf.reason}</p>
            </div>
            <div className="text-right">
              <p className="tabular-nums">{formatUsd(rf.amount)}</p>
              <StatusBadge status={rf.status} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TimelinePanel({ order }: { order: Order }) {
  const events = [...order.events].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return (
    <Card title="Event timeline">
      {events.length === 0 ? (
        <p className="text-sm text-text/40">No events yet.</p>
      ) : (
        <ol className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
              <div className="min-w-0">
                <p className="text-sm">{e.message}</p>
                <p className="text-xs text-text/40">
                  <span className="rounded bg-surface px-1 py-0.5 font-mono text-[10px]">
                    {e.type}
                  </span>{" "}
                  · {e.actor} ·{" "}
                  {new Date(e.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function NotesPanel({
  order,
  noteDraft,
  setNoteDraft,
  onSubmit,
  canEdit,
}: {
  order: Order;
  noteDraft: string;
  setNoteDraft: (v: string) => void;
  onSubmit: () => void;
  canEdit: boolean;
}) {
  return (
    <Card title="Internal notes">
      <div className="space-y-3">
        {order.notes.length === 0 ? (
          <p className="text-sm text-text/40">No notes yet.</p>
        ) : (
          <ul className="space-y-2">
            {order.notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-surface px-3 py-2 text-sm">
                <p>{n.body}</p>
                <p className="mt-0.5 text-xs text-text/40">
                  {n.author} ·{" "}
                  {new Date(n.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
        {canEdit ? (
          <div className="flex items-center gap-2">
            <input
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              placeholder="Add an internal note…"
              className="h-9 flex-1 rounded-lg border border-divider/60 bg-bg px-3 text-sm focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={!noteDraft.trim()}
              className="rounded-lg bg-burgundy px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Add
            </button>
          </div>
        ) : (
          <p className="text-xs text-text/40">
            Your role can&apos;t edit notes.
          </p>
        )}
      </div>
    </Card>
  );
}

function WebhookPanel({ order }: { order: Order }) {
  return (
    <Card title="Webhook events">
      {order.webhookEvents.length === 0 ? (
        <p className="text-sm text-text/40">No webhook events.</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {order.webhookEvents.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate">
                  <span className="font-mono text-[10px] uppercase text-text/40">
                    {w.source}
                  </span>{" "}
                  {w.eventType}
                </p>
                {w.summary && <p className="truncate text-text/40">{w.summary}</p>}
              </div>
              <StatusBadge status={w.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function OrderActionsCard({
  order,
  onHoldToggle,
  onRefund,
  refundDisabled,
  onResend,
}: {
  order: Order;
  onHoldToggle: () => void;
  onRefund: () => void;
  refundDisabled: boolean;
  onResend: (
    kind: "order_confirmation" | "shipping_update" | "delivery" | "refund",
    label: string,
  ) => void;
}) {
  const held = order.status === "on_hold";
  const btn =
    "rounded-lg border border-divider/60 bg-bg px-3 py-2 text-xs font-medium text-text/70 transition-colors hover:bg-surface disabled:opacity-40";
  return (
    <Card title="Actions">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRefund}
          disabled={refundDisabled}
          className="col-span-2 rounded-lg bg-burgundy px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Issue refund
        </button>
        <button type="button" onClick={onHoldToggle} className={btn}>
          {held ? "Release hold" : "Hold order"}
        </button>
        <button
          type="button"
          onClick={() => onResend("order_confirmation", "Order confirmation")}
          className={btn}
        >
          Resend confirmation
        </button>
        <button
          type="button"
          onClick={() => onResend("shipping_update", "Shipping update")}
          className={cn(btn, "col-span-2")}
        >
          Resend shipping update
        </button>
      </div>
    </Card>
  );
}

function AdminActivityPanel({ order }: { order: Order }) {
  const log = [...order.actionLog].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return (
    <Card title="Admin activity">
      {log.length === 0 ? (
        <p className="text-sm text-text/40">No admin actions yet.</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {log.map((a) => (
            <li key={a.id} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-text/30" />
              <div className="min-w-0">
                <p className="text-text/80">
                  <span className="font-mono">{a.action}</span>
                  {a.detail ? ` · ${a.detail}` : ""}
                </p>
                <p className="text-text/40">
                  {a.actor} ·{" "}
                  {new Date(a.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
