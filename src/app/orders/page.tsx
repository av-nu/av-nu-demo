"use client";

import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";

import { useOmsOrders } from "@/hooks/useOmsOrders";
import {
  CURRENT_SHOPPER_EMAIL,
  customerShipmentLabel,
  formatUsd,
} from "@/data/oms";

export default function CustomerOrdersPage() {
  const { orders, isHydrated } = useOmsOrders();

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-sm text-text/50">Loading your orders…</p>
      </div>
    );
  }

  const myOrders = orders.filter(
    (o) => o.customer.email === CURRENT_SHOPPER_EMAIL,
  );

  return (
    <div className="mx-auto max-w-2xl py-6 md:py-8">
      <h1 className="font-headline text-2xl tracking-tight">Your orders</h1>
      <p className="mt-1 text-sm text-text/50">
        Track shipments and manage returns
      </p>

      {myOrders.length === 0 ? (
        <p className="mt-8 rounded-xl border border-divider/60 bg-surface px-4 py-10 text-center text-sm text-text/50">
          You don&apos;t have any orders yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {myOrders.map((o) => {
            const packages = o.merchantOrders.length;
            return (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-divider/60 bg-bg px-4 py-4 transition-colors hover:border-accent/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface">
                    <Package className="h-5 w-5 text-text/50" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{o.orderNumber}</p>
                    <p className="text-xs text-text/50">
                      {new Date(o.createdAt).toLocaleDateString("en-US", {
                        dateStyle: "medium",
                      })}{" "}
                      · {packages} {packages === 1 ? "shipment" : "shipments"} ·{" "}
                      {o.merchantOrders
                        .map((m) => customerShipmentLabel(m.shipmentStatus))
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .join(", ")}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatUsd(o.grandTotal)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-text/30" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
