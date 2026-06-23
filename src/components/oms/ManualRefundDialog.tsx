"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import { Portal } from "@/components/ui/Portal";
import {
  type Order,
  type RefundType,
  formatUsd,
} from "@/data/oms";
import { refundableRemaining } from "@/lib/omsEngine";

const TYPES: { value: RefundType; label: string }[] = [
  { value: "full", label: "Full order" },
  { value: "partial", label: "Partial" },
  { value: "shipping", label: "Shipping only" },
  { value: "tax", label: "Tax only" },
];

export function ManualRefundDialog({
  order,
  onClose,
  onSubmit,
}: {
  order: Order;
  onClose: () => void;
  onSubmit: (amount: number, type: RefundType, reason: string) => void;
}) {
  const remaining = refundableRemaining(order);
  const [type, setType] = useState<RefundType>("full");
  // Dollar string in the input; default to full remaining.
  const [amountStr, setAmountStr] = useState((remaining / 100).toFixed(2));
  const [reason, setReason] = useState("");

  const amountCents = Math.round(Number.parseFloat(amountStr || "0") * 100);
  const valid = amountCents > 0 && amountCents <= remaining;

  // When switching to "full", snap the amount to the remaining balance.
  const onType = (t: RefundType) => {
    setType(t);
    if (t === "full") setAmountStr((remaining / 100).toFixed(2));
    if (t === "shipping") setAmountStr((order.shippingTotal / 100).toFixed(2));
    if (t === "tax") setAmountStr((order.taxTotal / 100).toFixed(2));
  };

  return (
    <Portal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm overflow-hidden rounded-2xl bg-bg"
        >
          <div className="flex items-center justify-between border-b border-divider/60 px-4 py-3">
            <h2 className="font-headline text-lg">Issue refund</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 hover:bg-surface"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 px-4 py-4 text-sm">
            <div className="flex items-center justify-between text-text/60">
              <span>Order {order.orderNumber}</span>
              <span>Refundable {formatUsd(remaining)}</span>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text/50">
                Refund type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => onType(t.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                      type === t.value
                        ? "bg-burgundy text-white ring-burgundy"
                        : "bg-bg text-text/70 ring-divider/60 hover:bg-surface"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text/50">
                Amount (USD)
              </label>
              <input
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (type === "full") setType("partial");
                }}
                inputMode="decimal"
                className="h-10 w-full rounded-lg border border-divider/60 bg-bg px-3 text-sm focus:border-accent/50 focus:outline-none"
              />
              {!valid && (
                <p className="mt-1 text-xs text-rose-600">
                  Enter an amount between $0.01 and {formatUsd(remaining)}.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text/50">
                Reason (optional)
              </label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. goodwill credit"
                className="h-10 w-full rounded-lg border border-divider/60 bg-bg px-3 text-sm focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-divider/60 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-text/60 hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                valid && onSubmit(amountCents, type, reason.trim())
              }
              disabled={!valid}
              className="rounded-lg bg-burgundy px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Refund {valid ? formatUsd(amountCents) : ""}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </Portal>
  );
}
