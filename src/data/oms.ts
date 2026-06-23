// avnu OMS — demo data model.
//
// This is a FRONTEND DEMO that mirrors the real avnu-marketplace OMS
// (NestJS + Prisma) entities, status models, and end-to-end flow. No real
// Stripe / Shopify / EasyPost calls happen here — state is seeded and advanced
// by a mock lifecycle engine (see src/lib/omsEngine.ts) and persisted in
// localStorage (see src/hooks/useOmsOrders.ts).
//
// Status enums and entity shapes intentionally track the real codebase so the
// demo reads like the production system:
//   - separate status fields (payment / fulfillment / shipment / label /
//     shopify writeback / return / refund / payout)
//   - parent Order + per-merchant MerchantOrder split
//   - AVNU-1000001 / AVNU-1000001-001 public numbering
//   - immutable OrderEvent timeline + WebhookEvent store

import { getProductById, getBrandById, getProductsByBrandId } from "@/lib/data";
import { mockBrands } from "@/data/mockBrands";

// ---------------------------------------------------------------------------
// Status enums (string unions mirroring the real Prisma enums + spec lifecycle)
// ---------------------------------------------------------------------------

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "on_hold"
  | "cancelled"
  | "awaiting_confirmation";

export type FulfillmentStatus =
  | "unfulfilled"
  | "partially_fulfilled"
  | "fulfilled"
  | "processing"
  | "cancelled"
  | "failed";

// Expanded shipment lifecycle per OMS spec.
export type ShipmentStatus =
  | "not_ready"
  | "pending_label"
  | "label_created"
  | "ready_for_fulfillment"
  | "fulfilled_pending_carrier_scan"
  | "pre_transit"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delivery_exception"
  | "returned_to_sender"
  | "lost"
  | "cancelled"
  | "label_voided"
  | "unknown";

export type LabelStatus =
  | "not_required"
  | "pending"
  | "purchased"
  | "delivered_to_shopify"
  | "failed"
  | "void_requested"
  | "voided"
  | "refund_requested"
  | "refunded"
  | "expired";

export type ShopifyWritebackStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "failed"
  | "out_of_sync"
  | "not_required";

export type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "label_created"
  | "in_transit"
  | "delivered"
  | "inspected"
  | "refunded"
  | "closed"
  | "cancelled";

export type RefundStatus =
  | "none"
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "partially_refunded";

export type PayoutStatus =
  | "pending"
  | "scheduled"
  | "processing"
  | "completed"
  | "failed"
  | "reversed"
  | "on_hold";

// Parent-order rollup status.
export type OrderStatus =
  | "pending"
  | "processing"
  | "partially_shipped"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "returned"
  | "refunded"
  | "on_hold"
  | "failed";

// ---------------------------------------------------------------------------
// Supporting value types
// ---------------------------------------------------------------------------

export type Address = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
};

export type Customer = {
  name: string;
  email: string;
  phone?: string;
  shippingAddress: Address;
  billingAddress?: Address;
};

export type EventActor = "system" | "admin" | "customer" | "merchant";
export type WebhookSource = "stripe" | "shopify" | "easypost";

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export type OrderItem = {
  id: string;
  merchantOrderId: string;
  productId: string;
  productTitle: string;
  image?: string;
  variantId?: string;
  sku?: string;
  quantity: number;
  // Snapshotted at purchase time; amounts in integer cents.
  unitPrice: number;
  returnedQuantity: number;
};

export type TrackingEvent = {
  id: string;
  status: ShipmentStatus;
  message: string;
  location?: string;
  occurredAt: string; // ISO
};

export type Shipment = {
  id: string;
  merchantOrderId: string;
  isReturn: boolean;
  // EasyPost references (avnu-owned label).
  easypostShipmentId?: string;
  easypostTrackerId?: string;
  carrier?: string;
  service?: string;
  trackingCode?: string;
  trackingUrl?: string;
  labelUrl?: string;
  labelStatus: LabelStatus;
  status: ShipmentStatus;
  shippingCost?: number; // cents
  estimatedDeliveryDate?: string; // ISO
  trackingEvents: TrackingEvent[];
};

export type MerchantTransfer = {
  id: string;
  merchantOrderId: string;
  stripeTransferId?: string;
  stripeTransferGroup?: string;
  grossAmount: number; // cents
  commissionRate: number; // 0..1
  commissionAmount: number; // cents
  shippingDeduction: number; // cents (label cost)
  stripeFee: number; // cents
  netAmount: number; // cents
  status: PayoutStatus;
  holdReason?: string;
};

// Snapshot of the data avnu writes into the merchant's Shopify order. Mirrors
// the tags / note attributes / metafields produced by the real
// fulfillment/shopify-order.service in avnu-marketplace.
export type ShopifyTagSet = {
  tags: string[];
  noteAttributes: { name: string; value: string }[];
  metafields: { namespace: string; key: string; value: string }[];
};

export type ShopifyWriteback = ShopifyTagSet & {
  writtenAt: string; // ISO
};

export type MerchantOrder = {
  id: string;
  orderId: string;
  merchantOrderNumber: string; // AVNU-1000001-001
  vendorId: string;
  vendorName: string;
  vendorShopDomain?: string;
  shopifyOrderId?: string;
  shopifyOrderName?: string;
  shopifySync?: ShopifyWriteback;

  // Independent status fields.
  fulfillmentStatus: FulfillmentStatus;
  shipmentStatus: ShipmentStatus;
  shopifyWritebackStatus: ShopifyWritebackStatus;
  labelStatus: LabelStatus;
  returnStatus?: ReturnStatus;
  refundStatus: RefundStatus;
  payoutStatus: PayoutStatus;

  items: OrderItem[];
  shipment?: Shipment;
  transfer?: MerchantTransfer;

  // Amounts in cents.
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
};

export type Payment = {
  id: string;
  orderId: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeReceiptUrl?: string;
  amount: number; // cents
  currency: string;
  status: PaymentStatus;
  refundedAmount: number; // cents
};

export type RefundType =
  | "full"
  | "partial"
  | "item"
  | "quantity"
  | "shipping"
  | "tax";

export type Refund = {
  id: string;
  orderId: string;
  merchantOrderId?: string;
  stripeRefundId?: string;
  type: RefundType;
  amount: number; // cents
  reason?: string;
  status: RefundStatus;
  createdAt: string; // ISO
};

export type ReturnItem = {
  id: string;
  orderItemId: string;
  productTitle: string;
  quantity: number;
  reason?: string;
};

export type ReturnRequest = {
  id: string;
  orderId: string;
  merchantOrderId: string;
  status: ReturnStatus;
  reason?: string;
  items: ReturnItem[];
  returnShipment?: Shipment;
  refundId?: string;
  createdAt: string; // ISO
};

export type OrderEvent = {
  id: string;
  orderId: string;
  merchantOrderId?: string;
  type: string;
  message: string;
  actor: EventActor;
  createdAt: string; // ISO
  metadata?: Record<string, string | number | boolean>;
};

export type WebhookEvent = {
  id: string;
  orderId?: string;
  source: WebhookSource;
  eventType: string;
  idempotencyKey: string;
  status: "received" | "processed" | "failed";
  receivedAt: string; // ISO
  summary?: string;
};

export type AdminNote = {
  id: string;
  orderId: string;
  author: string;
  body: string;
  createdAt: string; // ISO
};

export type AdminActionLog = {
  id: string;
  orderId: string;
  action: string;
  actor: string;
  role: string;
  detail?: string;
  createdAt: string; // ISO
};

export type Order = {
  id: string;
  orderNumber: string; // AVNU-1000001
  createdAt: string; // ISO
  customer: Customer;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  payment: Payment;
  merchantOrders: MerchantOrder[];
  refunds: Refund[];
  returns: ReturnRequest[];
  events: OrderEvent[];
  notes: AdminNote[];
  actionLog: AdminActionLog[];
  webhookEvents: WebhookEvent[];

  // Amounts in cents.
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
};

// ---------------------------------------------------------------------------
// Public order numbering (AVNU-1000001 / AVNU-1000001-001)
// ---------------------------------------------------------------------------

export const ORDER_NUMBER_START = 1000001;

export function formatOrderNumber(seq: number): string {
  return `AVNU-${seq}`;
}

export function formatMerchantOrderNumber(
  parentNumber: string,
  index: number,
): string {
  return `${parentNumber}-${String(index + 1).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Money helper
// ---------------------------------------------------------------------------

export function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

// ---------------------------------------------------------------------------
// Status presentation (labels + badge tones)
// ---------------------------------------------------------------------------

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "pending";

export function humanizeStatus(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// A single tone map keyed by raw status value. Multiple enums share values
// (e.g. "failed", "delivered") and resolve to the same tone, which is fine for
// presentation.
const TONE_BY_STATUS: Record<string, BadgeTone> = {
  // pending-ish
  pending: "pending",
  processing: "info",
  syncing: "info",
  awaiting_confirmation: "pending",
  scheduled: "pending",
  not_ready: "neutral",
  pending_label: "pending",
  unfulfilled: "warning",
  requested: "pending",
  void_requested: "pending",
  refund_requested: "pending",
  // in-progress / info
  label_created: "info",
  ready_for_fulfillment: "info",
  fulfilled_pending_carrier_scan: "info",
  pre_transit: "info",
  in_transit: "info",
  out_for_delivery: "info",
  partially_fulfilled: "info",
  partially_shipped: "info",
  shipped: "info",
  approved: "info",
  label_status: "info",
  // success
  completed: "success",
  delivered: "success",
  fulfilled: "success",
  synced: "success",
  purchased: "success",
  delivered_to_shopify: "success",
  succeeded: "success",
  inspected: "success",
  closed: "neutral",
  // warning
  on_hold: "warning",
  out_of_sync: "warning",
  delivery_exception: "warning",
  returned_to_sender: "warning",
  partially_refunded: "warning",
  refunded: "warning",
  returned: "warning",
  expired: "warning",
  // danger
  failed: "danger",
  lost: "danger",
  cancelled: "danger",
  rejected: "danger",
  reversed: "danger",
  voided: "danger",
  // neutral defaults
  none: "neutral",
  not_required: "neutral",
  unknown: "neutral",
};

export function statusTone(value: string): BadgeTone {
  return TONE_BY_STATUS[value] ?? "neutral";
}

// ---------------------------------------------------------------------------
// Customer-facing presentation + return eligibility
// ---------------------------------------------------------------------------

// The demo "logged-in shopper" whose orders show on the customer order pages.
export const CURRENT_SHOPPER_EMAIL = "maya.holloway@example.com";

export const RETURN_WINDOW_DAYS = 30;

// Shopper-friendly labels for the per-package shipment status. Deliberately
// hides operational detail.
const CUSTOMER_SHIPMENT_LABELS: Record<ShipmentStatus, string> = {
  not_ready: "Preparing your order",
  pending_label: "Preparing to ship",
  label_created: "Preparing to ship",
  ready_for_fulfillment: "Preparing to ship",
  fulfilled_pending_carrier_scan: "Shipped",
  pre_transit: "Shipped",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  delivery_exception: "Delivery issue — we're on it",
  returned_to_sender: "Returned to sender",
  lost: "Delayed",
  cancelled: "Cancelled",
  label_voided: "Preparing to ship",
  unknown: "Processing",
};

export function customerShipmentLabel(status: ShipmentStatus): string {
  return CUSTOMER_SHIPMENT_LABELS[status] ?? "Processing";
}

// Best-effort delivered timestamp from the tracking history.
export function deliveredAt(m: MerchantOrder): string | undefined {
  const delivered = m.shipment?.trackingEvents.find(
    (t) => t.status === "delivered",
  );
  return delivered?.occurredAt;
}

export type ItemReturnEligibility = {
  eligible: boolean;
  remainingQuantity: number;
  reason?: string;
};

export function itemReturnEligibility(
  m: MerchantOrder,
  item: OrderItem,
): ItemReturnEligibility {
  const remainingQuantity = item.quantity - item.returnedQuantity;
  if (remainingQuantity <= 0) {
    return { eligible: false, remainingQuantity: 0, reason: "Already returned" };
  }
  if (m.shipmentStatus !== "delivered") {
    return {
      eligible: false,
      remainingQuantity,
      reason: "Available after delivery",
    };
  }
  const delivered = deliveredAt(m);
  if (delivered) {
    const days = (Date.now() - new Date(delivered).getTime()) / 86_400_000;
    if (days > RETURN_WINDOW_DAYS) {
      return {
        eligible: false,
        remainingQuantity,
        reason: `Return window closed (${RETURN_WINDOW_DAYS} days)`,
      };
    }
  }
  return { eligible: true, remainingQuantity };
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const PLATFORM_COMMISSION_RATE = 0.06;

function isoDaysAgo(days: number, hourOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() + hourOffset, 0, 0, 0);
  return d.toISOString();
}

function isoHoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours, 0, 0, 0);
  return d.toISOString();
}

type SeedLine = { productId: string; quantity: number };
type SeedMerchant = { vendorId: string; lines: SeedLine[] };

type SeedSpec = {
  seq: number;
  daysAgo: number;
  customer: Customer;
  merchants: SeedMerchant[];
  // High-level scenario the builder uses to derive realistic statuses.
  scenario:
    | "delivered"
    | "in_transit"
    | "ready_for_fulfillment"
    | "writeback_failed"
    | "label_failed"
    | "delivery_exception"
    | "return_in_progress"
    | "refunded"
    | "new_paid";
};

function resolveLine(merchantOrderId: string, line: SeedLine, idx: number): OrderItem {
  const product = getProductById(line.productId);
  const title = product?.name ?? "avnu product";
  const image = product?.images?.[0];
  const unitPrice = Math.round((product?.price ?? 48) * 100);
  return {
    id: `${merchantOrderId}-item-${idx + 1}`,
    merchantOrderId,
    productId: line.productId,
    productTitle: title,
    image,
    variantId: `gid://shopify/ProductVariant/${1000 + idx}`,
    sku: `${line.productId.toUpperCase()}-STD`,
    quantity: line.quantity,
    unitPrice,
    returnedQuantity: 0,
  };
}

// Derives the bundle of per-merchant statuses + shipment + transfer for a
// given scenario. Keeps seed specs terse while producing rich detail.
function statusesForScenario(scenario: SeedSpec["scenario"]): {
  fulfillmentStatus: FulfillmentStatus;
  shipmentStatus: ShipmentStatus;
  shopifyWritebackStatus: ShopifyWritebackStatus;
  labelStatus: LabelStatus;
  refundStatus: RefundStatus;
  payoutStatus: PayoutStatus;
  returnStatus?: ReturnStatus;
} {
  switch (scenario) {
    case "new_paid":
      return {
        fulfillmentStatus: "unfulfilled",
        shipmentStatus: "pending_label",
        shopifyWritebackStatus: "pending",
        labelStatus: "pending",
        refundStatus: "none",
        payoutStatus: "pending",
      };
    case "ready_for_fulfillment":
      return {
        fulfillmentStatus: "unfulfilled",
        shipmentStatus: "ready_for_fulfillment",
        shopifyWritebackStatus: "synced",
        labelStatus: "delivered_to_shopify",
        refundStatus: "none",
        payoutStatus: "scheduled",
      };
    case "writeback_failed":
      return {
        fulfillmentStatus: "unfulfilled",
        shipmentStatus: "not_ready",
        shopifyWritebackStatus: "failed",
        labelStatus: "not_required",
        refundStatus: "none",
        payoutStatus: "pending",
      };
    case "label_failed":
      return {
        fulfillmentStatus: "unfulfilled",
        shipmentStatus: "pending_label",
        shopifyWritebackStatus: "synced",
        labelStatus: "failed",
        refundStatus: "none",
        payoutStatus: "pending",
      };
    case "in_transit":
      return {
        fulfillmentStatus: "fulfilled",
        shipmentStatus: "in_transit",
        shopifyWritebackStatus: "synced",
        labelStatus: "delivered_to_shopify",
        refundStatus: "none",
        payoutStatus: "scheduled",
      };
    case "delivery_exception":
      return {
        fulfillmentStatus: "fulfilled",
        shipmentStatus: "delivery_exception",
        shopifyWritebackStatus: "synced",
        labelStatus: "delivered_to_shopify",
        refundStatus: "none",
        payoutStatus: "on_hold",
      };
    case "delivered":
      return {
        fulfillmentStatus: "fulfilled",
        shipmentStatus: "delivered",
        shopifyWritebackStatus: "synced",
        labelStatus: "delivered_to_shopify",
        refundStatus: "none",
        payoutStatus: "completed",
      };
    case "return_in_progress":
      return {
        fulfillmentStatus: "fulfilled",
        shipmentStatus: "delivered",
        shopifyWritebackStatus: "synced",
        labelStatus: "delivered_to_shopify",
        refundStatus: "none",
        payoutStatus: "completed",
        returnStatus: "label_created",
      };
    case "refunded":
      return {
        fulfillmentStatus: "fulfilled",
        shipmentStatus: "delivered",
        shopifyWritebackStatus: "synced",
        labelStatus: "delivered_to_shopify",
        refundStatus: "succeeded",
        payoutStatus: "reversed",
        returnStatus: "refunded",
      };
  }
}

function buildShipment(
  merchantOrderId: string,
  scenario: SeedSpec["scenario"],
  shipmentStatus: ShipmentStatus,
  labelStatus: LabelStatus,
  createdDaysAgo: number,
): Shipment | undefined {
  const hasLabel =
    labelStatus !== "not_required" &&
    labelStatus !== "pending" &&
    labelStatus !== "failed";
  if (!hasLabel && shipmentStatus === "not_ready") return undefined;
  if (!hasLabel && labelStatus === "failed") {
    // Failed label: shipment exists but without label artifacts.
    return {
      id: `${merchantOrderId}-shp`,
      merchantOrderId,
      isReturn: false,
      easypostShipmentId: `shp_${merchantOrderId.slice(-6)}`,
      labelStatus,
      status: shipmentStatus,
      shippingCost: undefined,
      trackingEvents: [],
    };
  }
  if (!hasLabel) return undefined;

  const trackingCode = `1Z${merchantOrderId.slice(-8).toUpperCase()}`;
  const events: TrackingEvent[] = [];
  const lifecycle: ShipmentStatus[] = [
    "pre_transit",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ];
  const reachedIndex = lifecycle.indexOf(shipmentStatus);
  if (shipmentStatus === "delivery_exception") {
    events.push(
      {
        id: `${merchantOrderId}-te-1`,
        status: "pre_transit",
        message: "Shipping label created, carrier awaiting package",
        occurredAt: isoDaysAgo(createdDaysAgo),
      },
      {
        id: `${merchantOrderId}-te-2`,
        status: "in_transit",
        message: "Package in transit",
        location: "Memphis, TN",
        occurredAt: isoDaysAgo(Math.max(0, createdDaysAgo - 1)),
      },
      {
        id: `${merchantOrderId}-te-3`,
        status: "delivery_exception",
        message: "Delivery exception: address could not be located",
        location: "Austin, TX",
        occurredAt: isoHoursAgo(6),
      },
    );
  } else if (reachedIndex >= 0) {
    for (let i = 0; i <= reachedIndex; i++) {
      events.push({
        id: `${merchantOrderId}-te-${i + 1}`,
        status: lifecycle[i],
        message:
          lifecycle[i] === "pre_transit"
            ? "Shipping label created, carrier awaiting package"
            : lifecycle[i] === "in_transit"
              ? "Package in transit"
              : lifecycle[i] === "out_for_delivery"
                ? "Out for delivery"
                : "Delivered",
        location: lifecycle[i] === "delivered" ? "Front porch" : "In network",
        occurredAt: isoDaysAgo(Math.max(0, createdDaysAgo - i)),
      });
    }
  }

  return {
    id: `${merchantOrderId}-shp`,
    merchantOrderId,
    isReturn: false,
    easypostShipmentId: `shp_${merchantOrderId.slice(-6)}`,
    easypostTrackerId: `trk_${merchantOrderId.slice(-6)}`,
    carrier: "USPS",
    service: "Priority",
    trackingCode,
    trackingUrl: `https://track.easypost.com/${trackingCode}`,
    labelUrl: `https://easypost-files.s3.amazonaws.com/labels/${merchantOrderId}.pdf`,
    labelStatus,
    status: shipmentStatus,
    shippingCost: 795,
    estimatedDeliveryDate: isoDaysAgo(createdDaysAgo - 4),
    trackingEvents: events,
  };
}

function buildMerchantOrder(
  order: { id: string; orderNumber: string; transferGroup: string },
  seedMerchant: SeedMerchant,
  index: number,
  scenario: SeedSpec["scenario"],
  createdDaysAgo: number,
): MerchantOrder {
  const merchantOrderId = `${order.id}-m${index + 1}`;
  const brand = getBrandById(seedMerchant.vendorId);
  const items = seedMerchant.lines.map((line, i) =>
    resolveLine(merchantOrderId, line, i),
  );
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const shippingTotal = 795;
  const taxTotal = Math.round(subtotal * 0.08);
  const total = subtotal + shippingTotal + taxTotal;

  const s = statusesForScenario(scenario);
  const shipment = buildShipment(
    merchantOrderId,
    scenario,
    s.shipmentStatus,
    s.labelStatus,
    createdDaysAgo,
  );

  const commissionAmount = Math.round(subtotal * PLATFORM_COMMISSION_RATE);
  const stripeFee = Math.round(total * 0.029) + 30;
  const shippingDeduction = shipment?.shippingCost ?? 0;
  const netAmount = subtotal - commissionAmount - shippingDeduction;
  const transfer: MerchantTransfer = {
    id: `${merchantOrderId}-trf`,
    merchantOrderId,
    stripeTransferId:
      s.payoutStatus === "completed" || s.payoutStatus === "reversed"
        ? `tr_${merchantOrderId.slice(-6)}`
        : undefined,
    stripeTransferGroup: order.transferGroup,
    grossAmount: subtotal,
    commissionRate: PLATFORM_COMMISSION_RATE,
    commissionAmount,
    shippingDeduction,
    stripeFee,
    netAmount,
    status: s.payoutStatus,
    holdReason:
      s.payoutStatus === "on_hold" ? "Delivery exception under review" : undefined,
  };

  const synced =
    s.shopifyWritebackStatus === "synced" ||
    s.shopifyWritebackStatus === "out_of_sync";

  return {
    id: merchantOrderId,
    orderId: order.id,
    merchantOrderNumber: formatMerchantOrderNumber(order.orderNumber, index),
    vendorId: seedMerchant.vendorId,
    vendorName: brand?.name ?? seedMerchant.vendorId,
    vendorShopDomain: `${seedMerchant.vendorId}.myshopify.com`,
    shopifyOrderId: synced ? `gid://shopify/Order/${5500000 + index}` : undefined,
    shopifyOrderName: synced ? `#${1200 + index}` : undefined,
    fulfillmentStatus: s.fulfillmentStatus,
    shipmentStatus: s.shipmentStatus,
    shopifyWritebackStatus: s.shopifyWritebackStatus,
    labelStatus: s.labelStatus,
    returnStatus: s.returnStatus,
    refundStatus: s.refundStatus,
    payoutStatus: s.payoutStatus,
    items,
    shipment,
    transfer,
    subtotal,
    shippingTotal,
    taxTotal,
    total,
  };
}

export function rollupOrderStatus(merchantOrders: MerchantOrder[]): OrderStatus {
  const statuses = merchantOrders.map((m) => m.shipmentStatus);
  if (merchantOrders.some((m) => m.refundStatus === "succeeded")) return "refunded";
  if (merchantOrders.some((m) => m.returnStatus && m.returnStatus !== "closed"))
    return "returned";
  if (statuses.every((s) => s === "delivered")) return "delivered";
  if (statuses.some((s) => s === "in_transit" || s === "out_for_delivery")) {
    return statuses.every((s) =>
      ["in_transit", "out_for_delivery", "delivered"].includes(s),
    )
      ? "shipped"
      : "partially_shipped";
  }
  if (merchantOrders.some((m) => m.shopifyWritebackStatus === "failed"))
    return "processing";
  return "processing";
}

function buildEvents(order: Order, createdDaysAgo: number): OrderEvent[] {
  const events: OrderEvent[] = [
    {
      id: `${order.id}-ev-1`,
      orderId: order.id,
      type: "payment.succeeded",
      message: `Payment captured · ${formatUsd(order.grandTotal)}`,
      actor: "system",
      createdAt: isoDaysAgo(createdDaysAgo),
    },
    {
      id: `${order.id}-ev-2`,
      orderId: order.id,
      type: "order.created",
      message: `Parent order ${order.orderNumber} created and split into ${order.merchantOrders.length} merchant order(s)`,
      actor: "system",
      createdAt: isoDaysAgo(createdDaysAgo),
    },
  ];
  order.merchantOrders.forEach((m) => {
    if (m.shopifyWritebackStatus === "synced") {
      events.push({
        id: `${m.id}-ev-wb`,
        orderId: order.id,
        merchantOrderId: m.id,
        type: "shopify.writeback.succeeded",
        message: `Written to ${m.vendorName} Shopify (${m.shopifyOrderName})`,
        actor: "system",
        createdAt: isoDaysAgo(createdDaysAgo),
      });
    }
    if (m.shopifyWritebackStatus === "failed") {
      events.push({
        id: `${m.id}-ev-wbf`,
        orderId: order.id,
        merchantOrderId: m.id,
        type: "shopify.writeback.failed",
        message: `Shopify writeback failed for ${m.vendorName} — retry scheduled`,
        actor: "system",
        createdAt: isoHoursAgo(3),
      });
    }
    if (m.labelStatus === "delivered_to_shopify") {
      events.push({
        id: `${m.id}-ev-lbl`,
        orderId: order.id,
        merchantOrderId: m.id,
        type: "label.delivered_to_shopify",
        message: `EasyPost label delivered to ${m.vendorName} Shopify admin`,
        actor: "system",
        createdAt: isoDaysAgo(createdDaysAgo),
      });
    }
    if (m.labelStatus === "failed") {
      events.push({
        id: `${m.id}-ev-lblf`,
        orderId: order.id,
        merchantOrderId: m.id,
        type: "label.generation.failed",
        message: `EasyPost label generation failed for ${m.vendorName}`,
        actor: "system",
        createdAt: isoHoursAgo(2),
      });
    }
    (m.shipment?.trackingEvents ?? []).forEach((te, i) => {
      events.push({
        id: `${m.id}-ev-trk-${i}`,
        orderId: order.id,
        merchantOrderId: m.id,
        type: `tracking.${te.status}`,
        message: te.message,
        actor: "system",
        createdAt: te.occurredAt,
      });
    });
  });
  return events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function buildWebhookEvents(order: Order, createdDaysAgo: number): WebhookEvent[] {
  const evs: WebhookEvent[] = [
    {
      id: `${order.id}-wh-1`,
      orderId: order.id,
      source: "stripe",
      eventType: "payment_intent.succeeded",
      idempotencyKey: order.payment.stripePaymentIntentId ?? order.id,
      status: "processed",
      receivedAt: isoDaysAgo(createdDaysAgo),
      summary: `${formatUsd(order.payment.amount)} captured`,
    },
  ];
  order.merchantOrders.forEach((m) => {
    if (m.shipment?.trackingCode) {
      evs.push({
        id: `${m.id}-wh-ep`,
        orderId: order.id,
        source: "easypost",
        eventType: "tracker.updated",
        idempotencyKey: `${m.shipment.easypostTrackerId}-${m.shipmentStatus}`,
        status: "processed",
        receivedAt: isoDaysAgo(Math.max(0, createdDaysAgo - 2)),
        summary: `${m.shipment.trackingCode} → ${humanizeStatus(m.shipmentStatus)}`,
      });
    }
  });
  return evs;
}

function buildOrder(spec: SeedSpec): Order {
  const orderNumber = formatOrderNumber(spec.seq);
  const orderId = `ord-${spec.seq}`;
  const transferGroup = `grp_${spec.seq}`;

  const merchantOrders = spec.merchants.map((m, i) =>
    buildMerchantOrder({ id: orderId, orderNumber, transferGroup }, m, i, spec.scenario, spec.daysAgo),
  );

  const subtotal = merchantOrders.reduce((s, m) => s + m.subtotal, 0);
  const shippingTotal = merchantOrders.reduce((s, m) => s + m.shippingTotal, 0);
  const taxTotal = merchantOrders.reduce((s, m) => s + m.taxTotal, 0);
  const grandTotal = subtotal + shippingTotal + taxTotal;

  const refunded = spec.scenario === "refunded";
  const payment: Payment = {
    id: `${orderId}-pay`,
    orderId,
    stripePaymentIntentId: `pi_${spec.seq}ABC`,
    stripeChargeId: `ch_${spec.seq}XYZ`,
    stripeReceiptUrl: `https://pay.stripe.com/receipts/${spec.seq}`,
    amount: grandTotal,
    currency: "usd",
    status: refunded ? "refunded" : "completed",
    refundedAmount: refunded ? grandTotal : 0,
  };

  const order: Order = {
    id: orderId,
    orderNumber,
    createdAt: isoDaysAgo(spec.daysAgo),
    customer: spec.customer,
    status: "processing",
    paymentStatus: payment.status,
    payment,
    merchantOrders,
    refunds: [],
    returns: [],
    events: [],
    notes: [],
    actionLog: [],
    webhookEvents: [],
    subtotal,
    shippingTotal,
    taxTotal,
    grandTotal,
  };

  order.status = rollupOrderStatus(merchantOrders);

  // Returns / refunds for the relevant scenarios.
  if (spec.scenario === "return_in_progress" || spec.scenario === "refunded") {
    const m = merchantOrders[0];
    const firstItem = m.items[0];
    const ret: ReturnRequest = {
      id: `${orderId}-ret-1`,
      orderId,
      merchantOrderId: m.id,
      status: m.returnStatus ?? "requested",
      reason: "Not as expected",
      createdAt: isoDaysAgo(Math.max(0, spec.daysAgo - 6)),
      items: [
        {
          id: `${orderId}-reti-1`,
          orderItemId: firstItem.id,
          productTitle: firstItem.productTitle,
          quantity: 1,
          reason: "Not as expected",
        },
      ],
      returnShipment:
        m.returnStatus === "label_created" || spec.scenario === "refunded"
          ? {
              id: `${orderId}-rshp`,
              merchantOrderId: m.id,
              isReturn: true,
              easypostShipmentId: `shp_ret_${spec.seq}`,
              carrier: "USPS",
              service: "Ground Return",
              trackingCode: `1ZRET${spec.seq}`,
              trackingUrl: `https://track.easypost.com/1ZRET${spec.seq}`,
              labelUrl: `https://easypost-files.s3.amazonaws.com/labels/ret-${orderId}.pdf`,
              labelStatus: "purchased",
              status: spec.scenario === "refunded" ? "delivered" : "in_transit",
              shippingCost: 650,
              trackingEvents: [],
            }
          : undefined,
    };
    order.returns.push(ret);

    if (spec.scenario === "refunded") {
      const refund: Refund = {
        id: `${orderId}-rf-1`,
        orderId,
        merchantOrderId: m.id,
        stripeRefundId: `re_${spec.seq}`,
        type: "item",
        amount: firstItem.unitPrice,
        reason: "Return received and inspected",
        status: "succeeded",
        createdAt: isoDaysAgo(Math.max(0, spec.daysAgo - 2)),
      };
      ret.refundId = refund.id;
      order.refunds.push(refund);
      firstItem.returnedQuantity = 1;
    }
  }

  order.events = buildEvents(order, spec.daysAgo);
  order.webhookEvents = buildWebhookEvents(order, spec.daysAgo);
  return order;
}

const CUSTOMERS: Customer[] = [
  {
    name: "Maya Holloway",
    email: "maya.holloway@example.com",
    phone: "+1 512 555 0142",
    shippingAddress: {
      name: "Maya Holloway",
      line1: "1208 Oak Crest Ave",
      city: "Austin",
      state: "TX",
      zip: "78704",
      country: "US",
      phone: "+1 512 555 0142",
    },
  },
  {
    name: "Daniel Okafor",
    email: "daniel.okafor@example.com",
    shippingAddress: {
      name: "Daniel Okafor",
      line1: "55 Marlborough St",
      line2: "Apt 3",
      city: "Boston",
      state: "MA",
      zip: "02116",
      country: "US",
    },
  },
  {
    name: "Priya Raman",
    email: "priya.raman@example.com",
    shippingAddress: {
      name: "Priya Raman",
      line1: "742 Evergreen Terrace",
      city: "Portland",
      state: "OR",
      zip: "97214",
      country: "US",
    },
  },
  {
    name: "Liam Carter",
    email: "liam.carter@example.com",
    shippingAddress: {
      name: "Liam Carter",
      line1: "300 Lakeshore Dr",
      city: "Chicago",
      state: "IL",
      zip: "60601",
      country: "US",
    },
  },
];

const SEED_SPECS: SeedSpec[] = [
  {
    seq: 1000001,
    daysAgo: 1,
    customer: CUSTOMERS[0],
    scenario: "new_paid",
    merchants: [
      { vendorId: "ashwood-atelier", lines: [{ productId: "ashwood-001", quantity: 1 }] },
      { vendorId: "aurelith", lines: [{ productId: "aurelith-001", quantity: 1 }] },
    ],
  },
  {
    seq: 1000002,
    daysAgo: 2,
    customer: CUSTOMERS[1],
    scenario: "ready_for_fulfillment",
    merchants: [
      {
        vendorId: "ashwood-atelier",
        lines: [
          { productId: "ashwood-002", quantity: 2 },
          { productId: "ashwood-003", quantity: 1 },
        ],
      },
    ],
  },
  {
    seq: 1000003,
    daysAgo: 3,
    customer: CUSTOMERS[2],
    scenario: "writeback_failed",
    merchants: [
      { vendorId: "juniper-and-tide", lines: [{ productId: "ashwood-004", quantity: 1 }] },
    ],
  },
  {
    seq: 1000004,
    daysAgo: 3,
    customer: CUSTOMERS[3],
    scenario: "label_failed",
    merchants: [
      { vendorId: "velvet-fern", lines: [{ productId: "ashwood-005", quantity: 1 }] },
    ],
  },
  {
    seq: 1000005,
    daysAgo: 5,
    customer: CUSTOMERS[0],
    scenario: "in_transit",
    merchants: [
      { vendorId: "ashwood-atelier", lines: [{ productId: "ashwood-001", quantity: 1 }] },
      { vendorId: "parchment-provisions", lines: [{ productId: "ashwood-002", quantity: 1 }] },
    ],
  },
  {
    seq: 1000006,
    daysAgo: 6,
    customer: CUSTOMERS[1],
    scenario: "delivery_exception",
    merchants: [
      { vendorId: "embertrail", lines: [{ productId: "ashwood-003", quantity: 1 }] },
    ],
  },
  {
    seq: 1000007,
    daysAgo: 9,
    customer: CUSTOMERS[2],
    scenario: "delivered",
    merchants: [
      { vendorId: "loam-and-linen", lines: [{ productId: "ashwood-004", quantity: 2 }] },
    ],
  },
  {
    seq: 1000008,
    daysAgo: 12,
    customer: CUSTOMERS[3],
    scenario: "return_in_progress",
    merchants: [
      { vendorId: "moonstone-mercantile", lines: [{ productId: "ashwood-005", quantity: 1 }] },
    ],
  },
  {
    seq: 1000009,
    daysAgo: 20,
    customer: CUSTOMERS[0],
    scenario: "refunded",
    merchants: [
      { vendorId: "citrus-and-clay", lines: [{ productId: "ashwood-001", quantity: 1 }] },
    ],
  },
];

export function buildSeedOrders(): Order[] {
  return SEED_SPECS.map(buildOrder).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export const SEED_VERSION = 2;

// ---------------------------------------------------------------------------
// New-order creation (Phase 2): mock Stripe → parent Order → merchant split
// ---------------------------------------------------------------------------

export type MockCheckout = {
  customer: Customer;
  merchants: SeedMerchant[];
};

// A minimal mock of the Stripe webhook payload that drives order creation in
// the real system (payment_intent.succeeded / checkout.session.completed).
export type StripeCheckoutEvent = {
  id: string; // evt_… (used as the idempotency key)
  type: "payment_intent.succeeded";
  paymentIntentId: string; // pi_…
  amount: number; // cents
  createdAt: string; // ISO
  checkout: MockCheckout;
};

export function parseOrderSeq(orderNumber: string): number {
  const n = Number.parseInt(orderNumber.replace(/^AVNU-/, ""), 10);
  return Number.isFinite(n) ? n : ORDER_NUMBER_START - 1;
}

// Builds a freshly-paid parent order (payment captured, nothing fulfilled yet)
// from a mock checkout. Mirrors the real post-payment order-creation step.
export function buildNewPaidOrder(
  seq: number,
  checkout: MockCheckout,
  opts: { stripeEventId: string; paymentIntentId: string; createdAt?: string },
): Order {
  const orderNumber = formatOrderNumber(seq);
  const orderId = `ord-${seq}`;
  const transferGroup = `grp_${seq}`;
  const createdAt = opts.createdAt ?? new Date().toISOString();

  const merchantOrders = checkout.merchants.map((m, i) =>
    buildMerchantOrder(
      { id: orderId, orderNumber, transferGroup },
      m,
      i,
      "new_paid",
      0,
    ),
  );

  const subtotal = merchantOrders.reduce((s, m) => s + m.subtotal, 0);
  const shippingTotal = merchantOrders.reduce((s, m) => s + m.shippingTotal, 0);
  const taxTotal = merchantOrders.reduce((s, m) => s + m.taxTotal, 0);
  const grandTotal = subtotal + shippingTotal + taxTotal;

  const payment: Payment = {
    id: `${orderId}-pay`,
    orderId,
    stripePaymentIntentId: opts.paymentIntentId,
    stripeChargeId: `ch_${seq}`,
    stripeReceiptUrl: `https://pay.stripe.com/receipts/${seq}`,
    amount: grandTotal,
    currency: "usd",
    status: "completed",
    refundedAmount: 0,
  };

  const order: Order = {
    id: orderId,
    orderNumber,
    createdAt,
    customer: checkout.customer,
    status: "processing",
    paymentStatus: "completed",
    payment,
    merchantOrders,
    refunds: [],
    returns: [],
    events: [
      {
        id: `${orderId}-ev-1`,
        orderId,
        type: "payment.succeeded",
        message: `Payment captured · ${formatUsd(grandTotal)}`,
        actor: "system",
        createdAt,
        metadata: { paymentIntentId: opts.paymentIntentId },
      },
      {
        id: `${orderId}-ev-2`,
        orderId,
        type: "order.created",
        message: `Parent order ${orderNumber} created and split into ${merchantOrders.length} merchant order(s)`,
        actor: "system",
        createdAt,
      },
      ...merchantOrders.map((m, i) => ({
        id: `${orderId}-ev-mo-${i}`,
        orderId,
        merchantOrderId: m.id,
        type: "merchant_order.created",
        message: `${m.merchantOrderNumber} · ${m.vendorName} · queued for Shopify writeback`,
        actor: "system" as EventActor,
        createdAt,
      })),
    ],
    notes: [],
    actionLog: [],
    webhookEvents: [
      {
        id: `${orderId}-wh-1`,
        orderId,
        source: "stripe",
        eventType: "payment_intent.succeeded",
        idempotencyKey: opts.stripeEventId,
        status: "processed",
        receivedAt: createdAt,
        summary: `${formatUsd(grandTotal)} captured`,
      },
    ],
    subtotal,
    shippingTotal,
    taxTotal,
    grandTotal,
  };

  order.status = rollupOrderStatus(merchantOrders);
  return order;
}

// Picks a realistic random checkout from brands that actually have products.
export function generateRandomCheckout(): MockCheckout {
  const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  const eligibleBrands = mockBrands.filter(
    (b) => getProductsByBrandId(b.id).length > 0,
  );

  const merchantCount = Math.random() < 0.45 ? 2 : 1;
  const chosen: typeof eligibleBrands = [];
  while (chosen.length < merchantCount && eligibleBrands.length > 0) {
    const pick =
      eligibleBrands[Math.floor(Math.random() * eligibleBrands.length)];
    if (!chosen.includes(pick)) chosen.push(pick);
  }

  const merchants: SeedMerchant[] = chosen.map((brand) => {
    const products = getProductsByBrandId(brand.id);
    const lineCount = Math.min(products.length, Math.random() < 0.4 ? 2 : 1);
    const lines: SeedLine[] = [];
    const used = new Set<string>();
    while (lines.length < lineCount) {
      const p = products[Math.floor(Math.random() * products.length)];
      if (used.has(p.id)) continue;
      used.add(p.id);
      lines.push({ productId: p.id, quantity: Math.random() < 0.25 ? 2 : 1 });
    }
    return { vendorId: brand.id, lines };
  });

  return { customer, merchants };
}

const SUPPORT_EMAIL = "support@avnu.com";

// Builds the tags / note attributes / metafields avnu writes into the merchant
// Shopify order. Keys mirror the real avnu-marketplace writeback contract.
export function buildShopifyPayloadMeta(
  order: Order,
  m: MerchantOrder,
): ShopifyTagSet {
  const returnPolicyUrl = `https://avnu.com/returns/${m.vendorId}`;
  return {
    tags: ["avnu", "avnu-marketplace", "avnu-order"],
    noteAttributes: [
      { name: "avnu_order_number", value: order.orderNumber },
      { name: "avnu_merchant_order_number", value: m.merchantOrderNumber },
      { name: "avnu_support_email", value: SUPPORT_EMAIL },
    ],
    metafields: [
      { namespace: "avnu", key: "order_id", value: order.id },
      { namespace: "avnu", key: "order_number", value: order.orderNumber },
      { namespace: "avnu", key: "merchant_order_id", value: m.id },
      {
        namespace: "avnu",
        key: "merchant_order_number",
        value: m.merchantOrderNumber,
      },
      { namespace: "avnu", key: "support_email", value: SUPPORT_EMAIL },
      { namespace: "avnu", key: "return_policy_url", value: returnPolicyUrl },
    ],
  };
}

// Deterministic-but-unique mock Shopify identifiers for a merchant order.
export function makeShopifyOrderRef(
  orderNumber: string,
  index: number,
): { shopifyOrderId: string; shopifyOrderName: string } {
  const seq = parseOrderSeq(orderNumber);
  return {
    shopifyOrderId: `gid://shopify/Order/${seq * 10 + index}`,
    shopifyOrderName: `#${1000 + (seq - ORDER_NUMBER_START) * 4 + index}`,
  };
}

// Creates a freshly-purchased EasyPost label/shipment for a merchant order.
// labelStatus = purchased, shipmentStatus = ready_for_fulfillment (NOT shipped/
// fulfilled — that only advances via merchant fulfillment or carrier scans).
export function makeEasyPostShipment(merchantOrderId: string): Shipment {
  const unique = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  const trackingCode = `1Z${`${merchantOrderId}${unique}`.slice(-10).toUpperCase()}`;
  const eta = new Date();
  eta.setDate(eta.getDate() + 4);
  return {
    id: `${merchantOrderId}-shp`,
    merchantOrderId,
    isReturn: false,
    easypostShipmentId: `shp_${unique}`,
    easypostTrackerId: `trk_${unique}`,
    carrier: "USPS",
    service: "Priority",
    trackingCode,
    trackingUrl: `https://track.easypost.com/${trackingCode}`,
    labelUrl: `https://easypost-files.s3.amazonaws.com/labels/${merchantOrderId}.pdf`,
    labelStatus: "purchased",
    status: "ready_for_fulfillment",
    shippingCost: 795,
    estimatedDeliveryDate: eta.toISOString(),
    trackingEvents: [],
  };
}

// Creates a purchased EasyPost return label/shipment for a return request.
export function makeReturnLabelShipment(merchantOrderId: string): Shipment {
  const unique = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  const trackingCode = `1ZRET${`${merchantOrderId}${unique}`.slice(-8).toUpperCase()}`;
  return {
    id: `${merchantOrderId}-rshp`,
    merchantOrderId,
    isReturn: true,
    easypostShipmentId: `shp_ret_${unique}`,
    easypostTrackerId: `trk_ret_${unique}`,
    carrier: "USPS",
    service: "Ground Return",
    trackingCode,
    trackingUrl: `https://track.easypost.com/${trackingCode}`,
    labelUrl: `https://easypost-files.s3.amazonaws.com/labels/ret-${merchantOrderId}.pdf`,
    labelStatus: "purchased",
    status: "pre_transit",
    shippingCost: 650,
    trackingEvents: [],
  };
}

// Computes the refund owed for the items in a return request (item value + 8%
// tax), looking the unit prices up on the parent order's merchant order.
export function returnRefundAmount(order: Order, ret: ReturnRequest): number {
  const m = order.merchantOrders.find((x) => x.id === ret.merchantOrderId);
  if (!m) return 0;
  let subtotal = 0;
  for (const ri of ret.items) {
    const item = m.items.find((it) => it.id === ri.orderItemId);
    if (item) subtotal += item.unitPrice * ri.quantity;
  }
  return subtotal + Math.round(subtotal * 0.08);
}

let mockEventCounter = 0;

// Constructs a mock Stripe event for a checkout. The amount mirrors what the
// resulting order total will be (subtotal + flat shipping + 8% tax per merchant).
export function makeStripeCheckoutEvent(
  checkout: MockCheckout,
): StripeCheckoutEvent {
  mockEventCounter += 1;
  const unique = `${Date.now().toString(36)}${mockEventCounter}`;
  let amount = 0;
  for (const m of checkout.merchants) {
    let subtotal = 0;
    for (const line of m.lines) {
      const product = getProductById(line.productId);
      subtotal += Math.round((product?.price ?? 48) * 100) * line.quantity;
    }
    amount += subtotal + 795 + Math.round(subtotal * 0.08);
  }
  return {
    id: `evt_${unique}`,
    type: "payment_intent.succeeded",
    paymentIntentId: `pi_${unique}`,
    amount,
    createdAt: new Date().toISOString(),
    checkout,
  };
}
