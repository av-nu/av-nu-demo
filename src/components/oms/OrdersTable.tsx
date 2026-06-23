import Link from "next/link";

import { type Order, formatUsd } from "@/data/oms";
import {
  attentionReasons,
  merchantSummary,
  orderItemCount,
} from "@/lib/omsEngine";
import { StatusBadge } from "@/components/oms/StatusBadge";

function relativeDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-divider/60 bg-bg px-4 py-12 text-center text-sm text-text/40">
        No orders match this view.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-divider/60 bg-bg">
      {/* Header (desktop) */}
      <div className="hidden grid-cols-[1.2fr_1.4fr_1fr_0.8fr_0.9fr_0.7fr] gap-4 border-b border-divider/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text/40 md:grid">
        <span>Order</span>
        <span>Customer</span>
        <span>Merchants</span>
        <span>Payment</span>
        <span>Status</span>
        <span className="text-right">Total</span>
      </div>

      <ul className="divide-y divide-divider/60">
        {orders.map((o) => {
          const attention = attentionReasons(o);
          return (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-surface md:grid-cols-[1.2fr_1.4fr_1fr_0.8fr_0.9fr_0.7fr] md:items-center md:gap-4"
              >
                {/* Order */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-text/40">
                    {relativeDate(o.createdAt)} · {orderItemCount(o)} item
                    {orderItemCount(o) === 1 ? "" : "s"}
                  </p>
                </div>

                {/* Customer */}
                <div className="min-w-0">
                  <p className="truncate text-sm">{o.customer.name}</p>
                  <p className="truncate text-xs text-text/40">{o.customer.email}</p>
                </div>

                {/* Merchants */}
                <p className="truncate text-sm text-text/70">{merchantSummary(o)}</p>

                {/* Payment */}
                <div>
                  <StatusBadge status={o.paymentStatus} />
                </div>

                {/* Status + attention */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={o.status} />
                  {attention.length > 0 && (
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                      {attention.length} alert{attention.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                {/* Total */}
                <p className="text-sm font-medium tabular-nums md:text-right">
                  {formatUsd(o.grandTotal)}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
