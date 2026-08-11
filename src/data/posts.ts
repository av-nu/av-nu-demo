// Demo posts authored in the unified format.
//
// These exist so the feed shows what the composer can actually do — collage,
// typography, stickers, drawing, multiple pages, and tagged photos — rather than
// only converted legacy content. Deterministic: fixed ids, products taken by
// position from the catalog, and offset timestamps rather than random ones.

import { contacts } from "@/data/social";
import { mockProducts } from "@/data/mockProducts";
import { pointsToPath } from "@/lib/drawing";
import {
  appendDrawingPath,
  applyEditorialTemplate,
  createDrawingElement,
  createStickerElement,
  createTextElement,
  makeEditorialDrawingPath,
  type EditorialPageDesign,
} from "@/lib/editorial";
import { createPostPage, normalizePost, type Post, type PostPage } from "@/lib/post";

const HOUR = 3_600_000;
const SEED_EPOCH = 1_735_689_600_000; // 2025-01-01, so ordering is stable.

function productIds(start: number, count: number): string[] {
  return Array.from({ length: count }, (_, index) => mockProducts[(start + index) % mockProducts.length]?.id).filter(Boolean) as string[];
}

function authorId(index: number): string {
  return contacts[index % contacts.length]?.id ?? "c-mara";
}

/** Adds elements on top of a template without disturbing its slots. */
function layer(design: EditorialPageDesign, extras: EditorialPageDesign["elements"]): EditorialPageDesign {
  const baseZ = design.elements.length;
  return { ...design, elements: [...design.elements, ...extras.map((element, index) => ({ ...element, zIndex: baseZ + index }))] };
}

function buildPost(
  id: string,
  author: string,
  pages: PostPage[],
  caption: string,
  hoursAgo: number,
  likes: number,
): Post {
  return normalizePost({
    id,
    authorId: author,
    pages,
    format: pages[0]?.design.format ?? "portrait",
    coverPageIndex: 0,
    productIds: [],
    caption,
    visibility: "public",
    likes,
    comments: [],
    createdAt: SEED_EPOCH - hoursAgo * HOUR,
  });
}

/** A hand-annotated collage: scattered snapshots, a sticker, and a drawn mark. */
function annotatedCollage(): PostPage {
  const design = applyEditorialTemplate(productIds(0, 4), "Weekend, slowly", "polaroid-scatter");
  const underline = makeEditorialDrawingPath(
    pointsToPath(Array.from({ length: 24 }, (_, i) => ({ x: 90 + i * 34, y: 168 + Math.sin(i / 3) * 10 }))),
    { tool: "marker", color: "#FF6361", width: 12 },
  );
  return createPostPage(layer(design, [
    { ...createStickerElement("✨"), x: 700, y: 90, width: 150, height: 150 },
    { ...createStickerElement("🌿"), x: 120, y: 1050, width: 130, height: 130 },
    appendDrawingPath(createDrawingElement("portrait"), underline),
  ]));
}

/** A featured edit, the composition the old Guide format used. */
function featuredEdit(): PostPage {
  return createPostPage(applyEditorialTemplate(productIds(6, 4), "The quiet edit", "featured"));
}

/** Two pages that read as a set, demonstrating the carousel. */
function twoPageStory(): PostPage[] {
  const first = applyEditorialTemplate(productIds(12, 3), "Layers for spring", "hero-stack");
  const second = applyEditorialTemplate(productIds(15, 6), "Everything in it", "catalog");
  return [
    createPostPage(layer(first, [{ ...createStickerElement("💛"), x: 780, y: 120, width: 120, height: 120 }])),
    createPostPage(second),
  ];
}

/** A photo with products tagged onto it, rather than placed on a canvas. */
function taggedPhoto(): PostPage {
  const hero = mockProducts[22] ?? mockProducts[0];
  const design = applyEditorialTemplate([hero.id], "", "fashion-cover");
  // Strip the template's headline: this reads as a photo, not a cover.
  const withoutText = { ...design, elements: design.elements.filter((element) => element.type !== "text") };
  const page = createPostPage(withoutText);
  return {
    ...page,
    pins: productIds(23, 2).map((productId, index) => ({
      id: `${page.id}-pin-${index}`,
      productId,
      x: index === 0 ? 34 : 62,
      y: index === 0 ? 46 : 72,
    })),
  };
}

/** A typographic cover, showing the font catalog at work. */
function typographicCover(): PostPage {
  const design = applyEditorialTemplate(productIds(28, 3), "", "triptych");
  return createPostPage(layer(design, [
    { ...createTextElement("SLOW", "title"), x: 60, y: 90, width: 900, height: 200, fontId: "bebas", fontSize: 150, color: "#FFFDF9", letterSpacing: 6 },
    { ...createTextElement("mornings", "title"), x: 60, y: 250, width: 900, height: 170, fontId: "caveat", fontSize: 120, color: "#FFD380" },
  ]));
}

export const seedPosts: Post[] = [
  buildPost("seed-post-collage", authorId(0), [annotatedCollage()], "Weekend pieces, arranged badly on purpose.", 3, 214),
  buildPost("seed-post-featured", authorId(2), [featuredEdit()], "Four things I keep reaching for.", 9, 486),
  buildPost("seed-post-story", authorId(4), twoPageStory(), "Layering for the in-between weeks. Swipe for the full list.", 18, 132),
  buildPost("seed-post-tagged", authorId(6), [taggedPhoto()], "Tagged everything in this one.", 27, 358),
  buildPost("seed-post-type", authorId(1), [typographicCover()], "Made this at 6am, which explains the title.", 40, 97),
];

export function getSeedPost(id: string): Post | undefined {
  return seedPosts.find((post) => post.id === id);
}
