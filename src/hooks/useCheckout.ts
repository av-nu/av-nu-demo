"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "./useCart";
import { useAuth } from "./useAuth";
import { useOmsOrders } from "./useOmsOrders";
import { makeStripeCheckoutEvent } from "@/data/oms";
import { buildCheckoutFromCart } from "@/lib/checkout";

export const LAST_ORDER_KEY = "avnu-last-order";

/**
 * Places the current cart as a paid order (mirroring the Stripe webhook → order
 * creation path), clears the cart, remembers the new order id, and returns it so
 * callers can route to the confirmation page.
 */
export function useCheckout() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { processStripeEvent } = useOmsOrders();

  const checkout = useCallback((): string | null => {
    if (items.length === 0) return null;

    const mockCheckout = buildCheckoutFromCart(items, user);
    const event = makeStripeCheckoutEvent(mockCheckout);
    const { order } = processStripeEvent(event);

    try {
      window.localStorage.setItem(LAST_ORDER_KEY, order.id);
    } catch {
      // non-fatal in the demo
    }

    clearCart();
    return order.id;
  }, [items, user, processStripeEvent, clearCart]);

  const checkoutAndGo = useCallback(() => {
    const orderId = checkout();
    if (orderId) {
      router.push(`/order-confirmation?order=${orderId}`);
    }
  }, [checkout, router]);

  return { checkout, checkoutAndGo };
}
