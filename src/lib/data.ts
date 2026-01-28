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

export function getProductsPage(page: number, pageSize: number) {
  return searchProducts("", {}, page, pageSize);
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
