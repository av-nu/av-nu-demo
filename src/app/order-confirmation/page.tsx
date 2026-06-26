"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Mail, ShoppingBag, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOmsOrders } from "@/hooks/useOmsOrders";
import { LAST_ORDER_KEY } from "@/hooks/useCheckout";
import { AccountUpsell } from "@/components/checkout/AccountUpsell";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Recommendations } from "@/components/checkout/Recommendations";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const { getOrder, isHydrated } = useOmsOrders();
  const { user } = useAuth();

  // Prefer the query param; fall back to the most recently placed order id.
  const [orderId, setOrderId] = useState<string | null>(
    searchParams.get("order"),
  );

  useEffect(() => {
    if (orderId) return;
    try {
      const last = window.localStorage.getItem(LAST_ORDER_KEY);
      if (last) setOrderId(last);
    } catch {
      // ignore
    }
  }, [orderId]);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        <div className="h-48 animate-pulse rounded-3xl bg-surface/50" />
        <div className="h-64 animate-pulse rounded-3xl bg-surface/40" />
      </div>
    );
  }

  const order = orderId ? getOrder(orderId) : undefined;

  if (!order) {
    return <NoOrder />;
  }

  const purchasedProductIds = order.merchantOrders.flatMap((m) =>
    m.items.map((it) => it.productId),
  );
  const itemCount = order.merchantOrders.reduce(
    (sum, m) => sum + m.items.reduce((s, it) => s + it.quantity, 0),
    0,
  );
  const firstName = (user?.name ?? "").trim().split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl space-y-10 py-6 md:py-10">
      {/* Thank-you hero — confirmation + account sign-up side by side */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-divider/50 bg-gradient-to-b from-accent/10 to-bg px-6 py-10 sm:px-10"
      >
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Confirmation */}
          <div className="text-center lg:text-left">
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.15 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-bg lg:mx-0"
            >
              <Check className="h-8 w-8" strokeWidth={2.5} />
            </motion.span>

            <h1 className="mt-6 font-headline text-3xl tracking-tight text-text sm:text-4xl">
              Thank you{firstName ? `, ${firstName}` : ""}!
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text/60 sm:text-base lg:mx-0">
              We&apos;ve received your order and a confirmation email is on its
              way to your inbox.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text/70 lg:justify-start">
              <span className="inline-flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-accent" />
                Order{" "}
                <span className="font-semibold text-text">
                  {order.orderNumber}
                </span>
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                {order.customer.email}
              </span>
            </div>

            <p className="mt-2 text-xs text-text/40">
              {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
              {order.merchantOrders.length}{" "}
              {order.merchantOrders.length === 1 ? "shipment" : "shipments"}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface/60 px-3.5 py-1.5 text-xs text-text/60">
              <Truck className="h-3.5 w-3.5 text-accent" />
              Shipping &amp; tracking details will be provided shortly.
            </div>
          </div>

          {/* Dynamic account block — level with the confirmation */}
          <AccountUpsell
            defaultName={user?.name ?? order.customer.name}
            defaultEmail={user?.email ?? order.customer.email}
          />
        </div>
      </motion.section>

      {/* Order summary */}
      <OrderSummary order={order} />

      {/* Recommendations */}
      <Recommendations purchasedProductIds={purchasedProductIds} />
    </div>
  );
}

function NoOrder() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-text/40">
        <ShoppingBag className="h-6 w-6" />
      </span>
      <h1 className="mt-5 font-headline text-2xl tracking-tight text-text">
        No order to show
      </h1>
      <p className="mt-2 text-sm text-text/55">
        We couldn&apos;t find a recent order. Browse the marketplace to start a
        new one.
      </p>
      <Button asChild variant="plum" size="lg" className="mt-6">
        <Link href="/">Start shopping</Link>
      </Button>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl py-8">
          <div className="h-48 animate-pulse rounded-3xl bg-surface/50" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
