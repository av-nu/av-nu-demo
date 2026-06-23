"use client";

import Link from "next/link";

import { useOmsOrders } from "@/hooks/useOmsOrders";
import { StatusBadge } from "@/components/oms/StatusBadge";

export default function WebhooksPage() {
  const { orders, isHydrated } = useOmsOrders();

  if (!isHydrated) return <p className="text-sm text-text/50">Loading…</p>;

  const rows = orders
    .flatMap((o) => o.webhookEvents.map((w) => ({ order: o, webhook: w })))
    .sort((a, b) => b.webhook.receivedAt.localeCompare(a.webhook.receivedAt));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-headline text-2xl tracking-tight">Webhook events</h1>
        <p className="mt-1 text-sm text-text/50">
          {rows.length} stored event(s) · Stripe · Shopify · EasyPost
        </p>
      </div>

      <ul className="divide-y divide-divider/60 overflow-hidden rounded-xl border border-divider/60 bg-bg">
        {rows.map(({ order, webhook }) => (
          <li key={webhook.id}>
            <Link
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface"
            >
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-mono text-[10px] uppercase text-text/40">
                    {webhook.source}
                  </span>{" "}
                  <span className="font-medium">{webhook.eventType}</span>
                </p>
                <p className="truncate text-xs text-text/50">
                  {order.orderNumber}
                  {webhook.summary ? ` · ${webhook.summary}` : ""} ·{" "}
                  {new Date(webhook.receivedAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <StatusBadge status={webhook.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
