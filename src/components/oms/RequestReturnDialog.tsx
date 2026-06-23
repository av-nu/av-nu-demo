"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";

import { Portal } from "@/components/ui/Portal";
import {
  type MerchantOrder,
  itemReturnEligibility,
  formatUsd,
} from "@/data/oms";

const REASONS = [
  "Not as expected",
  "Wrong size / fit",
  "Damaged or defective",
  "Changed my mind",
  "Other",
];

type Selection = Record<string, number>; // orderItemId -> quantity

export function RequestReturnDialog({
  merchantOrder,
  onClose,
  onSubmit,
}: {
  merchantOrder: MerchantOrder;
  onClose: () => void;
  onSubmit: (
    items: { orderItemId: string; quantity: number }[],
    reason: string,
  ) => void;
}) {
  const eligible = merchantOrder.items.filter(
    (it) => itemReturnEligibility(merchantOrder, it).eligible,
  );
  const [selection, setSelection] = useState<Selection>({});
  const [reason, setReason] = useState(REASONS[0]);

  const setQty = (id: string, qty: number, max: number) => {
    setSelection((prev) => {
      const next = { ...prev };
      const clamped = Math.max(0, Math.min(qty, max));
      if (clamped === 0) delete next[id];
      else next[id] = clamped;
      return next;
    });
  };

  const chosen = Object.entries(selection).filter(([, q]) => q > 0);
  const canSubmit = chosen.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(
      chosen.map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
      reason,
    );
  };

  return (
    <Portal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      >
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md overflow-hidden rounded-t-2xl bg-bg sm:rounded-2xl"
        >
          <div className="flex items-center justify-between border-b border-divider/60 px-4 py-3">
            <h2 className="font-headline text-lg">Request a return</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 hover:bg-surface"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
            <p className="mb-3 text-xs text-text/50">
              {merchantOrder.vendorName} · select items to return
            </p>

            {eligible.length === 0 ? (
              <p className="rounded-lg bg-surface px-3 py-6 text-center text-sm text-text/50">
                No items are eligible for return right now.
              </p>
            ) : (
              <ul className="space-y-3">
                {eligible.map((it) => {
                  const max =
                    itemReturnEligibility(merchantOrder, it).remainingQuantity;
                  const qty = selection[it.id] ?? 0;
                  return (
                    <li key={it.id} className="flex items-center gap-3">
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
                          {formatUsd(it.unitPrice)} · up to {max}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQty(it.id, qty - 1, max)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-divider/60 disabled:opacity-30"
                          disabled={qty === 0}
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(it.id, qty + 1, max)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-divider/60 disabled:opacity-30"
                          disabled={qty >= max}
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {eligible.length > 0 && (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium text-text/50">
                  Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-10 w-full rounded-lg border border-divider/60 bg-bg px-3 text-sm focus:border-accent/50 focus:outline-none"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              onClick={submit}
              disabled={!canSubmit}
              className="rounded-lg bg-burgundy px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Request return
            </button>
          </div>
        </motion.div>
      </motion.div>
    </Portal>
  );
}
