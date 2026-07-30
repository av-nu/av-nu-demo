"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PackageSearch, RotateCcw, Search, Truck } from "lucide-react";

import { useOmsOrders } from "@/hooks/useOmsOrders";
import { useAuth } from "@/hooks/useAuth";
import {
  type MerchantOrder,
  type Order,
  type ReturnRequest,
  customerShipmentLabel,
  deliveredAt,
  formatUsd,
  humanizeStatus,
  itemReturnEligibility,
} from "@/data/oms";

export default function ReturnsLandingPage() {
  return (
    <Suspense fallback={<div className="py-10 text-sm text-text/50">Loading…</div>}>
      <ReturnsLanding />
    </Suspense>
  );
}

function ReturnsLanding() {
  const { orders, isHydrated } = useOmsOrders();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<{ order: Order; email: string } | null>(
    null,
  );

  const lookup = useMemo(
    () => (num: string, mail: string): Order | null => {
      const n = num.trim().toLowerCase();
      const m = mail.trim().toLowerCase();
      if (!n || !m) return null;
      return (
        orders.find(
          (o) =>
            (o.orderNumber.toLowerCase() === n || o.id.toLowerCase() === n) &&
            o.customer.email.toLowerCase() === m,
        ) ?? null
      );
    },
    [orders],
  );

  // Auto-verify when returning from the flow via query params.
  useEffect(() => {
    if (!isHydrated) return;
    const qOrder = searchParams.get("order");
    const qEmail = searchParams.get("email");
    if (qOrder && qEmail && !matched) {
      const found = lookup(qOrder, qEmail);
      if (found) setMatched({ order: found, email: qEmail });
    }
  }, [isHydrated, searchParams, lookup, matched]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const found = lookup(orderNumber, email);
    if (!found) {
      setError(
        "We couldn't find a matching order. Double-check your order number and email.",
      );
      setMatched(null);
      return;
    }
    setMatched({ order: found, email: email.trim() });
  };

  if (matched) {
    return (
      <GuestPurchaseView
        order={matched.order}
        email={matched.email}
        onReset={() => {
          setMatched(null);
          router.replace("/returns");
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg py-8 md:py-12">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <PackageSearch className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-headline text-2xl tracking-tight">
          Start a return
        </h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-text/50">
          Find your purchase to begin a return. Enter your order number and the
          email used at checkout.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mt-8 space-y-3 rounded-2xl border border-divider/60 bg-bg p-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-text/50">
            Order number
          </label>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="AVNU-1000001"
            className="h-11 w-full rounded-lg border border-divider/60 bg-bg px-3 text-sm focus:border-accent/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text/50">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="h-11 w-full rounded-lg border border-divider/60 bg-bg px-3 text-sm focus:border-accent/50 focus:outline-none"
          />
        </div>
        {error && <p className="text-xs text-pink">{error}</p>}
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy text-sm font-medium text-white"
        >
          <Search className="h-4 w-4" />
          Find your purchase
        </button>
      </form>

      {isAuthenticated && (
        <p className="mt-4 text-center text-sm text-text/50">
          Have an account?{" "}
          <Link href="/orders" className="font-medium text-accent">
            View your orders
          </Link>
        </p>
      )}

      <div className="mx-auto mt-6 max-w-sm rounded-xl bg-surface/60 px-4 py-3 text-center text-xs text-text/50">
        Items can be returned within 30 days of delivery. Defective or wrong
        items ship back free; change-of-mind returns are paid at UPS dropoff.
      </div>
    </div>
  );
}

function GuestPurchaseView({
  order,
  email,
  onReset,
}: {
  order: Order;
  email: string;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl py-6 md:py-8">
      <button
        type="button"
        onClick={onReset}
        className="text-sm text-text/50 transition-colors hover:text-text"
      >
        ← Look up a different order
      </button>

      <div className="mt-3">
        <h1 className="font-headline text-2xl tracking-tight">
          {order.orderNumber}
        </h1>
        <p className="mt-1 text-sm text-text/50">
          Ordered{" "}
          {new Date(order.createdAt).toLocaleDateString("en-US", {
            dateStyle: "long",
          })}{" "}
          · {order.customer.name}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {order.merchantOrders.map((m, i) => (
          <GuestPackageCard
            key={m.id}
            order={order}
            m={m}
            index={i}
            email={email}
            returns={order.returns.filter((r) => r.merchantOrderId === m.id)}
          />
        ))}
      </div>
    </div>
  );
}

function GuestPackageCard({
  order,
  m,
  index,
  email,
  returns,
}: {
  order: Order;
  m: MerchantOrder;
  index: number;
  email: string;
  returns: ReturnRequest[];
}) {
  const label = customerShipmentLabel(m.shipmentStatus);
  const delivered = deliveredAt(m);
  const activeReturn = returns.find(
    (r) => r.status !== "rejected" && r.status !== "closed",
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-divider/60 bg-bg">
      <div className="flex items-center justify-between gap-3 border-b border-divider/60 px-4 py-3">
        <div>
          <p className="text-xs text-text/40">
            Shipment {index + 1} · {m.vendorName}
          </p>
          <p className="text-sm font-semibold">{label}</p>
        </div>
        <Truck className="h-5 w-5 text-text/30" />
      </div>

      <ul className="divide-y divide-divider/40 px-4">
        {m.items.map((it) => {
          const elig = itemReturnEligibility(m, it);
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
                <p className="text-xs text-text/40">Qty {it.quantity}</p>
              </div>
              <ReturnButton order={order} itemId={it.id} email={email} eligible={elig.eligible} reason={elig.reason} />
            </li>
          );
        })}
      </ul>

      {delivered && (
        <div className="border-t border-divider/60 px-4 py-2 text-xs text-text/50">
          Delivered{" "}
          {new Date(delivered).toLocaleDateString("en-US", {
            dateStyle: "medium",
          })}
        </div>
      )}

      {activeReturn && (
        <div className="border-t border-divider/60 px-4 py-3 text-sm text-text/60">
          Return · {humanizeStatus(activeReturn.status)}
          {activeReturn.returnShipment?.trackingUrl && (
            <a
              href={activeReturn.returnShipment.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-2 font-medium text-accent"
            >
              Track
            </a>
          )}
        </div>
      )}
    </section>
  );
}

function ReturnButton({
  order,
  itemId,
  email,
  eligible,
  reason,
}: {
  order: Order;
  itemId: string;
  email: string;
  eligible: boolean;
  reason?: string;
}) {
  if (!eligible) {
    return (
      <span className="shrink-0 text-right text-[11px] text-text/40">
        {reason ?? "Not eligible"}
      </span>
    );
  }
  return (
    <motion.div whileTap={{ scale: 0.96 }} className="shrink-0">
      <Link
        href={`/returns/${order.id}?item=${itemId}&email=${encodeURIComponent(email)}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/5"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Return
      </Link>
    </motion.div>
  );
}
