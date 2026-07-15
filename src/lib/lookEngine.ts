import { mockProducts, type Product } from "@/data/mockProducts";
import { editorialProductIds, normalizeEditorialPage, type EditorialPageDesign } from "@/lib/editorial";

export type LookRail = {
  id: string;
  title: string;
  productIds: string[];
};

export type LookbookLayout = "layflat" | "grid" | "editorial";
export type LayflatStyle = "classic" | "diagonal" | "stacked" | "orbit";

export type LookbookMedia = {
  id: string;
  type: "image" | "video";
  src: string;
  name: string;
};

export type LookbookPage = {
  id: string;
  productIds: string[];
  media?: LookbookMedia[];
  layflatStyle?: LayflatStyle;
  gridItemCount?: number;
  editorial?: EditorialPageDesign;
};

export type SavedLook = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  sourceImage?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  layout?: LookbookLayout;
  postListId?: string;
  pages?: LookbookPage[];
  selectedProductIds: string[];
  lockedProductIds: string[];
  rails: LookRail[];
  createdAt: number;
  updatedAt: number;
};

export function normalizeSavedLook(look: SavedLook): SavedLook {
  const sourcePages = look.pages?.length ? look.pages : [{ id: `page-${look.id}`, productIds: look.selectedProductIds ?? [] }];
  const pages = sourcePages.map((page) => {
    const productIds = Array.from(new Set((page.productIds ?? []).filter((id): id is string => typeof id === "string"))).slice(0, 8);
    const media = (page.media ?? []).filter((item) => item && typeof item.id === "string" && (item.type === "image" || item.type === "video") && typeof item.src === "string").slice(0, Math.max(0, 8 - productIds.length));
    if (look.layout !== "editorial") return { ...page, productIds, media, layflatStyle: page.layflatStyle ?? "classic", gridItemCount: Math.min(8, Math.max(1, Math.round(page.gridItemCount ?? Math.max(4, productIds.length + media.length)))) };
    const editorial = normalizeEditorialPage(page.editorial, productIds, look.title);
    return { ...page, productIds: editorialProductIds(editorial), editorial };
  });
  const allProductIds = new Set(pages.flatMap((page) => page.productIds));
  return {
    ...look,
    layout: look.layout ?? "layflat",
    pages,
    selectedProductIds: pages[0]?.productIds ?? [],
    lockedProductIds: (look.lockedProductIds ?? []).filter((id) => allProductIds.has(id)),
  };
}

type GenerateOptions = {
  budget?: number;
  sourceImage?: string;
  lockedProductIds?: string[];
};

const fashionTerms = [
  "outfit",
  "dinner",
  "wedding",
  "brunch",
  "date",
  "vacation",
  "work",
  "casual",
  "dressy",
  "coastal",
  "minimalist",
  "summer",
];

const promptCategoryHints: Array<{ terms: string[]; categories: string[] }> = [
  { terms: ["vacation", "beach", "travel", "coastal"], categories: ["Apparel", "Accessories", "Outdoors"] },
  { terms: ["work", "office", "polished"], categories: ["Apparel", "Accessories", "Home & Living"] },
  { terms: ["wedding", "dinner", "date", "dressy", "brunch"], categories: ["Apparel", "Accessories", "Beauty"] },
  { terms: ["home", "hosting", "table", "living room"], categories: ["Home & Living", "Accessories", "Food"] },
  { terms: ["wellness", "reset", "self care"], categories: ["Beauty", "Wellness", "Home & Living"] },
];

function makeId() {
  return `look-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function termsFor(prompt: string) {
  return prompt.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function getBudget(prompt: string, budget?: number) {
  if (budget) return budget;
  const matched = prompt.match(/(?:under|below|less than)\s*\$?(\d+)/i) ?? prompt.match(/\$(\d+)/);
  return matched?.[1] ? Number(matched[1]) : undefined;
}

function relevantCategories(prompt: string) {
  const normalized = prompt.toLowerCase();
  const match = promptCategoryHints.find((hint) => hint.terms.some((term) => normalized.includes(term)));
  return match?.categories ?? ["Apparel", "Accessories", "Beauty"];
}

function scoreProduct(product: Product, terms: string[], categories: string[], budget?: number) {
  const text = `${product.name} ${product.description} ${product.category} ${product.subcategory} ${product.leaf ?? ""}`.toLowerCase();
  const termScore = terms.reduce((score, term) => score + (text.includes(term) ? 14 : 0), 0);
  const categoryScore = categories.includes(product.category) ? 70 : 0;
  const budgetScore = budget ? (product.price <= budget ? 20 : Math.max(-35, (budget - product.price) / 4)) : 0;
  return categoryScore + termScore + budgetScore + product.rating * 7 + Math.min(product.ratingCount / 100, 8) + (product.isNew ? 2 : 0);
}

function createTitle(prompt: string) {
  const cleaned = prompt.replace(/\b(look|outfit|please|something|for|a|an|the)\b/gi, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "A look for right now";
  return cleaned.split(" ").slice(0, 5).map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");
}

function createDescription(prompt: string, categories: string[], sourceImage?: string) {
  const normalized = prompt.toLowerCase();
  const tone = normalized.includes("dress") || normalized.includes("wedding") || normalized.includes("dinner")
    ? "a polished direction"
    : normalized.includes("vacation") || normalized.includes("beach")
      ? "an easy, travel-ready direction"
      : "an effortless, everyday direction";
  const imageNote = sourceImage ? " I used your image as a visual starting point." : "";
  return `I interpreted this as ${tone} with pieces across ${categories.slice(0, 2).join(" and ")}.${imageNote}`;
}

function buildRails(prompt: string, budget?: number) {
  const categories = relevantCategories(prompt);
  const terms = termsFor(prompt);
  const scored = mockProducts
    .map((product) => ({ product, score: scoreProduct(product, terms, categories, budget) }))
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating);
  const usable = scored.filter(({ product }) => categories.includes(product.category));
  const fallback = scored.filter(({ product }) => !categories.includes(product.category));
  const source = [...usable, ...fallback];
  const groups = new Map<string, Product[]>();

  for (const { product } of source) {
    const title = product.subcategory || product.category;
    const group = groups.get(title) ?? [];
    if (!group.some((item) => item.id === product.id)) group.push(product);
    groups.set(title, group);
  }

  const rails = Array.from(groups.entries())
    .filter(([, products]) => products.length >= 2)
    .slice(0, 5)
    .map(([title, products]) => ({
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title,
      productIds: products.slice(0, 10).map((product) => product.id),
    }));

  if (rails.length >= 3) return rails;

  const fallbackRails = Array.from(new Set(mockProducts.map((product) => product.category)))
    .filter((category) => !rails.some((rail) => rail.title === category))
    .map((category) => ({
      id: category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: category,
      productIds: scored.filter(({ product }) => product.category === category).slice(0, 10).map(({ product }) => product.id),
    }))
    .filter((rail) => rail.productIds.length > 0);

  return [...rails, ...fallbackRails].slice(0, 5);
}

function selectedProducts(rails: LookRail[], lockedProductIds: string[]) {
  const available = new Set(rails.flatMap((rail) => rail.productIds));
  const locks = lockedProductIds.filter((id) => available.has(id));
  const selected = [...locks];

  for (const rail of rails) {
    if (selected.length >= 4) break;
    const candidate = rail.productIds.find((id) => !selected.includes(id));
    if (candidate) selected.push(candidate);
  }

  return selected;
}

export function generateLook(prompt: string, options: GenerateOptions = {}): SavedLook {
  const normalizedPrompt = prompt.trim() || "an easy everyday look";
  const budget = getBudget(normalizedPrompt, options.budget);
  const rails = buildRails(normalizedPrompt, budget);
  const categories = relevantCategories(normalizedPrompt);
  const lockedProductIds = options.lockedProductIds ?? [];
  const now = Date.now();

  return {
    id: makeId(),
    title: createTitle(normalizedPrompt),
    description: createDescription(normalizedPrompt, categories, options.sourceImage),
    prompt: normalizedPrompt,
    sourceImage: options.sourceImage,
    selectedProductIds: selectedProducts(rails, lockedProductIds),
    lockedProductIds,
    rails,
    createdAt: now,
    updatedAt: now,
  };
}

export function refineLook(look: SavedLook, refinement: string): SavedLook {
  const nextPrompt = `${look.prompt} ${refinement}`.trim();
  const budget = getBudget(nextPrompt);
  const lowered = refinement.toLowerCase();
  const raw = generateLook(nextPrompt, {
    budget,
    sourceImage: look.sourceImage,
    lockedProductIds: look.lockedProductIds,
  });
  const rails = lowered.includes("cheaper") || lowered.includes("lower price") || lowered.includes("under $")
    ? raw.rails.map((rail) => ({
      ...rail,
      productIds: [...rail.productIds].sort((a, b) => {
        const aPrice = mockProducts.find((product) => product.id === a)?.price ?? 0;
        const bPrice = mockProducts.find((product) => product.id === b)?.price ?? 0;
        return aPrice - bPrice;
      }),
    }))
    : raw.rails;

  return {
    ...look,
    ...raw,
    id: look.id,
    title: look.title,
    description: look.description,
    createdAt: look.createdAt,
    layout: look.layout,
    backgroundColor: look.backgroundColor,
    backgroundImage: look.backgroundImage,
    pages: look.pages,
    postListId: look.postListId,
    rails,
    selectedProductIds: selectedProducts(rails, look.lockedProductIds),
    updatedAt: Date.now(),
  };
}

export function swapLookProduct(look: SavedLook, railId: string, productId: string): SavedLook {
  const rail = look.rails.find((item) => item.id === railId);
  if (!rail || !rail.productIds.includes(productId)) return look;
  const replacedId = look.selectedProductIds.find((id) => rail.productIds.includes(id));
  const selectedProductIds = replacedId
    ? look.selectedProductIds.map((id) => (id === replacedId ? productId : id))
    : [...look.selectedProductIds, productId].slice(0, 4);
  const lockedProductIds = look.lockedProductIds.filter((id) => id !== replacedId);
  return { ...look, selectedProductIds: Array.from(new Set(selectedProductIds)), lockedProductIds, updatedAt: Date.now() };
}

export function toggleLookLock(look: SavedLook, productId: string): SavedLook {
  const lockedProductIds = look.lockedProductIds.includes(productId)
    ? look.lockedProductIds.filter((id) => id !== productId)
    : [...look.lockedProductIds, productId];
  return { ...look, lockedProductIds, updatedAt: Date.now() };
}

export function isStylePrompt(prompt: string) {
  return fashionTerms.some((term) => prompt.toLowerCase().includes(term));
}
