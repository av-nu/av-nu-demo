import { mockProducts } from "@/data/mockProducts";
import type { ListComment } from "@/data/faves";
import type { VideoReview } from "@/lib/social/types";

// Reliable sample clips reused across the demo. Uploaded reviews use ephemeral
// object URLs that don't survive a reload, so cards fall back to this clip.
export const SAMPLE_REVIEW_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

const reviewVideoPool = [
  "/videos/ashwood-atelier-reel-compressed.mp4",
  "/products/Aurelith/Carousel video.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
];

function productAt(index: number): string {
  return mockProducts[index % mockProducts.length]?.id ?? mockProducts[0].id;
}

/**
 * Seeded community video reviews authored by people in the social graph. These
 * surface on author profiles and (when public) in discovery.
 */
export const communityVideoReviews: VideoReview[] = [
  {
    id: "vr-mara-1",
    authorId: "c-mara",
    productId: productAt(3),
    videoUrl: reviewVideoPool[0],
    caption: "Three weeks in and this is the piece I reach for every morning. Worth it.",
    rating: 5,
    visibility: "public",
    likes: 184,
    comments: [
      { id: "vrc-1", authorName: "Priya Nair", authorInitials: "PN", authorColor: "bg-burgundy", text: "Sold. Adding to cart now 🛒", createdAt: Date.now() - 1000 * 60 * 60 * 4 },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
  },
  {
    id: "vr-jonah-1",
    authorId: "c-jonah",
    productId: productAt(10),
    videoUrl: reviewVideoPool[1],
    caption: "Honest review: the fit runs a touch large but the quality is unreal.",
    rating: 4,
    visibility: "public",
    likes: 96,
    comments: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 52,
  },
  {
    id: "vr-priya-1",
    authorId: "c-priya",
    productId: productAt(23),
    videoUrl: reviewVideoPool[2],
    caption: "My favorite housewarming gift this year — close-up of the details.",
    rating: 5,
    visibility: "public",
    likes: 142,
    comments: [
      { id: "vrc-2", authorName: "Mara Ellis", authorInitials: "ME", authorColor: "bg-pink", text: "The glaze 😍", createdAt: Date.now() - 1000 * 60 * 90 },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 70,
  },
  {
    id: "vr-aria-1",
    authorId: "f-aria",
    productId: productAt(11),
    videoUrl: reviewVideoPool[3],
    caption: "Layering it three ways for the in-between weather.",
    rating: 4,
    visibility: "public",
    likes: 73,
    comments: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
  },
];

export function getCommunityVideoReview(id: string): VideoReview | undefined {
  return communityVideoReviews.find((v) => v.id === id);
}

export function getCommunityVideoReviewsByAuthor(authorId: string): VideoReview[] {
  return communityVideoReviews.filter((v) => v.authorId === authorId);
}

/** All public community reviews, newest first. */
export function getPublicVideoReviews(): VideoReview[] {
  return [...communityVideoReviews]
    .filter((v) => v.visibility === "public")
    .sort((a, b) => b.createdAt - a.createdAt);
}

export const _reviewSeedComment = (): ListComment[] => [];
