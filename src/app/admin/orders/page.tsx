"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Download } from "lucide-react";

import { cn } from "@/lib/utils";
import { useOmsOrders } from "@/hooks/useOmsOrders";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  QUEUES,
  queueCounts,
  orderMatchesQuery,
  ordersToCsv,
  type QueueId,
} from "@/lib/omsEngine";
import { OrdersTable } from "@/components/oms/OrdersTable";
import { SimulateOrderControl } from "@/components/oms/SimulateOrderControl";

function OrdersView() {
  const { orders, isHydrated } = useOmsOrders();
  const { can } = useAdminRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  const activeQueue = (searchParams.get("queue") as QueueId) ?? "all";
  const queueDef = QUEUES.find((q) => q.id === activeQueue) ?? QUEUES[0];

  const counts = useMemo(() => queueCounts(orders), [orders]);

  const filtered = useMemo(
    () => orders.filter(queueDef.predicate).filter((o) => orderMatchesQuery(o, query)),
    [orders, queueDef, query],
  );

  const setQueue = (id: QueueId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") params.delete("queue");
    else params.set("queue", id);
    router.replace(`/admin/orders${params.toString() ? `?${params}` : ""}`);
  };

  const exportCsv = () => {
    const csv = ordersToCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `avnu-orders-${queueDef.id}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isHydrated) {
    return <p className="text-sm text-text/50">Loading orders…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-text/50">
            {filtered.length} of {orders.length} orders · {queueDef.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SimulateOrderControl />
          {can("export_orders") && (
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-divider/60 bg-bg px-3 py-2 text-sm font-medium text-text/70 transition-colors hover:bg-surface"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order #, email, SKU, tracking…"
            className="h-9 w-full rounded-lg border border-divider/60 bg-bg pl-9 pr-3 text-sm focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
        </div>
      </div>

      {/* Queue tabs */}
      <div className="flex flex-wrap gap-1.5">
        {QUEUES.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setQueue(q.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              q.id === activeQueue
                ? "bg-burgundy text-white"
                : "bg-bg text-text/70 ring-1 ring-inset ring-divider/60 hover:bg-surface",
            )}
          >
            {q.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px] tabular-nums",
                q.id === activeQueue ? "bg-white/20" : "bg-text/8 text-text/50",
              )}
            >
              {counts[q.id]}
            </span>
          </button>
        ))}
      </div>

      <OrdersTable orders={filtered} />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text/50">Loading orders…</p>}>
      <OrdersView />
    </Suspense>
  );
}
