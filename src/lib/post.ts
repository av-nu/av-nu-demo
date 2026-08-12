// The unified Post model.
//
// One shape replaces the three that previously fed the feed (video reviews,
// spotlight rows, and community lists). A post is an ordered list of pages,
// each page being a canvas document plus its product pins.
//
// A "media post" is not a separate kind: it is a page whose base layer is a
// locked, full-bleed image or video element. That is what lets text, stickers,
// drawing, and pins work identically for collages and uploaded media.

import type { FaveVisibility, ListComment } from "@/data/faves";
import {
  EDITORIAL_FORMATS,
  applyEditorialTemplate,
  createImageElement,
  createVideoElement,
  editorialProductIds,
  normalizeEditorialPage,
  type EditorialElement,
  type EditorialFormat,
  type EditorialPageDesign,
  type EditorialTemplateId,
} from "@/lib/editorial";

/** A tappable shopping pin, positioned as a percentage of the page. */
export type PostProductPin = {
  id: string;
  productId: string;
  /** 0–100, percentage of page width. */
  x: number;
  /** 0–100, percentage of page height. */
  y: number;
};

export type PostPage = {
  id: string;
  design: EditorialPageDesign;
  pins: PostProductPin[];
};

export type Post = {
  id: string;
  authorId: string;
  /** Ordered pages, always at least one. Every page shares `format`. */
  pages: PostPage[];
  /**
   * Shared aspect ratio for every page. Pages cannot differ, otherwise the feed
   * carousel visibly jumps between slides.
   */
  format: EditorialFormat;
  /** Index of the page used as the feed cover. */
  coverPageIndex: number;
  /** Derived union of pinned and placed product ids across all pages. */
  productIds: string[];
  /**
   * Products attached to the post without a position on the artwork. Pins need
   * coordinates someone actually chose; inventing them scatters labels over
   * footage they do not describe.
   */
  linkedProductIds?: string[];
  caption: string;
  visibility: FaveVisibility;
  likes: number;
  comments: ListComment[];
  createdAt: number;
  /**
   * Reserved for the deferred motion work. Kept on the model so adding
   * animation later needs no migration.
   */
  motion?: unknown;
};

export type NewPost = {
  pages: PostPage[];
  format: EditorialFormat;
  caption: string;
  visibility: FaveVisibility;
  coverPageIndex?: number;
};

let pageSequence = 0;

export function makePostPageId() {
  pageSequence += 1;
  return `page-${Date.now()}-${pageSequence}`;
}

export function makePostPinId() {
  pageSequence += 1;
  return `pin-${Date.now()}-${pageSequence}`;
}

// --- page construction -------------------------------------------------------

export function createPostPage(design: EditorialPageDesign, pins: PostProductPin[] = []): PostPage {
  return { id: makePostPageId(), design, pins };
}

/** A blank collage page. */
export function createBlankPage(format: EditorialFormat = "portrait"): PostPage {
  return createPostPage({
    version: 1,
    format,
    backgroundColor: "#fffdf9",
    backgroundOpacity: 1,
    showGuides: true,
    elements: [],
  });
}

export function createTemplatePage(productIds: string[], title: string, templateId: EditorialTemplateId): PostPage {
  return createPostPage(applyEditorialTemplate(productIds, title, templateId));
}

/**
 * A media page: the upload becomes a locked, full-bleed base layer so overlays
 * behave exactly as they do on a collage.
 */
export function createMediaPage(ref: string, kind: "image" | "video", format: EditorialFormat = "portrait"): PostPage {
  const { width, height } = EDITORIAL_FORMATS[format];
  const base = kind === "video" ? createVideoElement(ref) : createImageElement(ref);
  return createPostPage({
    version: 1,
    format,
    backgroundColor: "#000000",
    backgroundOpacity: 1,
    showGuides: true,
    elements: [{
      ...base,
      name: kind === "video" ? "Video" : "Photo",
      x: 0,
      y: 0,
      width,
      height,
      zIndex: 0,
      locked: true,
      fit: "cover",
      borderRadius: 0,
      shadow: "none",
    }],
  });
}

// --- derived data ------------------------------------------------------------

/** Product ids placed on the canvas plus those pinned, in page order. */
export function postProductIds(pages: PostPage[], linked: string[] = []): string[] {
  const ids: string[] = [...new Set(linked)];
  for (const page of pages) {
    for (const id of editorialProductIds(page.design)) {
      if (!ids.includes(id)) ids.push(id);
    }
    for (const pin of page.pins) {
      if (!ids.includes(pin.productId)) ids.push(pin.productId);
    }
  }
  return ids;
}

/**
 * Rescales a design's geometry into a different canvas size.
 *
 * Coercing the format without this reinterprets coordinates in a canvas of a
 * different size, pushing elements off the edge — a landscape layout dropped
 * into a portrait post loses everything past its right-hand side.
 */
export function scaleDesignToFormat(design: EditorialPageDesign, format: EditorialFormat): EditorialPageDesign {
  if (design.format === format) return design;
  const from = EDITORIAL_FORMATS[design.format];
  const to = EDITORIAL_FORMATS[format];
  const scaleX = to.width / from.width;
  const scaleY = to.height / from.height;
  return {
    ...design,
    format,
    elements: design.elements.map((element) => {
      const scaled = {
        ...element,
        x: element.x * scaleX,
        y: element.y * scaleY,
        width: element.width * scaleX,
        height: element.height * scaleY,
      };
      // Drawings carry their own coordinate space, which must follow the canvas.
      if (scaled.type === "drawing") {
        return { ...scaled, viewBoxWidth: to.width, viewBoxHeight: to.height };
      }
      return scaled;
    }),
  };
}

/**
 * True when a page is an uploaded photo or video rather than a collage: a single
 * locked, full-bleed media element. Such pages tag products as pins.
 */
export function isMediaPage(page: PostPage): boolean {
  const [first, ...rest] = page.design.elements;
  return rest.length === 0 && Boolean(first) && first.locked && (first.type === "image" || first.type === "video");
}

/**
 * True when a media element already fills the page. Dragging such an element is
 * pointless — there is nowhere for the box to go — so it reframes instead.
 */
export function isFullBleedMedia(element: EditorialElement, format: EditorialFormat): boolean {
  if (element.type !== "image" && element.type !== "video") return false;
  const { width, height } = EDITORIAL_FORMATS[format];
  return element.x <= 1 && element.y <= 1 && element.width >= width - 1 && element.height >= height - 1;
}

export function postCoverPage(post: Post): PostPage {
  return post.pages[post.coverPageIndex] ?? post.pages[0];
}

export function isMultiPagePost(post: Post): boolean {
  return post.pages.length > 1;
}

// --- invariants --------------------------------------------------------------

/**
 * Enforces the model's invariants and keeps derived data honest:
 *  - at least one page
 *  - every page's design normalized and forced to the post format
 *  - pins clamped to the page and de-duplicated per page
 *  - `coverPageIndex` within bounds
 *  - `productIds` recomputed from the pages
 */
export function normalizePost(post: Post): Post {
  const format = EDITORIAL_FORMATS[post.format] ? post.format : "portrait";
  const sourcePages = post.pages?.length ? post.pages : [createBlankPage(format)];

  const pages = sourcePages.map((page) => {
    const normalizedDesign = normalizeEditorialPage(page.design, [], "");
    // Every page must share the post format, or the carousel jumps — and the
    // geometry has to be rescaled with it, not just relabelled.
    const design = scaleDesignToFormat(normalizedDesign, format);
    const seen = new Set<string>();
    const pins: PostProductPin[] = [];
    for (const pin of page.pins ?? []) {
      if (!pin || typeof pin.productId !== "string" || seen.has(pin.productId)) continue;
      seen.add(pin.productId);
      pins.push({
        id: pin.id || makePostPinId(),
        productId: pin.productId,
        x: clampPercent(pin.x),
        y: clampPercent(pin.y),
      });
    }
    const pinsUnchanged = pins.length === (page.pins?.length ?? 0) && pins.every((pin, index) => {
      const original = page.pins?.[index];
      return original && original.id === pin.id && original.x === pin.x && original.y === pin.y;
    });
    if (design === page.design && pinsUnchanged) return page;
    return { ...page, design, pins };
  });

  const coverPageIndex = Number.isInteger(post.coverPageIndex) && post.coverPageIndex >= 0 && post.coverPageIndex < pages.length
    ? post.coverPageIndex
    : 0;
  const productIds = postProductIds(pages, post.linkedProductIds ?? []);

  const pagesUnchanged = pages.length === post.pages?.length && pages.every((page, index) => page === post.pages[index]);
  const productIdsUnchanged = productIds.length === post.productIds?.length && productIds.every((id, index) => id === post.productIds[index]);
  if (pagesUnchanged && productIdsUnchanged && coverPageIndex === post.coverPageIndex && format === post.format) return post;

  return { ...post, format, pages, coverPageIndex, productIds };
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, value));
}

// --- page operations ---------------------------------------------------------

export function addPostPage(post: Post, page?: PostPage): Post {
  const next = page ?? createBlankPage(post.format);
  return normalizePost({ ...post, pages: [...post.pages, next] });
}

export function duplicatePostPage(post: Post, pageId: string): Post {
  const index = post.pages.findIndex((page) => page.id === pageId);
  if (index < 0) return post;
  const source = post.pages[index];
  const copy: PostPage = {
    id: makePostPageId(),
    design: { ...source.design, elements: source.design.elements.map((element) => ({ ...element })) },
    pins: source.pins.map((pin) => ({ ...pin, id: makePostPinId() })),
  };
  const pages = [...post.pages];
  pages.splice(index + 1, 0, copy);
  return normalizePost({ ...post, pages });
}

export function removePostPage(post: Post, pageId: string): Post {
  if (post.pages.length <= 1) return post;
  const index = post.pages.findIndex((page) => page.id === pageId);
  if (index < 0) return post;
  const pages = post.pages.filter((page) => page.id !== pageId);
  const coverPageIndex = post.coverPageIndex >= pages.length
    ? pages.length - 1
    : post.coverPageIndex > index
      ? post.coverPageIndex - 1
      : post.coverPageIndex;
  return normalizePost({ ...post, pages, coverPageIndex });
}

export function reorderPostPage(post: Post, pageId: string, toIndex: number): Post {
  const from = post.pages.findIndex((page) => page.id === pageId);
  if (from < 0) return post;
  const target = Math.max(0, Math.min(post.pages.length - 1, toIndex));
  if (target === from) return post;
  const pages = [...post.pages];
  const [page] = pages.splice(from, 1);
  pages.splice(target, 0, page);
  const cover = post.pages[post.coverPageIndex];
  const coverPageIndex = Math.max(0, pages.findIndex((item) => item.id === cover?.id));
  return normalizePost({ ...post, pages, coverPageIndex });
}

export function updatePostPageDesign(post: Post, pageId: string, design: EditorialPageDesign): Post {
  const pages = post.pages.map((page) => (page.id === pageId ? { ...page, design } : page));
  return normalizePost({ ...post, pages });
}

// --- pin operations ----------------------------------------------------------

export function addPostPin(post: Post, pageId: string, productId: string, x = 50, y = 50): Post {
  const pages = post.pages.map((page) => {
    if (page.id !== pageId) return page;
    if (page.pins.some((pin) => pin.productId === productId)) return page;
    return { ...page, pins: [...page.pins, { id: makePostPinId(), productId, x, y }] };
  });
  return normalizePost({ ...post, pages });
}

export function movePostPin(post: Post, pageId: string, pinId: string, x: number, y: number): Post {
  const pages = post.pages.map((page) => (
    page.id === pageId
      ? { ...page, pins: page.pins.map((pin) => (pin.id === pinId ? { ...pin, x, y } : pin)) }
      : page
  ));
  return normalizePost({ ...post, pages });
}

export function removePostPin(post: Post, pageId: string, pinId: string): Post {
  const pages = post.pages.map((page) => (
    page.id === pageId ? { ...page, pins: page.pins.filter((pin) => pin.id !== pinId) } : page
  ));
  return normalizePost({ ...post, pages });
}
