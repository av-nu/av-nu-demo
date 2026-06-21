import { mockProducts } from "@/data/mockProducts";
import type { TemplateId } from "@/data/listTemplates";

export type FaveVisibility = "private" | "inner-circle" | "public";

/** A single page of a public carousel post. */
export type ListPage = {
  id: string;
  template: TemplateId;
  productIds: string[];
};

export type FaveList = {
  id: string;
  name: string;
  /** The full collection (used for private / inner-circle, unlimited). */
  productIds: string[];
  createdAt: number;
  visibility: FaveVisibility;
  /** Inner-circle contact ids this list is shared with. Empty = all inner circle. */
  sharedWith: string[];
  /** Default template used when adding a new public page. */
  template: TemplateId;
  /** Author caption shown on the public post. */
  caption?: string;
  /** Public carousel pages. Empty for private / inner-circle lists. */
  pages?: ListPage[];
};

export type ListComment = {
  id: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  text: string;
  createdAt: number;
};

/** Unique product ids across all pages of a list. */
export function flattenPages(pages: ListPage[] = []): string[] {
  const ids: string[] = [];
  for (const page of pages) {
    for (const id of page.productIds) {
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

// --- Seeded "community" lists from other (mock) users -----------------------
// Public carousel posts authored by people in the social graph, surfaced on the
// home feed with seeded engagement.

export type CommunityList = {
  id: string;
  authorId: string;
  name: string;
  caption: string;
  pages: ListPage[];
  likes: number;
  comments: ListComment[];
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
    caption: "Everything I reach for on a slow morning ☕️ Swipe for the full ritual.",
    pages: [
      { id: "comm-1-p1", template: 4, productIds: pickProductIds(3, 4) },
      { id: "comm-1-p2", template: 2, productIds: pickProductIds(31, 2) },
    ],
    likes: 248,
    comments: [
      { id: "cmt-1", authorName: "Jonah Reed", authorInitials: "JR", authorColor: "bg-accent", text: "Saving this whole list!", createdAt: Date.now() - 1000 * 60 * 60 * 5 },
      { id: "cmt-2", authorName: "Priya Nair", authorInitials: "PN", authorColor: "bg-burgundy", text: "That throw is gorgeous 😍", createdAt: Date.now() - 1000 * 60 * 60 * 2 },
    ],
  },
  {
    id: "comm-2",
    authorId: "f-aria",
    name: "Cozy Layers",
    caption: "Layering staples for the in-between weather. Tap to shop each piece.",
    pages: [{ id: "comm-2-p1", template: 3, productIds: pickProductIds(11, 3) }],
    likes: 132,
    comments: [
      { id: "cmt-3", authorName: "Theo Park", authorInitials: "TP", authorColor: "bg-pink", text: "Need that jacket immediately", createdAt: Date.now() - 1000 * 60 * 90 },
    ],
  },
  {
    id: "comm-3",
    authorId: "c-priya",
    name: "Housewarming Picks",
    caption: "My go-to gifts for new homes — always a hit.",
    pages: [
      { id: "comm-3-p1", template: 6, productIds: pickProductIds(23, 6) },
      { id: "comm-3-p2", template: 4, productIds: pickProductIds(40, 4) },
    ],
    likes: 87,
    comments: [],
  },
];

export function getCommunityList(id: string): CommunityList | undefined {
  return communityLists.find((c) => c.id === id);
}

// --- Seeded "shared with you" lists (inner-circle shares received) ----------
// Inner-circle shares land directly in the recipient's My Faves. Since the demo
// is single-user, these simulate lists shared *to* the current user.

export type SharedList = {
  id: string;
  authorId: string;
  name: string;
  productIds: string[];
  sharedAt: number;
};

export const sharedWithMe: SharedList[] = [
  {
    id: "shared-1",
    authorId: "c-jonah",
    name: "Birthday ideas for you 🎁",
    productIds: pickProductIds(5, 5),
    sharedAt: Date.now() - 1000 * 60 * 60 * 26,
  },
  {
    id: "shared-2",
    authorId: "c-sof",
    name: "Our trip packing list",
    productIds: pickProductIds(17, 7),
    sharedAt: Date.now() - 1000 * 60 * 60 * 50,
  },
];
