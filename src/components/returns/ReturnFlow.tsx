"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Check,
  Printer,
  Mail,
  Clock,
  PackageCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useOmsOrders } from "@/hooks/useOmsOrders";
import {
  type MerchantOrder,
  type Order,
  type ReturnReason,
  type ReturnRequest,
  RETURN_REASON_OPTIONS,
  formatUsd,
  itemReturnEligibility,
  merchantCoversShipping,
} from "@/data/oms";

type Step = "select" | "reason" | "confirm";

// selection keyed by orderItemId → chosen quantity
type Selection = Record<string, number>;

export function ReturnFlow({
  orderId,
  initialItemId,
  backHref,
}: {
  orderId: string;
  initialItemId?: string;
  backHref: string;
}) {
  const { getOrder, requestReturn, isHydrated } = useOmsOrders();
  const order = getOrder(orderId);

  const [step, setStep] = useState<Step>("select");
  const [selection, setSelection] = useState<Selection>(() =>
    initialItemId ? { [initialItemId]: 1 } : {},
  );
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  // Snapshot of return ids that existed before this session's submit, so we can
  // isolate the returns created in this flow for the confirmation screen.
  const [priorReturnIds, setPriorReturnIds] = useState<string[] | null>(null);

  // Items already inside an active return (not rejected/closed) can't be selected again.
  const pendingItemIds = useMemo(() => {
    if (!order) return new Set<string>();
    return new Set(
      order.returns
        .filter((r) => r.status !== "rejected" && r.status !== "closed")
        .flatMap((r) => r.items.map((i) => i.orderItemId)),
    );
  }, [order]);

  // Map orderItemId → its merchant order, for eligible items only.
  const itemIndex = useMemo(() => {
    const map = new Map<string, MerchantOrder>();
    if (!order) return map;
    for (const m of order.merchantOrders) {
      for (const it of m.items) {
        if (itemReturnEligibility(m, it).eligible && !pendingItemIds.has(it.id))
          map.set(it.id, m);
      }
    }
    return map;
  }, [order, pendingItemIds]);

  if (!isHydrated) {
    return <p className="py-10 text-sm text-text/50">Loading…</p>;
  }
  if (!order) {
    return (
      <div className="py-10">
        <p className="text-sm text-text/50">Order not found.</p>
        <Link href={backHref} className="mt-3 inline-block text-sm text-accent">
          Go back
        </Link>
      </div>
    );
  }

  const chosen = Object.entries(selection).filter(([, q]) => q > 0);
  const canContinueItems = chosen.length > 0;
  const needsAck = reason === "no_longer_wanted";
  const canContinueReason = reason !== null && (!needsAck || acknowledged);

  const setQty = (id: string, qty: number, max: number) => {
    setSelection((prev) => {
      const next = { ...prev };
      const clamped = Math.max(0, Math.min(qty, max));
      if (clamped === 0) delete next[id];
      else next[id] = clamped;
      return next;
    });
  };

  const submit = () => {
    if (!reason || !canContinueReason) return;
    // Group chosen items by merchant order → one return request per merchant.
    const byMerchant = new Map<string, { orderItemId: string; quantity: number }[]>();
    for (const [orderItemId, quantity] of chosen) {
      const m = itemIndex.get(orderItemId);
      if (!m) continue;
      const list = byMerchant.get(m.id) ?? [];
      list.push({ orderItemId, quantity });
      byMerchant.set(m.id, list);
    }
    setPriorReturnIds(order.returns.map((r) => r.id));
    for (const [merchantOrderId, items] of byMerchant) {
      requestReturn(orderId, merchantOrderId, items, reason, {
        costAcknowledged: acknowledged,
      });
    }
    setStep("confirm");
  };

  return (
    <div className="mx-auto max-w-2xl py-6 md:py-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-text/50 transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mt-3">
        <h1 className="font-headline text-2xl tracking-tight">Start a return</h1>
        <p className="mt-1 text-sm text-text/50">
          {order.orderNumber} · {order.customer.name}
        </p>
      </div>

      <StepIndicator step={step} />

      {step === "select" && (
        <SelectStep
          order={order}
          selection={selection}
          setQty={setQty}
          canContinue={canContinueItems}
          onContinue={() => setStep("reason")}
          pendingItemIds={pendingItemIds}
        />
      )}

      {step === "reason" && (
        <ReasonStep
          reason={reason}
          setReason={setReason}
          acknowledged={acknowledged}
          setAcknowledged={setAcknowledged}
          needsAck={needsAck}
          canContinue={canContinueReason}
          onBack={() => setStep("select")}
          onSubmit={submit}
        />
      )}

      {step === "confirm" && (
        <ConfirmStep
          order={order}
          priorReturnIds={priorReturnIds ?? []}
          backHref={backHref}
        />
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "select", label: "Items" },
    { id: "reason", label: "Reason" },
    { id: "confirm", label: "Label" },
  ];
  const activeIndex = steps.findIndex((s) => s.id === step);
  return (
    <div className="mt-5 flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.id} className="flex flex-1 items-center gap-2">
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
              i < activeIndex && "bg-accent text-white",
              i === activeIndex && "bg-burgundy text-white",
              i > activeIndex && "bg-surface text-text/40",
            )}
          >
            {i < activeIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span
            className={cn(
              "text-xs",
              i === activeIndex ? "font-medium text-text" : "text-text/40",
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className="ml-1 h-px flex-1 bg-divider/60" />
          )}
        </div>
      ))}
    </div>
  );
}

function SelectStep({
  order,
  selection,
  setQty,
  canContinue,
  onContinue,
  pendingItemIds,
}: {
  order: Order;
  selection: Selection;
  setQty: (id: string, qty: number, max: number) => void;
  canContinue: boolean;
  onContinue: () => void;
  pendingItemIds: Set<string>;
}) {
  const merchantsWithEligible = order.merchantOrders
    .map((m) => ({
      m,
      items: m.items.filter(
        (it) =>
          itemReturnEligibility(m, it).eligible && !pendingItemIds.has(it.id),
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mt-6">
      {merchantsWithEligible.length === 0 ? (
        <p className="rounded-2xl border border-divider/60 bg-surface px-4 py-10 text-center text-sm text-text/50">
          None of the items in this order are eligible for return right now.
        </p>
      ) : (
        <div className="space-y-4">
          {merchantsWithEligible.map(({ m, items }) => (
            <section
              key={m.id}
              className="overflow-hidden rounded-2xl border border-divider/60 bg-bg"
            >
              <div className="border-b border-divider/60 px-4 py-3 text-xs text-text/50">
                {m.vendorName}
              </div>
              <ul className="divide-y divide-divider/40 px-4">
                {items.map((it) => {
                  const max = itemReturnEligibility(m, it).remainingQuantity;
                  const qty = selection[it.id] ?? 0;
                  return (
                    <li key={it.id} className="flex items-center gap-3 py-3">
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
                          disabled={qty === 0}
                          aria-label="Decrease"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-divider/60 disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(it.id, qty + 1, max)}
                          disabled={qty >= max}
                          aria-label="Increase"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-divider/60 disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <div className="flex justify-end">
            <Button variant="plum" disabled={!canContinue} onClick={onContinue}>
              Continue
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReasonStep({
  reason,
  setReason,
  acknowledged,
  setAcknowledged,
  needsAck,
  canContinue,
  onBack,
  onSubmit,
}: {
  reason: ReturnReason | null;
  setReason: (r: ReturnReason) => void;
  acknowledged: boolean;
  setAcknowledged: (v: boolean) => void;
  needsAck: boolean;
  canContinue: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-text/60">Why are you returning these items?</p>
      <div className="space-y-2.5">
        {RETURN_REASON_OPTIONS.map((opt) => {
          const active = reason === opt.value;
          const merchantPays = merchantCoversShipping(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setReason(opt.value)}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors",
                active
                  ? "border-burgundy bg-burgundy/5"
                  : "border-divider/60 hover:border-accent/40",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  active ? "border-burgundy bg-burgundy" : "border-text/30",
                )}
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      merchantPays
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {merchantPays ? "Free return shipping" : "You pay shipping"}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-text/50">
                  {opt.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {needsAck && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <p className="text-sm font-medium text-amber-900">
            Return shipping is on you for this reason
          </p>
          <p className="mt-1 text-xs text-amber-800">
            You&apos;ll drop the package at UPS, where it&apos;s measured and you
            pay the shipping cost at the counter. We&apos;ll email your label
            right away once you agree.
          </p>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-amber-900">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-burgundy"
            />
            I understand I&apos;m responsible for paying return shipping at UPS.
          </label>
        </div>
      )}

      {reason !== null && !needsAck && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-xs text-emerald-800">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          Because this is the merchant&apos;s fault, they cover return shipping.
          Your request goes to the merchant for a quick approval, then we&apos;ll
          email your prepaid UPS label.
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button variant="plum" disabled={!canContinue} onClick={onSubmit}>
          {needsAck ? "Get my label" : "Submit return"}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ConfirmStep({
  order,
  priorReturnIds,
  backHref,
}: {
  order: Order;
  priorReturnIds: string[];
  backHref: string;
}) {
  const created = order.returns.filter((r) => !priorReturnIds.includes(r.id));

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <PackageCheck className="h-4 w-4" />
        {created.length === 1
          ? "Your return has been created."
          : `${created.length} returns created — one per merchant.`}
      </div>

      {created.map((ret) => {
        const m = order.merchantOrders.find((x) => x.id === ret.merchantOrderId);
        return (
          <ReturnResultCard
            key={ret.id}
            ret={ret}
            merchantName={m?.vendorName ?? "Merchant"}
            order={order}
          />
        );
      })}

      <div className="flex justify-end">
        <Button asChild variant="surface">
          <Link href={backHref}>Done</Link>
        </Button>
      </div>
    </div>
  );
}

function ReturnResultCard({
  ret,
  merchantName,
  order,
}: {
  ret: ReturnRequest;
  merchantName: string;
  order: Order;
}) {
  const hasLabel = Boolean(ret.returnShipment) && ret.status === "label_created";

  return (
    <section className="overflow-hidden rounded-2xl border border-divider/60 bg-bg">
      <div className="border-b border-divider/60 px-4 py-3">
        <p className="text-xs text-text/40">{merchantName}</p>
        <p className="text-sm font-medium">
          {ret.items.map((i) => `${i.quantity}× ${i.productTitle}`).join(", ")}
        </p>
        <p className="mt-0.5 text-xs text-text/50">
          Reason: {ret.reason} ·{" "}
          {ret.shippingPaidBy === "merchant"
            ? "Merchant pays shipping"
            : "You pay shipping at UPS"}
        </p>
      </div>

      {hasLabel && ret.returnShipment ? (
        <div className="px-4 py-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-text/60">
            <Mail className="h-3.5 w-3.5 text-accent" />
            Label emailed to{" "}
            <span className="font-medium text-text">{order.customer.email}</span>
          </div>
          <UpsLabel
            trackingCode={ret.returnShipment.trackingCode ?? ""}
            fromName={order.customer.name}
            fromAddress={order.customer.shippingAddress}
            toName={merchantName}
            payOnDropoff={ret.shippingPaidBy === "customer"}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="plum" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" />
              Print label
            </Button>
            {ret.returnShipment.trackingUrl && (
              <Button asChild variant="surface">
                <a
                  href={ret.returnShipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Track return
                </a>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 px-4 py-4 text-sm text-text/60">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>
            Pending merchant approval. Since {merchantName} covers return
            shipping, they&apos;ll review this request and we&apos;ll email your
            prepaid UPS label to{" "}
            <span className="font-medium text-text">{order.customer.email}</span>{" "}
            once approved.
          </span>
        </div>
      )}
    </section>
  );
}

function UpsLabel({
  trackingCode,
  fromName,
  fromAddress,
  toName,
  payOnDropoff,
}: {
  trackingCode: string;
  fromName: string;
  fromAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  toName: string;
  payOnDropoff: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-dashed border-text/30 bg-white p-4 font-mono text-[11px] leading-tight text-neutral-900"
    >
      <div className="flex items-center justify-between border-b border-neutral-300 pb-2">
        <span className="text-lg font-black tracking-tight">UPS</span>
        <span className="rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white">
          RETURN
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 py-3">
        <div>
          <p className="text-[9px] uppercase text-neutral-500">Ship From</p>
          <p className="font-bold">{fromName}</p>
          <p>{fromAddress.line1}</p>
          {fromAddress.line2 && <p>{fromAddress.line2}</p>}
          <p>
            {fromAddress.city}, {fromAddress.state} {fromAddress.zip}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase text-neutral-500">Ship To</p>
          <p className="font-bold">{toName}</p>
          <p>c/o avnu Returns Center</p>
          <p>2100 Logistics Way</p>
          <p>Grove City, OH 43123</p>
        </div>
      </div>
      <div className="border-t border-neutral-300 pt-2">
        <p className="text-[9px] uppercase text-neutral-500">
          UPS Ground · {payOnDropoff ? "Billed at counter" : "Prepaid"}
        </p>
        {/* Faux barcode */}
        <div className="my-2 flex h-10 items-end gap-px overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              className="bg-neutral-900"
              style={{
                width: `${(i % 3) + 1}px`,
                height: `${60 + ((i * 37) % 40)}%`,
              }}
            />
          ))}
        </div>
        <p className="text-center text-sm font-bold tracking-widest">
          {trackingCode}
        </p>
        {payOnDropoff && (
          <p className="mt-2 rounded bg-amber-100 px-2 py-1 text-center text-[10px] text-amber-900">
            Hand to UPS associate — parcel measured &amp; shipping charged at
            dropoff.
          </p>
        )}
      </div>
    </motion.div>
  );
}
