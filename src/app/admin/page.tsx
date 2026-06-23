"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";

import { useOmsOrders } from "@/hooks/useOmsOrders";
import { QUEUES, queueCounts, attentionReasons } from "@/lib/omsEngine";
import { formatUsd } from "@/data/oms";
import { SimulateOrderControl } from "@/components/oms/SimulateOrderControl";

export default function AdminOverviewPage() {
  const { orders, isHydrated } = useOmsOrders();

  if (!isHydrated) {
    return <p className="text-sm text-text/50">Loading OMS…</p>;
  }

  const counts = queueCounts(orders);
  const grossVolume = orders.reduce((s, o) => s + o.grandTotal, 0);
  const attentionOrders = orders.filter((o) => attentionReasons(o).length > 0);

  const highlightQueues = QUEUES.filter((q) =>
    [
      "attention",
      "writeback_failures",
      "label_failures",
      "unfulfilled",
      "shipment_exceptions",
      "returns",
      "refunds_pending",
      "payout_holds",
    ].includes(q.id),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-text/50">
            Operational snapshot across all avnu orders
          </p>
        </div>
        <SimulateOrderControl />
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total orders" value={String(orders.length)} />
        <StatCard label="Needs attention" value={String(counts.attention)} accent />
        <StatCard label="Unfulfilled" value={String(counts.unfulfilled)} />
        <StatCard label="Gross volume" value={formatUsd(grossVolume)} />
      </div>

      {/* Queues */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-text/70">Queues</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlightQueues.map((q) => (
            <Link
              key={q.id}
              href={`/admin/orders?queue=${q.id}`}
              className="group flex items-center justify-between rounded-xl border border-divider/60 bg-bg px-4 py-3 transition-colors hover:border-accent/40"
            >
              <div>
                <p className="text-2xl font-semibold tabular-nums">{counts[q.id]}</p>
                <p className="text-xs text-text/50">{q.label}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-text/30 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>

      {/* Attention list */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text/70">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Needs attention
        </h2>
        {attentionOrders.length === 0 ? (
          <p className="rounded-xl border border-divider/60 bg-bg px-4 py-6 text-center text-sm text-text/40">
            All clear — nothing needs attention.
          </p>
        ) : (
          <ul className="divide-y divide-divider/60 overflow-hidden rounded-xl border border-divider/60 bg-bg">
            {attentionOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{o.orderNumber}</p>
                    <p className="truncate text-xs text-text/50">
                      {o.customer.name} ·{" "}
                      {attentionReasons(o)
                        .map((r) => r.label)
                        .join(" · ")}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-text/30" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-divider/60 bg-bg px-4 py-4">
      <p
        className={`text-2xl font-semibold tabular-nums ${accent ? "text-amber-600" : ""}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-text/50">{label}</p>
    </div>
  );
}
