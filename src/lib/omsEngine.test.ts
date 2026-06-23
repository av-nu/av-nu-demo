import { describe, it, expect } from "vitest";

import {
  type Customer,
  type MockCheckout,
  type Order,
  type ShipmentStatus,
  makeStripeCheckoutEvent,
} from "@/data/oms";
import {
  applyStripeCheckoutEvent,
  applyShopifyWriteback,
  applyWritebackForOrder,
  applyGenerateLabel,
  applyTrackingEvent,
  createReturnRequest,
  approveReturn,
  processRefund,
} from "@/lib/omsEngine";

const customer: Customer = {
  name: "Test Shopper",
  email: "test@example.com",
  shippingAddress: {
    name: "Test Shopper",
    line1: "1 Test St",
    city: "Austin",
    state: "TX",
    zip: "78704",
    country: "US",
  },
};

function singleMerchantCheckout(): MockCheckout {
  return {
    customer,
    merchants: [
      { vendorId: "ashwood-atelier", lines: [{ productId: "ashwood-001", quantity: 1 }] },
    ],
  };
}

function twoMerchantCheckout(): MockCheckout {
  return {
    customer,
    merchants: [
      { vendorId: "ashwood-atelier", lines: [{ productId: "ashwood-001", quantity: 1 }] },
      { vendorId: "aurelith", lines: [{ productId: "ashwood-002", quantity: 2 }] },
    ],
  };
}

// Drive an order all the way to a delivered first shipment.
function driveToDelivered(order: Order): Order {
  let o = applyWritebackForOrder(order);
  for (const m of o.merchantOrders) o = applyGenerateLabel(o, m.id);
  const mId = o.merchantOrders[0].id;
  const flow: ShipmentStatus[] = [
    "pre_transit",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ];
  for (const s of flow) o = applyTrackingEvent(o, mId, s);
  return o;
}

describe("order creation + splitting", () => {
  it("creates one parent order split per merchant with sequential AVNU numbers", () => {
    const event = makeStripeCheckoutEvent(twoMerchantCheckout());
    const { created, order, orders } = applyStripeCheckoutEvent([], event);

    expect(created).toBe(true);
    expect(orders).toHaveLength(1);
    expect(order.orderNumber).toBe("AVNU-1000001");
    expect(order.merchantOrders).toHaveLength(2);
    expect(order.merchantOrders[0].merchantOrderNumber).toBe("AVNU-1000001-001");
    expect(order.merchantOrders[1].merchantOrderNumber).toBe("AVNU-1000001-002");
  });

  it("uses a 6% platform commission", () => {
    const { order } = applyStripeCheckoutEvent([], makeStripeCheckoutEvent(singleMerchantCheckout()));
    const transfer = order.merchantOrders[0].transfer!;
    expect(transfer.commissionRate).toBe(0.06);
    expect(transfer.commissionAmount).toBe(Math.round(transfer.grossAmount * 0.06));
  });

  it("does not create a duplicate order for a replayed Stripe event", () => {
    const event = makeStripeCheckoutEvent(singleMerchantCheckout());
    const first = applyStripeCheckoutEvent([], event);
    const second = applyStripeCheckoutEvent(first.orders, event);

    expect(second.created).toBe(false);
    expect(second.orders).toHaveLength(1);
    expect(second.order.id).toBe(first.order.id);
  });
});

describe("shopify writeback", () => {
  it("is idempotent (no duplicate Shopify order on retry)", () => {
    const { order } = applyStripeCheckoutEvent([], makeStripeCheckoutEvent(singleMerchantCheckout()));
    const mId = order.merchantOrders[0].id;

    const once = applyShopifyWriteback(order, mId);
    expect(once.merchantOrders[0].shopifyWritebackStatus).toBe("synced");
    const shopifyId = once.merchantOrders[0].shopifyOrderId;
    expect(shopifyId).toBeTruthy();

    const twice = applyShopifyWriteback(once, mId);
    expect(twice.merchantOrders[0].shopifyOrderId).toBe(shopifyId);
    const writebackEvents = twice.webhookEvents.filter(
      (w) => w.eventType === "orders/create",
    );
    expect(writebackEvents).toHaveLength(1);
  });
});

describe("label generation", () => {
  it("sets ready_for_fulfillment without fulfilling, and is idempotent", () => {
    let o = applyStripeCheckoutEvent([], makeStripeCheckoutEvent(singleMerchantCheckout())).order;
    const mId = o.merchantOrders[0].id;
    o = applyShopifyWriteback(o, mId);
    o = applyGenerateLabel(o, mId);

    const m = o.merchantOrders[0];
    expect(m.labelStatus).toBe("delivered_to_shopify");
    expect(m.shipmentStatus).toBe("ready_for_fulfillment");
    expect(m.fulfillmentStatus).toBe("unfulfilled"); // label != fulfilled

    const trackingBefore = m.shipment?.trackingCode;
    const again = applyGenerateLabel(o, mId);
    expect(again.merchantOrders[0].shipment?.trackingCode).toBe(trackingBefore);
  });
});

describe("tracking webhooks", () => {
  it("advances shipment status, fulfills on carrier scan, and ignores duplicates", () => {
    let o = applyStripeCheckoutEvent([], makeStripeCheckoutEvent(singleMerchantCheckout())).order;
    const mId = o.merchantOrders[0].id;
    o = applyGenerateLabel(applyShopifyWriteback(o, mId), mId);

    o = applyTrackingEvent(o, mId, "in_transit");
    expect(o.merchantOrders[0].shipmentStatus).toBe("in_transit");
    expect(o.merchantOrders[0].fulfillmentStatus).toBe("fulfilled");

    const trackerEvents = o.webhookEvents.filter((w) => w.eventType === "tracker.updated").length;
    // Re-applying the same carrier scan is a no-op.
    const dup = applyTrackingEvent(o, mId, "in_transit");
    expect(
      dup.webhookEvents.filter((w) => w.eventType === "tracker.updated").length,
    ).toBe(trackerEvents);
  });
});

describe("refunds", () => {
  it("cascades status across payment, merchant order, payout and parent order", () => {
    const o = driveToDelivered(
      applyStripeCheckoutEvent([], makeStripeCheckoutEvent(singleMerchantCheckout())).order,
    );
    const refunded = processRefund(o, {
      amount: o.grandTotal,
      type: "full",
      reason: "test",
    });

    expect(refunded.payment.refundedAmount).toBe(o.grandTotal);
    expect(refunded.paymentStatus).toBe("refunded");
    expect(refunded.refunds).toHaveLength(1);
    expect(refunded.merchantOrders[0].refundStatus).toBe("succeeded");
    expect(refunded.merchantOrders[0].payoutStatus).toBe("reversed");
    expect(refunded.status).toBe("refunded");
  });
});

describe("returns", () => {
  it("creates a request and approval generates an EasyPost return label", () => {
    const o = driveToDelivered(
      applyStripeCheckoutEvent([], makeStripeCheckoutEvent(singleMerchantCheckout())).order,
    );
    const m = o.merchantOrders[0];

    const requested = createReturnRequest(
      o,
      m.id,
      [{ orderItemId: m.items[0].id, quantity: 1 }],
      "Not as expected",
    );
    expect(requested.returns).toHaveLength(1);
    expect(requested.returns[0].status).toBe("requested");

    const approved = approveReturn(requested, requested.returns[0].id);
    const ret = approved.returns[0];
    expect(ret.status).toBe("label_created");
    expect(ret.returnShipment?.isReturn).toBe(true);
    expect(ret.returnShipment?.trackingCode).toBeTruthy();
    expect(approved.merchantOrders[0].returnStatus).toBe("label_created");
  });
});
