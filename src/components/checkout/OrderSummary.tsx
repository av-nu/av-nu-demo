"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { formatUsd, type Order } from "@/data/oms";

/**
 * Receipt-style summary of a placed order, grouped by merchant (brand), with
 * per-line images and a totals breakdown using the snapshotted order amounts.
 */
export function OrderSummary({ order }: { order: Order }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-divider/60 bg-surface/30 p-6 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-xl tracking-tight text-text">
          Order summary
        </h2>
        <span className="text-xs font-medium uppercase tracking-wide text-text/40">
          {order.orderNumber}
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {order.merchantOrders.map((m) => (
          <div key={m.id} className="space-y-4">
            <div className="flex items-center justify-between border-b border-divider/50 pb-2">
              <Link
                href={`/brand/${m.vendorId}`}
                className="text-sm font-medium text-text transition-colors hover:text-accent"
              >
                {m.vendorName}
              </Link>
              <span className="text-xs text-text/50">{formatUsd(m.subtotal)}</span>
            </div>

            <div className="space-y-4">
              {m.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <Link
                    href={`/product/${item.productId}`}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-bg"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productTitle}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.productId}`}
                        className="line-clamp-2 text-sm font-medium text-text transition-colors hover:text-accent"
                      >
                        {item.productTitle}
                      </Link>
                      <p className="mt-0.5 text-xs text-text/50">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-text">
                      {formatUsd(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-6 space-y-2 border-t border-divider/50 pt-4 text-sm">
        <Row label="Subtotal" value={formatUsd(order.subtotal)} />
        <Row label="Shipping" value={formatUsd(order.shippingTotal)} />
        <Row label="Tax" value={formatUsd(order.taxTotal)} />
        <div className="mt-2 flex items-center justify-between border-t border-divider/50 pt-3">
          <span className="font-medium text-text">Total</span>
          <span className="font-semibold tabular-nums text-text">
            {formatUsd(order.grandTotal)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text/55">{label}</span>
      <span className="tabular-nums text-text/80">{value}</span>
    </div>
  );
}
