/**
 * Accurate, human-written titles for the shoppable reels. The catalog only
 * carries a couple of products with attached videos, so the auto-generated
 * "featured product" name rarely matches what's actually on screen. These
 * titles were written from a visual review of each clip so the feed reads true
 * to the footage. The associated products are still surfaced on click-through.
 *
 * Keyed by the Cloudinary public-id token found in each video URL (stable even
 * if the CDN host or version changes).
 */
const titlesByToken: Record<string, string> = {
  lq1dbi: "Cream Knit & Denim Coffee Run",
  r2ezrp: "Olive Field Jacket Bookstore Stroll",
  ucdvrv: "Denim Jacket & Sundress at the Flower Market",
  ydwam6: "Flipping Through Vinyl Records",
  lfbdcn: "Camel Wrap Coat Autumn Walk",
  cjtkbn: "Oversized Blazer Gallery Day",
  evivvk: "Cozy Cardigan Café Sip",
  uzcdyj: "Peony Arranging at the Flower Shop",
  c3holw: "Knit Sweater & Satin Slip Skirt at Sunset",
  oe4nwe: "Olive Overshirt & Cargos Market Browse",
  tuffnj: "Chambray Shirt in the Pottery Studio",
  de5bxz: "Chore Jacket & Leather Satchel Street Style",
  il66gt: "Denim Trucker & Band Tee Coffee Walk",
  btgrgh: "Cream Sweater & Layered Gold Necklaces",
  fztgwj: "Oversized Denim & Graphic Tee at the Bookshop",
  evb2qs: "Linen Overshirt Fitting-Room Try-On",
};

/**
 * Returns an accurate, content-based title for a shoppable video, or
 * `undefined` if the URL isn't one of the known reels.
 */
export function getVideoTitle(videoUrl: string | undefined): string | undefined {
  if (!videoUrl) return undefined;
  const token = Object.keys(titlesByToken).find((key) => videoUrl.includes(key));
  return token ? titlesByToken[token] : undefined;
}
