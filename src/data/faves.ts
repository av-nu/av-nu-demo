import { mockProducts } from "@/data/mockProducts";
import type { TemplateId } from "@/data/listTemplates";
import type { EditorialPageDesign } from "@/lib/editorial";

export type FaveVisibility = "private" | "inner-circle" | "public";

/** A single page of a public carousel post. */
export type ListPage = {
  id: string;
  template: TemplateId;
  productIds: string[];
  editorial?: EditorialPageDesign;
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
  lookbookId?: string;
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
  format?: "standard" | "featured";
  pages: ListPage[];
  likes: number;
  comments: ListComment[];
};

function pickProductIdsFrom(source: typeof mockProducts, start: number, count: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const product = source[(start + i * 3) % source.length];
    if (product && !ids.includes(product.id)) ids.push(product.id);
  }
  return ids;
}

const outfitProducts = mockProducts.filter((product) => product.category === "Apparel");
const beautyProducts = mockProducts.filter((product) => product.category === "Beauty");

const pickOutfits = (start: number, count: number) => pickProductIdsFrom(outfitProducts, start, count);
const pickBeauty = (start: number, count: number) => pickProductIdsFrom(beautyProducts, start, count);

export const communityLists: CommunityList[] = [
  {
    id: "comm-1",
    authorId: "c-mara",
    name: "Slow Sunday Layers",
    caption: "Soft layers, an easy dress, and the pieces that make a slow morning feel pulled together.",
    format: "featured",
    pages: [
      { id: "comm-1-p1", template: 4, productIds: pickOutfits(0, 4) },
      { id: "comm-1-p2", template: 4, productIds: pickOutfits(12, 4) },
    ],
    likes: 248,
    comments: [
      { id: "cmt-1", authorName: "Jonah Reed", authorInitials: "JR", authorColor: "bg-accent", text: "Saving this whole look!", createdAt: Date.now() - 1000 * 60 * 60 * 5 },
      { id: "cmt-2", authorName: "Priya Nair", authorInitials: "PN", authorColor: "bg-burgundy", text: "The texture mix is perfect 😍", createdAt: Date.now() - 1000 * 60 * 60 * 2 },
    ],
  },
  {
    id: "comm-2",
    authorId: "f-aria",
    name: "Cozy Layers",
    caption: "Four easy pieces for the in-between weather — the full outfit, not just the hero piece.",
    pages: [{ id: "comm-2-p1", template: 4, productIds: pickOutfits(24, 4) }],
    likes: 132,
    comments: [
      { id: "cmt-3", authorName: "Theo Park", authorInitials: "TP", authorColor: "bg-pink", text: "Need that jacket immediately", createdAt: Date.now() - 1000 * 60 * 90 },
    ],
  },
  {
    id: "comm-3",
    authorId: "c-priya",
    name: "Dinner After Dark",
    caption: "A polished black-and-white edit for dinner plans that start casual and end somewhere special.",
    pages: [
      { id: "comm-3-p1", template: 6, productIds: pickOutfits(36, 6) },
      { id: "comm-3-p2", template: 4, productIds: pickOutfits(54, 4) },
    ],
    likes: 187,
    comments: [],
  },
  {
    id: "comm-4",
    authorId: "c-sof",
    name: "Wedding Guest Edit",
    caption: "Romantic silhouettes and statement color, edited down to the pieces worth trying first.",
    format: "featured",
    pages: [{ id: "comm-4-p1", template: 6, productIds: pickOutfits(66, 6) }],
    likes: 214,
    comments: [
      { id: "cmt-4", authorName: "Aria Blume", authorInitials: "AB", authorColor: "bg-accent", text: "The blue dress is everything.", createdAt: Date.now() - 1000 * 60 * 60 * 8 },
    ],
  },
  {
    id: "comm-5",
    authorId: "c-leo",
    name: "The Weekend Uniform",
    caption: "A few considered pieces that make packing light feel much easier.",
    pages: [{ id: "comm-5-p1", template: 4, productIds: pickOutfits(78, 4) }],
    likes: 156,
    comments: [],
  },
  {
    id: "comm-6",
    authorId: "f-noor",
    name: "Five-Minute Face",
    caption: "A small beauty edit to finish the look — makeup as the last layer, not the whole story.",
    format: "featured",
    pages: [{ id: "comm-6-p1", template: 4, productIds: pickBeauty(0, 4) }],
    likes: 96,
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
    productIds: pickOutfits(5, 5),
    sharedAt: Date.now() - 1000 * 60 * 60 * 26,
  },
  {
    id: "shared-2",
    authorId: "c-sof",
    name: "Our trip packing list",
    productIds: pickOutfits(17, 7),
    sharedAt: Date.now() - 1000 * 60 * 60 * 50,
  },
];
