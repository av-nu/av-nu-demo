import { mockBrands, type Brand } from "@/data/mockBrands";
import { mockProducts, type Product } from "@/data/mockProducts";

export type ProductFilters = {
  brandId?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  isNew?: boolean;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function includesText(haystack: string, needle: string) {
  return normalize(haystack).includes(normalize(needle));
}

export function getBrandById(brandId: string): Brand | undefined {
  return mockBrands.find((b) => b.id === brandId);
}

export function getProductById(productId: string): Product | undefined {
  return mockProducts.find((p) => p.id === productId);
}

export function getProductsByBrandId(brandId: string): Product[] {
  return mockProducts.filter((p) => p.brandId === brandId);
}

// Simple average of every product rating for a brand (0 when no products).
export function getBrandAverageRating(brandId: string): {
  average: number;
  productCount: number;
} {
  const products = getProductsByBrandId(brandId);
  if (products.length === 0) return { average: 0, productCount: 0 };
  const sum = products.reduce((acc, p) => acc + p.rating, 0);
  return { average: sum / products.length, productCount: products.length };
}

// Images for a brand "window". Returns the brand hero (used as the central
// anchor in the full 5+ layout) plus one representative photo per distinct
// product. The number of product photos drives which window template renders,
// so each entry maps to a real product rather than padding from one product.
// Brand attribute badges surfaced on the Window Shopping page.
export type BrandAttribute =
  | "sustainable"
  | "made_in_us"
  | "artisan"
  | "women_owned"
  | "minority_owned";

const BRAND_ATTRIBUTES: Record<string, BrandAttribute[]> = {
  "ashwood-atelier": ["artisan", "sustainable", "women_owned"],
  aurelith: ["made_in_us", "artisan"],
  "juniper-and-tide": ["sustainable", "made_in_us"],
  "parchment-provisions": ["sustainable", "women_owned"],
  "velvet-fern": ["sustainable", "women_owned", "minority_owned"],
  "loam-and-linen": ["artisan", "sustainable"],
  embertrail: ["made_in_us", "artisan"],
  "little-sparrow-co": ["women_owned", "sustainable"],
  "pinecone-pet-co": ["made_in_us", "sustainable"],
  "moonstone-mercantile": ["artisan", "women_owned", "minority_owned"],
  "citrus-and-clay": ["sustainable", "women_owned"],
  "wildflower-studio": ["artisan", "women_owned"],
  "northwood-pantry": ["made_in_us", "sustainable"],
  "coastal-knitworks": ["artisan", "made_in_us"],
  "sagewell-apothecary": ["sustainable", "women_owned", "minority_owned"],
  "terra-playroom": ["sustainable", "women_owned"],
  "summit-and-stream": ["made_in_us", "sustainable"],
  "dusklight-leather": ["artisan", "made_in_us"],
  "orchard-and-oat": ["sustainable", "made_in_us", "women_owned"],
};

export function getBrandAttributes(brandId: string): BrandAttribute[] {
  return BRAND_ATTRIBUTES[brandId] ?? [];
}

export type WindowProductPhoto = { id: string; image: string };

export function getBrandWindowImages(brandId: string): {
  heroImage: string;
  products: WindowProductPhoto[];
} {
  const brand = getBrandById(brandId);
  const products = getProductsByBrandId(brandId);

  const productPhotos: WindowProductPhoto[] = products
    .filter((p) => Boolean(p.images[0]))
    .map((p) => ({ id: p.id, image: p.images[0] }));

  const heroImage = brand?.heroImage ?? productPhotos[0]?.image ?? "";
  return { heroImage, products: productPhotos };
}

export function getProductsPage(page: number, pageSize: number) {
  return searchProducts("", {}, page, pageSize);
}

// Recommends products based on a set of purchased product ids. Candidates are
// scored by how much they overlap with the purchased items (same brand,
// category, subcategory), excluding the purchased products themselves. Falls
// back to top-rated products when overlap is sparse so the block is never empty.
export function getRecommendedProducts(
  productIds: string[],
  limit = 4,
): Product[] {
  const purchased = productIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p));

  const purchasedIds = new Set(purchased.map((p) => p.id));
  const brands = new Set(purchased.map((p) => p.brandId));
  const categories = new Set(purchased.map((p) => p.category));
  const subcategories = new Set(purchased.map((p) => p.subcategory));

  const scored = mockProducts
    .filter((p) => !purchasedIds.has(p.id))
    .map((p) => {
      let score = 0;
      if (subcategories.has(p.subcategory)) score += 3;
      if (categories.has(p.category)) score += 2;
      if (brands.has(p.brandId)) score += 1;
      return { product: p, score };
    });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.product.rating !== a.product.rating)
      return b.product.rating - a.product.rating;
    return b.product.ratingCount - a.product.ratingCount;
  });

  return scored.slice(0, limit).map((s) => s.product);
}

export function searchProducts(
  query: string,
  filters: ProductFilters,
  page: number,
  pageSize: number,
): { items: Product[]; total: number; hasMore: boolean } {
  const q = query.trim();
  const pageNumber = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 24;

  const brandNameById = new Map<string, string>();
  mockBrands.forEach((b) => brandNameById.set(b.id, b.name));

  const filtered = mockProducts.filter((product) => {
    if (filters.brandId && product.brandId !== filters.brandId) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.subcategory && product.subcategory !== filters.subcategory) return false;
    if (typeof filters.isNew === "boolean" && product.isNew !== filters.isNew) return false;
    if (typeof filters.minPrice === "number" && product.price < filters.minPrice) return false;
    if (typeof filters.maxPrice === "number" && product.price > filters.maxPrice) return false;

    if (!q) return true;

    const brandName = brandNameById.get(product.brandId) ?? "";
    const text = [
      product.name,
      brandName,
      product.category,
      product.subcategory,
      product.leaf ?? "",
    ].join(" ");

    return includesText(text, q);
  });

  const total = filtered.length;
  const start = (pageNumber - 1) * size;
  const end = start + size;
  const items = filtered.slice(start, end);
  const hasMore = end < total;

  return { items, total, hasMore };
}
