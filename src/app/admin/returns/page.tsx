"use client";

import Link from "next/link";

import { useOmsOrders } from "@/hooks/useOmsOrders";
import { StatusBadge } from "@/components/oms/StatusBadge";

export default function ReturnsPage() {
  const { orders, isHydrated } = useOmsOrders();

  if (!isHydrated) return <p className="text-sm text-text/50">Loading…</p>;

  const rows = orders.flatMap((o) =>
    o.returns.map((r) => ({ order: o, ret: r })),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-headline text-2xl tracking-tight">Returns</h1>
        <p className="mt-1 text-sm text-text/50">{rows.length} return request(s)</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-divider/60 bg-bg px-4 py-12 text-center text-sm text-text/40">
          No return requests.
        </div>
      ) : (
        <ul className="divide-y divide-divider/60 overflow-hidden rounded-xl border border-divider/60 bg-bg">
          {rows.map(({ order, ret }) => (
            <li key={ret.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{order.orderNumber}</p>
                  <p className="truncate text-xs text-text/50">
                    {order.customer.name} ·{" "}
                    {ret.items
                      .map((i) => `${i.quantity}× ${i.productTitle}`)
                      .join(", ")}
                  </p>
                </div>
                <StatusBadge status={ret.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
