// Converters from the legacy content shapes onto the unified Post model.
//
// These are pure so they can be unit-tested without a browser, and are used for
// two things: converting the seeded demo content, and migrating anything a user
// already created before the redesign.

import { flattenPages, type CommunityList, type FaveVisibility, type ListPage } from "@/data/faves";
import { TEMPLATE_LAYOUT, type TemplateId } from "@/data/listTemplates";
import type { SpotlightRow } from "@/data/spotlight";
import type { SavedLook } from "@/lib/lookEngine";
import type { VideoReview } from "@/lib/social/types";
import {
  applyEditorialTemplate,
  createImageElement,
  createVideoElement,
  type EditorialFormat,
  type EditorialPageDesign,
  type EditorialTemplateId,
} from "@/lib/editorial";
import {
  createMediaPage,
  createPostPage,
  normalizePost,
  postProductIds,
  type Post,
  type PostPage,
} from "@/lib/post";
import { MISSING_MEDIA_REF, isExpiredMediaRef, isMissingMediaRef } from "@/lib/media/MediaStore";

/**
 * `blob:` URLs from the old uploader are unrecoverable after a reload — the
 * bytes are gone. We keep the post and flag the media so the UI can show an
 * honest placeholder instead of a broken image.
 */
function mediaRefFor(url: string | undefined): string {
  if (!url) return MISSING_MEDIA_REF;
  return isExpiredMediaRef(url) ? MISSING_MEDIA_REF : url;
}

export { MISSING_MEDIA_REF, isMissingMediaRef };

// --- video reviews (moments) --------------------------------------------------

export function videoReviewToPost(review: VideoReview): Post {
  const url = review.mediaUrl ?? review.videoUrl;
  const kind: "image" | "video" = review.mediaType === "image" ? "image" : "video";
  const page = createMediaPage(mediaRefFor(url), kind, "portrait");
  return normalizePost({
    id: review.id,
    authorId: review.authorId,
    pages: [page],
    format: "portrait",
    coverPageIndex: 0,
    productIds: [],
    linkedProductIds: review.productId ? [review.productId] : [],
    caption: review.caption,
    visibility: review.visibility,
    likes: review.likes,
    comments: review.comments,
    createdAt: review.createdAt,
  });
}

// --- spotlight rows (seeded videos) ------------------------------------------

export function spotlightRowToPost(row: SpotlightRow, authorId: string, createdAt = Date.now()): Post {
  const page = createMediaPage(mediaRefFor(row.videoUrl), "video", "portrait");
  // Linked, not pinned. Seeded footage carries no record of where each product
  // appears, and scattering labels at invented coordinates covers the video with
  // tags that describe nothing.
  const tagged = [row.featured, ...row.products].slice(0, 5);

  return normalizePost({
    id: row.id,
    authorId,
    pages: [page],
    format: "portrait",
    coverPageIndex: 0,
    productIds: [],
    linkedProductIds: tagged.map((product) => product.id),
    caption: row.title,
    visibility: "public",
    likes: 0,
    comments: [],
    createdAt,
  });
}

// --- community lists (guides / lists) ----------------------------------------

/** Deterministic pick, so conversion is stable between renders and reloads. */
function stableIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % length;
}

/** Maps a list tile template onto the closest canvas template. */
function templateForListPage(page: ListPage, format: "standard" | "featured"): EditorialTemplateId {
  if (format === "featured") return "featured";
  const tiles = TEMPLATE_LAYOUT[page.template as TemplateId]?.tiles ?? 4;
  if (tiles <= 1) return "hero-stack";
  if (tiles === 2) return "split-two";
  if (tiles === 3) return "triptych";
  // Everything larger used to become the six-cell grid, so most converted posts
  // looked identical. Spread them across layouts whose cells suit product shots,
  // chosen from the page id so a given list always converts the same way.
  const options: EditorialTemplateId[] = ["polaroid-scatter", "catalog", "hero-stack", "magazine-spread"];
  return options[stableIndex(page.id ?? page.template ?? "", options.length)];
}

function designForListPage(page: ListPage, name: string, format: "standard" | "featured"): EditorialPageDesign {
  // Pages authored in the editorial builder already carry a design; reuse it
  // verbatim rather than regenerating from a template.
  if (page.editorial) return page.editorial;
  return applyEditorialTemplate(page.productIds, name, templateForListPage(page, format));
}

export function communityListToPost(list: CommunityList, createdAt = Date.now()): Post {
  const format = list.format === "featured" ? "featured" : "standard";
  const sourcePages = list.pages?.length ? list.pages : [{ id: `page-${list.id}`, template: 4 as TemplateId, productIds: [] }];
  const pages: PostPage[] = sourcePages.map((page) => createPostPage(designForListPage(page, list.name, format)));
  // All pages share the first page's aspect ratio (model invariant).
  const postFormat: EditorialFormat = pages[0]?.design.format ?? "portrait";

  return normalizePost({
    id: list.id,
    authorId: list.authorId,
    pages,
    format: postFormat,
    coverPageIndex: 0,
    productIds: [],
    caption: list.caption,
    visibility: "public",
    likes: list.likes,
    comments: list.comments,
    createdAt,
  });
}

// --- saved looks (legacy lookbook drafts) ------------------------------------

export function savedLookToPost(look: SavedLook, authorId = "me", visibility: FaveVisibility = "private"): Post {
  const sourcePages = look.pages?.length
    ? look.pages
    : [{ id: `page-${look.id}`, productIds: look.selectedProductIds ?? [] }];

  const pages: PostPage[] = sourcePages.map((page) => {
    if (page.editorial) return createPostPage(page.editorial);
    const templateId: EditorialTemplateId = look.layout === "featured"
      ? "featured"
      : look.layout === "grid"
        ? "catalog"
        : "collection-story";
    const design = applyEditorialTemplate(page.productIds ?? [], look.title, templateId);
    // Preserve any media the look carried by appending it above the products.
    const media = (page.media ?? []).filter((item) => item.type === "image" || item.type === "video");
    if (media.length === 0) return createPostPage(design);
    const baseZ = design.elements.length;
    const mediaElements = media.map((item, index) => {
      const ref = mediaRefFor(item.src);
      const element = item.type === "video" ? createVideoElement(ref) : createImageElement(ref);
      return { ...element, name: item.name, x: 120 + index * 40, y: 200 + index * 40, zIndex: baseZ + index };
    });
    return createPostPage({ ...design, elements: [...design.elements, ...mediaElements] });
  });

  const postFormat: EditorialFormat = pages[0]?.design.format ?? "portrait";

  return normalizePost({
    id: look.id,
    authorId,
    pages,
    format: postFormat,
    coverPageIndex: 0,
    productIds: [],
    caption: look.description || look.prompt || "",
    visibility,
    likes: 0,
    comments: [],
    createdAt: look.createdAt,
  });
}

// --- bulk helpers ------------------------------------------------------------

/** Convenience for seeding: converts a batch and sorts newest first. */
export function communityListsToPosts(lists: CommunityList[], startedAt = Date.now()): Post[] {
  return lists
    .map((list, index) => communityListToPost(list, startedAt - index * 3_600_000))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Product ids referenced by a legacy list, used by callers that still need them. */
export function communityListProductIds(list: CommunityList): string[] {
  return flattenPages(list.pages);
}

export { postProductIds };
