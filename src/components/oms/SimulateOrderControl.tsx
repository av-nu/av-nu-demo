"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";

import { useOmsOrders } from "@/hooks/useOmsOrders";
import { useToast } from "@/components/ui/Toast";
import { type StripeCheckoutEvent } from "@/data/oms";

// Phase 2 demo control: simulate a Stripe payment_intent.succeeded event, which
// creates a parent order + merchant split. "Replay" re-sends the same event to
// demonstrate idempotency (no duplicate order is created).
export function SimulateOrderControl() {
  const { simulateNewOrder, processStripeEvent } = useOmsOrders();
  const { showToast, ToastContainer } = useToast();
  const [lastEvent, setLastEvent] = useState<StripeCheckoutEvent | null>(null);

  const onSimulate = () => {
    const { event, order } = simulateNewOrder();
    setLastEvent(event);
    showToast(
      `Created ${order.orderNumber} · ${order.merchantOrders.length} merchant order${
        order.merchantOrders.length === 1 ? "" : "s"
      }`,
    );
  };

  const onReplay = () => {
    if (!lastEvent) return;
    const { created, order } = processStripeEvent(lastEvent);
    if (created) {
      showToast(`Created ${order.orderNumber}`);
    } else {
      showToast(
        `Duplicate ignored — ${order.orderNumber} already exists for ${lastEvent.id}`,
        "error",
      );
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSimulate}
        className="inline-flex items-center gap-1.5 rounded-lg bg-burgundy px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Simulate order
      </button>
      <button
        type="button"
        onClick={onReplay}
        disabled={!lastEvent}
        title={
          lastEvent
            ? `Replay ${lastEvent.id} (idempotent)`
            : "Simulate an order first"
        }
        className="inline-flex items-center gap-1.5 rounded-lg border border-divider/60 bg-bg px-3 py-2 text-sm font-medium text-text/70 transition-colors hover:bg-surface disabled:opacity-40"
      >
        <RefreshCw className="h-4 w-4" />
        Replay webhook
      </button>
      <ToastContainer />
    </div>
  );
}
