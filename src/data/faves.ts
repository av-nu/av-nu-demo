import { mockProducts } from "@/data/mockProducts";

export type FaveListType = "Looks" | "Gift List" | "Sets";

export type FaveVisibility = "private" | "inner-circle" | "public";

export type FaveList = {
  id: string;
  name: string;
  type: FaveListType;
  productIds: string[];
  createdAt: number;
  visibility: FaveVisibility;
  /** Inner-circle contact ids this list is shared with. Empty = all inner circle. */
  sharedWith: string[];
};

export const LIST_TYPES: FaveListType[] = ["Looks", "Gift List", "Sets"];

export const LIST_TYPE_META: Record<
  FaveListType,
  { label: string; description: string; accent: string }
> = {
  Looks: {
    label: "Looks",
    description: "Outfits & styled combinations",
    accent: "text-pink",
  },
  "Gift List": {
    label: "Gift List",
    description: "Ideas for someone special",
    accent: "text-accent",
  },
  Sets: {
    label: "Sets",
    description: "Bundles that go together",
    accent: "text-burgundy",
  },
};

// --- Seeded "community" lists from other (mock) users -----------------------
// These are public lists authored by people in the social graph. They surface
// on the home feed as shoppable posts. Product ids are taken from the live
// catalog so they always resolve.

export type CommunityList = {
  id: string;
  authorId: string;
  name: string;
  type: FaveListType;
  productIds: string[];
};

function pickProductIds(start: number, count: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const product = mockProducts[(start + i * 7) % mockProducts.length];
    if (product && !ids.includes(product.id)) ids.push(product.id);
  }
  return ids;
}

export const communityLists: CommunityList[] = [
  {
    id: "comm-1",
    authorId: "c-mara",
    name: "Slow Sunday Reset",
    type: "Sets",
    productIds: pickProductIds(3, 4),
  },
  {
    id: "comm-2",
    authorId: "f-aria",
    name: "Cozy Layers",
    type: "Looks",
    productIds: pickProductIds(11, 4),
  },
  {
    id: "comm-3",
    authorId: "c-priya",
    name: "Housewarming Picks",
    type: "Gift List",
    productIds: pickProductIds(23, 4),
  },
];
