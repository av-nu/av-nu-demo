"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  LifeBuoy,
  Truck,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useOmsOrders } from "@/hooks/useOmsOrders";
import {
  type MerchantOrder,
  type Order,
  type ReturnRequest,
  CURRENT_SHOPPER_EMAIL,
  customerShipmentLabel,
  deliveredAt,
  formatUsd,
  humanizeStatus,
  itemReturnEligibility,
  statusTone,
} from "@/data/oms";

const SUPPORT_EMAIL = "support@avnu.com";

export default function CustomerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { getOrder, isHydrated } = useOmsOrders();

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-sm text-text/50">Loading…</p>
      </div>
    );
  }

  const order = getOrder(params.id);
  // Only the signed-in shopper's own orders are viewable here.
  if (!order || order.customer.email !== CURRENT_SHOPPER_EMAIL) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <BackLink />
        <p className="mt-4 rounded-xl border border-divider/60 bg-surface px-4 py-8 text-center text-sm text-text/50">
          Order not found.
        </p>
      </div>
    );
  }

  const refundIssued = order.refunds.some((r) => r.status === "succeeded");

  return (
    <div className="mx-auto max-w-2xl py-6 md:py-8">
      <BackLink />

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl tracking-tight">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-text/50">
            Ordered{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              dateStyle: "long",
            })}
          </p>
        </div>
        <span className="text-lg font-semibold tabular-nums">
          {formatUsd(order.grandTotal)}
        </span>
      </div>

      {refundIssued && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          A refund has been issued for this order.
        </div>
      )}

      {/* Packages by brand */}
      <div className="mt-6 space-y-4">
        {order.merchantOrders.map((m, i) => (
          <PackageCard
            key={m.id}
            orderId={order.id}
            m={m}
            index={i}
            returns={order.returns.filter((r) => r.merchantOrderId === m.id)}
          />
        ))}
      </div>

      <OrderTotals order={order} />

      {/* Support */}
      <div className="mt-6 rounded-2xl border border-divider/60 bg-surface px-4 py-4">
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-5 w-5 text-text/50" />
          <div className="flex-1">
            <p className="text-sm font-medium">Need help with this order?</p>
            <p className="text-xs text-text/50">
              Our team usually replies within a day.
            </p>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Help with ${order.orderNumber}`}
            className="rounded-lg bg-navy px-3 py-2 text-sm font-medium text-white"
          >
            Contact support
          </a>
        </div>
      </div>

    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/orders"
      className="inline-flex items-center gap-1.5 text-sm text-text/50 transition-colors hover:text-text"
    >
      <ArrowLeft className="h-4 w-4" />
      Your orders
    </Link>
  );
}

function PackageCard({
  orderId,
  m,
  index,
  returns,
}: {
  orderId: string;
  m: MerchantOrder;
  index: number;
  returns: ReturnRequest[];
}) {
  const label = customerShipmentLabel(m.shipmentStatus);
  const tone = statusTone(m.shipmentStatus);
  const delivered = deliveredAt(m);
  const shipped =
    m.shipment &&
    (m.labelStatus === "purchased" || m.labelStatus === "delivered_to_shopify") &&
    ["in_transit", "out_for_delivery", "delivered"].includes(m.shipmentStatus);
  const activeReturn = returns.find(
    (r) => r.status !== "rejected" && r.status !== "closed",
  );
  // Items already inside an active return can't be returned again.
  const pendingItemIds = new Set(
    returns
      .filter((r) => r.status !== "rejected" && r.status !== "closed")
      .flatMap((r) => r.items.map((i) => i.orderItemId)),
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-divider/60 bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-divider/60 px-4 py-3">
        <div>
          <p className="text-xs text-text/40">
            Shipment {index + 1} · {m.vendorName}
          </p>
          <p
            className={cn(
              "text-sm font-semibold",
              tone === "success" && "text-emerald-700",
              tone === "warning" && "text-amber-700",
            )}
          >
            {label}
          </p>
        </div>
        <Truck className="h-5 w-5 text-text/30" />
      </div>

      {/* Items */}
      <ul className="divide-y divide-divider/40 px-4">
        {m.items.map((it) => {
          const elig = itemReturnEligibility(m, it);
          return (
            <li key={it.id} className="flex items-center gap-3 py-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface">
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
                  Qty {it.quantity} · {formatUsd(it.unitPrice * it.quantity)}
                </p>
              </div>
              {pendingItemIds.has(it.id) ? (
                <span className="shrink-0 cursor-not-allowed rounded-lg border border-divider/50 bg-surface/60 px-3 py-1.5 text-[11px] text-text/30">
                  Return in progress
                </span>
              ) : elig.eligible ? (
                <Link
                  href={`/returns/${orderId}?item=${it.id}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Return
                </Link>
              ) : (
                <span
                  className="shrink-0 cursor-not-allowed rounded-lg border border-divider/50 px-3 py-1.5 text-right text-[11px] text-text/30"
                  title={elig.reason}
                >
                  {elig.reason ?? "Not eligible"}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Tracking */}
      {(shipped || m.shipment?.estimatedDeliveryDate) && (
        <div className="border-t border-divider/60 px-4 py-3 text-sm">
          {delivered ? (
            <p className="text-text/60">
              Delivered{" "}
              {new Date(delivered).toLocaleDateString("en-US", {
                dateStyle: "medium",
              })}
            </p>
          ) : m.shipment?.estimatedDeliveryDate ? (
            <p className="text-text/60">
              Estimated delivery{" "}
              {new Date(m.shipment.estimatedDeliveryDate).toLocaleDateString(
                "en-US",
                { dateStyle: "medium" },
              )}
            </p>
          ) : null}
          {shipped && m.shipment?.trackingUrl && (
            <a
              href={m.shipment.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-accent"
            >
              Track package
              {m.shipment.trackingCode ? ` · ${m.shipment.trackingCode}` : ""}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Returns */}
      {activeReturn && (
        <div className="border-t border-divider/60 bg-surface/40 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 shrink-0 text-text/40" />
              <div>
                <p className="text-sm font-medium">Return submitted</p>
                <p className="text-xs text-text/50">
                  {humanizeStatus(activeReturn.status)}
                </p>
              </div>
            </div>
            {activeReturn.status === "refunded" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Refunded
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                {humanizeStatus(activeReturn.status)}
              </span>
            )}
          </div>
          {activeReturn.returnShipment && activeReturn.status !== "refunded" && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-divider/60 bg-bg px-3 py-2.5 text-sm">
              {activeReturn.returnShipment.trackingCode && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-text/50">Tracking</span>
                  <span className="font-mono text-xs">
                    {activeReturn.returnShipment.trackingCode}
                  </span>
                </div>
              )}
              <a
                href={activeReturn.returnShipment.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-accent/40 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/5"
              >
                View return label
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function OrderTotals({ order }: { order: Order }) {
  return (
    <div className="mt-6 rounded-2xl border border-divider/60 bg-bg px-4 py-4 text-sm">
      <Row label="Subtotal" value={formatUsd(order.subtotal)} />
      <Row label="Shipping" value={formatUsd(order.shippingTotal)} />
      <Row label="Tax" value={formatUsd(order.taxTotal)} />
      <div className="mt-2 border-t border-divider/60 pt-2">
        <Row label="Total" value={formatUsd(order.grandTotal)} strong />
      </div>
    </div>
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
    <div className="flex items-center justify-between py-0.5">
      <span className="text-text/50">{label}</span>
      <span className={cn("tabular-nums", strong && "font-semibold")}>
        {value}
      </span>
    </div>
  );
}
