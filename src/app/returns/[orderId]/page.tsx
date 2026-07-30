"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { useOmsOrders } from "@/hooks/useOmsOrders";
import { useAuth } from "@/hooks/useAuth";
import { CURRENT_SHOPPER_EMAIL } from "@/data/oms";
import { ReturnFlow } from "@/components/returns/ReturnFlow";

export default function ReturnFlowPage() {
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const { getOrder, isHydrated } = useOmsOrders();
  const { user, isAuthenticated } = useAuth();

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <p className="text-sm text-text/50">Loading…</p>
      </div>
    );
  }

  const order = getOrder(params.orderId);
  const initialItemId = searchParams.get("item") ?? undefined;
  const emailParam = (searchParams.get("email") ?? "").trim().toLowerCase();

  // Access: signed-in owner OR a guest who verified with the order email.
  const loggedInOwner =
    isAuthenticated &&
    (user?.email === order?.customer.email ||
      order?.customer.email === CURRENT_SHOPPER_EMAIL);
  const guestVerified =
    !!order && emailParam.length > 0 &&
    emailParam === order.customer.email.toLowerCase();
  const allowed = !!order && (loggedInOwner || guestVerified);

  // Guests come from the lookup; carry their verification back to "orders".
  const backHref = guestVerified
    ? `/returns?order=${order!.orderNumber}&email=${encodeURIComponent(order!.customer.email)}`
    : "/orders";

  if (!order || !allowed) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-text/30" />
        <h1 className="mt-4 font-headline text-xl tracking-tight">
          We couldn&apos;t verify this order
        </h1>
        <p className="mt-2 text-sm text-text/50">
          To start a return, look up your purchase with your order number and
          email, or sign in to your account.
        </p>
        <Link
          href="/returns"
          className="mt-6 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white"
        >
          Find your purchase
        </Link>
      </div>
    );
  }

  return (
    <ReturnFlow
      orderId={order.id}
      initialItemId={initialItemId}
      backHref={backHref}
    />
  );
}
