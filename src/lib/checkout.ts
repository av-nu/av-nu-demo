import { CURRENT_SHOPPER_EMAIL, type Customer, type MockCheckout } from "@/data/oms";
import type { CartItem } from "@/hooks/useCart";

const DEFAULT_SHOPPER_NAME = "Maya Holloway";

// Turns the current cart into the MockCheckout shape the OMS expects: cart
// items are grouped by brand into one "merchant" each, with line items
// mirroring product id + quantity. The customer is always tied to the demo
// shopper email so the resulting order surfaces on the customer "Your orders"
// page, while the display name reflects the signed-in shopper when available.
export function buildCheckoutFromCart(
  items: CartItem[],
  account?: { name?: string; email?: string } | null,
): MockCheckout {
  const byBrand = new Map<string, { productId: string; quantity: number }[]>();

  for (const item of items) {
    const lines = byBrand.get(item.brandId) ?? [];
    lines.push({ productId: item.productId, quantity: item.quantity });
    byBrand.set(item.brandId, lines);
  }

  const merchants = Array.from(byBrand.entries()).map(([vendorId, lines]) => ({
    vendorId,
    lines,
  }));

  const name = account?.name?.trim() || DEFAULT_SHOPPER_NAME;
  const customer: Customer = {
    name,
    email: CURRENT_SHOPPER_EMAIL,
    phone: "+1 512 555 0142",
    shippingAddress: {
      name,
      line1: "1208 Oak Crest Ave",
      city: "Austin",
      state: "TX",
      zip: "78704",
      country: "US",
      phone: "+1 512 555 0142",
    },
  };

  return { customer, merchants };
}
