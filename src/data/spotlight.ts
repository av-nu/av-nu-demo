import { mockProducts, type Product } from "@/data/mockProducts";

// Curated, reliably-available video sources for the shoppable feed.
// Reuses the local Ashwood reel + Aurelith clip plus two dependable sample
// reels. (The 164MB ashwood .MOV is intentionally skipped for performance.)
const videoPool = [
  "/videos/ashwood-atelier-reel-compressed.mp4",
  "/products/Aurelith/Carousel video.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
];

export type SpotlightRow = {
  id: string;
  videoUrl: string;
  /** Product showcased alongside the video (card sits below it). */
  featured: Product;
  /** Four products shown in the 2x2 grid beside the video. */
  products: Product[];
};

/**
 * Builds the alternating shoppable feed rows.
 *
 * Each row pairs one featured "video" product with a 2x2 grid of four more
 * products. Products are pulled from the catalog with new arrivals first so the
 * feed feels fresh. Videos cycle through the curated pool above.
 */
export function buildSpotlightRows(rowCount = 4): SpotlightRow[] {
  // Prefer products that have a real photographic image (avoid the dedicated
  // PNG-only sets for the grid look) and lead with new arrivals.
  const ordered = [...mockProducts].sort((a, b) => Number(b.isNew) - Number(a.isNew));

  const rows: SpotlightRow[] = [];
  const perRow = 5; // 1 featured + 4 grid
  let cursor = 0;

  for (let i = 0; i < rowCount; i += 1) {
    const slice = ordered.slice(cursor, cursor + perRow);
    if (slice.length < perRow) break;

    const [featured, ...products] = slice;
    rows.push({
      id: `spotlight-${i + 1}`,
      videoUrl: videoPool[i % videoPool.length],
      featured,
      products,
    });

    cursor += perRow;
  }

  return rows;
}

/**
 * Products surfaced in the Instagram-style "What's Nu" circles. Each links to
 * its own product page.
 */
export function buildWhatsNuProducts(count = 12): Product[] {
  return [...mockProducts]
    .sort((a, b) => Number(b.isNew) - Number(a.isNew))
    .slice(0, count);
}
