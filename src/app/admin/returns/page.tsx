"use client";

import Link from "next/link";
import { AlertTriangle, Eye } from "lucide-react";

import { useOmsOrders } from "@/hooks/useOmsOrders";
import { StatusBadge } from "@/components/oms/StatusBadge";
import { ReturnTierBadge } from "@/components/oms/ReturnTierBadge";
import {
  type ReturnReason,
  type ReturnStats,
  RETURN_REASON_LABELS,
  returnStatsByAddress,
  returnStatsByBrand,
  returnStatsByProduct,
  returnStatsByUser,
} from "@/data/oms";

export default function ReturnsPage() {
  const { orders, isHydrated } = useOmsOrders();

  if (!isHydrated) return <p className="text-sm text-text/50">Loading…</p>;

  const rows = orders
    .flatMap((o) => o.returns.map((r) => ({ order: o, ret: r })))
    .sort((a, b) => b.ret.createdAt.localeCompare(a.ret.createdAt));

  // KPIs
  const totalReturns = rows.length;
  const merchantPaid = rows.filter(
    (r) => r.ret.shippingPaidBy === "merchant",
  ).length;
  const customerPaid = rows.filter(
    (r) => r.ret.shippingPaidBy === "customer",
  ).length;
  const totalUnitsReturned = rows.reduce(
    (s, r) => s + r.ret.items.reduce((n, i) => n + i.quantity, 0),
    0,
  );

  // Reason split
  const reasonCounts = new Map<ReturnReason, number>();
  for (const { ret } of rows) {
    if (ret.reasonCode)
      reasonCounts.set(ret.reasonCode, (reasonCounts.get(ret.reasonCode) ?? 0) + 1);
  }

  const userStats = returnStatsByUser(orders);
  const addressStats = returnStatsByAddress(orders);
  const abusers = userStats.filter((s) => s.tier === "abuser");
  const watchlist = userStats.filter((s) => s.tier === "watchlist");
  const flaggedAddresses = addressStats.filter((s) => s.tier !== "normal");
  const productStats = returnStatsByProduct(orders).slice(0, 6);
  const brandStats = returnStatsByBrand(orders).slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-2xl tracking-tight">Returns</h1>
        <p className="mt-1 text-sm text-text/50">
          {totalReturns} return request(s) · monitoring return frequency &amp;
          abuse
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Return requests" value={String(totalReturns)} />
        <Stat label="Units returned" value={String(totalUnitsReturned)} />
        <Stat label="Merchant-paid" value={String(merchantPaid)} />
        <Stat label="Customer-paid" value={String(customerPaid)} />
      </div>

      {/* Reason split */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-text/70">
          Reasons
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.keys(RETURN_REASON_LABELS) as ReturnReason[]).map((code) => (
            <div
              key={code}
              className="rounded-xl border border-divider/60 bg-bg px-4 py-3"
            >
              <p className="text-2xl font-semibold tabular-nums">
                {reasonCounts.get(code) ?? 0}
              </p>
              <p className="text-xs text-text/50">{RETURN_REASON_LABELS[code]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Abuse flags */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text/70">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Abuse flagged
        </h2>
        {abusers.length === 0 ? (
          <EmptyNote>No shoppers currently exceed acceptable return limits.</EmptyNote>
        ) : (
          <StatsList stats={abusers} />
        )}
      </section>

      {/* Watchlist */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text/70">
          <Eye className="h-4 w-4 text-amber-500" />
          Watchlist
        </h2>
        <p className="-mt-2 mb-3 text-xs text-text/40">
          Trending high but still allowed to return.
        </p>
        {watchlist.length === 0 ? (
          <EmptyNote>No shoppers on the watchlist.</EmptyNote>
        ) : (
          <StatsList stats={watchlist} />
        )}
      </section>

      {/* Flagged addresses */}
      {flaggedAddresses.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text/70">
            Flagged addresses
          </h2>
          <StatsList stats={flaggedAddresses} showTier />
        </section>
      )}

      {/* Product / brand return rates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text/70">
            Highest-return products
          </h2>
          {productStats.length === 0 ? (
            <EmptyNote>No product returns yet.</EmptyNote>
          ) : (
            <RateTable stats={productStats} />
          )}
        </section>
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text/70">
            Highest-return brands
          </h2>
          {brandStats.length === 0 ? (
            <EmptyNote>No brand returns yet.</EmptyNote>
          ) : (
            <RateTable stats={brandStats} />
          )}
        </section>
      </div>

      {/* All requests */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-text/70">
          All return requests
        </h2>
        {rows.length === 0 ? (
          <EmptyNote>No return requests.</EmptyNote>
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
                      {ret.reason ? ` · ${ret.reason}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={ret.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-divider/60 bg-bg px-4 py-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-text/50">{label}</p>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-divider/60 bg-bg px-4 py-6 text-center text-sm text-text/40">
      {children}
    </div>
  );
}

function StatsList({
  stats,
  showTier,
}: {
  stats: ReturnStats[];
  showTier?: boolean;
}) {
  return (
    <ul className="divide-y divide-divider/60 overflow-hidden rounded-xl border border-divider/60 bg-bg">
      {stats.map((s) => (
        <li
          key={s.key}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{s.label}</p>
              {showTier && <ReturnTierBadge tier={s.tier} />}
            </div>
            {s.sublabel && (
              <p className="truncate text-xs text-text/50">{s.sublabel}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">
              {Math.round(s.returnRate * 100)}%
            </p>
            <p className="text-xs text-text/50">
              {s.returnedUnits}/{s.purchasedUnits} items · {s.orders} order(s)
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RateTable({ stats }: { stats: ReturnStats[] }) {
  return (
    <ul className="divide-y divide-divider/60 overflow-hidden rounded-xl border border-divider/60 bg-bg">
      {stats.map((s) => (
        <li
          key={s.key}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <p className="min-w-0 truncate text-sm">{s.label}</p>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-surface sm:block">
              <div
                className="h-full bg-burgundy"
                style={{ width: `${Math.min(100, Math.round(s.returnRate * 100))}%` }}
              />
            </div>
            <span className="w-10 text-right text-sm font-semibold tabular-nums">
              {Math.round(s.returnRate * 100)}%
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
