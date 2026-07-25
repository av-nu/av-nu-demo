import { mockProducts, type Product } from "@/data/mockProducts";
import { editorialProductIds, normalizeEditorialPage, type EditorialPageDesign } from "@/lib/editorial";

export type LookRail = {
  id: string;
  title: string;
  productIds: string[];
};

export type LookbookLayout = "layflat" | "grid" | "featured" | "editorial";
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
  recommendations?: string[];
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
  seedVersion?: number;
};

export function normalizeSavedLook(look: SavedLook): SavedLook {
  const layout = look.layout === "layflat" ? "grid" : look.layout ?? "editorial";
  const sourcePages = look.pages?.length ? look.pages : [{ id: `page-${look.id}`, productIds: look.selectedProductIds ?? [] }];
  const pages = sourcePages.map((page) => {
    const productIds = Array.from(new Set((page.productIds ?? []).filter((id): id is string => typeof id === "string"))).slice(0, 8);
    const media = (page.media ?? []).filter((item) => item && typeof item.id === "string" && (item.type === "image" || item.type === "video") && typeof item.src === "string").slice(0, Math.max(0, 8 - productIds.length));
    if (layout !== "editorial") return { ...page, productIds, media, layflatStyle: page.layflatStyle ?? "classic", gridItemCount: Math.min(8, Math.max(1, Math.round(page.gridItemCount ?? Math.max(4, productIds.length + media.length)))) };
    const editorial = normalizeEditorialPage(page.editorial, productIds, look.title);
    return { ...page, productIds: editorialProductIds(editorial), editorial };
  });
  const allProductIds = new Set(pages.flatMap((page) => page.productIds));
  return {
    ...look,
    layout,
    pages,
    selectedProductIds: pages[0]?.productIds ?? [],
    lockedProductIds: (look.lockedProductIds ?? []).filter((id) => allProductIds.has(id)),
  };
}

type GenerateOptions = {
  budget?: number;
  sourceImage?: string;
  lockedProductIds?: string[];
  recommendations?: string[];
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
  "accessories",
  "shoes",
  "colorful",
  "neutral",
];

const stopWords = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "in",
  "it",
  "look",
  "make",
  "me",
  "more",
  "my",
  "of",
  "on",
  "or",
  "outfit",
  "please",
  "something",
  "than",
  "the",
  "this",
  "to",
  "under",
  "below",
  "less",
  "lower",
  "price",
  "with",
]);

const promptAliases: Array<{ terms: string[]; signals: string[]; categories?: string[] }> = [
  { terms: ["summer"], signals: ["warm weather", "resort", "vacation"] },
  { terms: ["wedding", "wedding guest"], signals: ["celebration", "event", "occasion wear", "elegant"], categories: ["Apparel", "Accessories", "Beauty"] },
  { terms: ["vacation", "travel", "beach", "coastal", "seaside"], signals: ["vacation", "resort", "relaxed", "warm weather"], categories: ["Apparel", "Accessories", "Beauty"] },
  { terms: ["work", "office", "professional"], signals: ["work", "workwear", "polished", "tailored"], categories: ["Apparel", "Accessories", "Beauty"] },
  { terms: ["first date", "date night", "date"], signals: ["dinner", "elevated", "elegant", "event ready"], categories: ["Apparel", "Accessories", "Beauty"] },
  { terms: ["brunch"], signals: ["weekend", "elevated", "relaxed", "warm weather"], categories: ["Apparel", "Accessories", "Beauty"] },
  { terms: ["minimalist", "minimal", "simple"], signals: ["modern", "polished", "contemporary", "cream", "taupe"] },
  { terms: ["casual"], signals: ["casual wear", "everyday", "relaxed", "weekend"] },
  { terms: ["dressier", "dressy", "formal"], signals: ["evening apparel", "occasion wear", "elegant", "event ready", "celebration"] },
  { terms: ["colorful", "colourful", "bright"], signals: ["coral", "rose", "peach", "blue", "mustard", "burgundy"] },
  { terms: ["neutral", "neutrals", "tonal"], signals: ["cream", "taupe", "camel", "charcoal", "olive"] },
  { terms: ["shoes", "shoe", "footwear", "swap shoes"], signals: ["footwear", "shoes", "women's shoes"], categories: ["Accessories", "Apparel", "Beauty"] },
  { terms: ["accessory", "accessories", "jewelry", "add accessories"], signals: ["accessories", "jewelry", "necklaces", "earrings", "bracelets & rings"], categories: ["Accessories", "Apparel", "Beauty"] },
  { terms: ["self care", "skincare", "beauty"], signals: ["beauty", "self care", "skincare & fragrance"], categories: ["Beauty", "Accessories", "Apparel"] },
];

const availableCategories = Array.from(new Set(mockProducts.map((product) => product.category)));

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function makeId() {
  return `look-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function matchedAliases(prompt: string) {
  const normalized = normalizeSearchText(prompt);
  return promptAliases.filter((alias) => alias.terms.some((term) => normalized.includes(normalizeSearchText(term))));
}

function termsFor(prompt: string) {
  const normalized = normalizeSearchText(prompt);
  const tokens = normalized.split(" ").filter((term) => term.length > 1 && !stopWords.has(term) && !/^\d+$/.test(term));
  const phrases = tokens.slice(0, -1).map((term, index) => `${term} ${tokens[index + 1]}`);
  const aliases = matchedAliases(prompt).flatMap((alias) => alias.signals);
  return Array.from(new Set([...tokens, ...phrases, ...aliases].map(normalizeSearchText).filter(Boolean)));
}

function getBudget(prompt: string, budget?: number) {
  if (budget) return budget;
  const matched = prompt.match(/(?:under|below|less than)\s*\$?(\d+)/i) ?? prompt.match(/\$(\d+)/);
  return matched?.[1] ? Number(matched[1]) : undefined;
}

function relevantCategories(prompt: string) {
  const hinted = matchedAliases(prompt).flatMap((alias) => alias.categories ?? []);
  return Array.from(new Set([...hinted, ...availableCategories]));
}

function values(value?: string | string[]) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function productSearchFields(product: Product): Array<{ values: string[]; weight: number }> {
  return [
    { values: values(product.productType), weight: 30 },
    { values: values(product.name), weight: 28 },
    { values: values(product.occasionTags), weight: 26 },
    { values: values(product.moodTags), weight: 24 },
    { values: values(product.recommendationTags), weight: 22 },
    { values: values(product.searchTags), weight: 20 },
    { values: values(product.styleTags), weight: 18 },
    { values: values(product.leaf), weight: 18 },
    { values: values(product.subcategory), weight: 16 },
    { values: values(product.collection), weight: 14 },
    { values: values(product.colors), weight: 14 },
    { values: values(product.materials), weight: 14 },
    { values: values(product.category), weight: 10 },
    { values: values(product.merchant), weight: 6 },
    { values: values(product.description), weight: 4 },
  ];
}

function fieldMatches(fieldValue: string, term: string) {
  const normalizedField = normalizeSearchText(fieldValue);
  return normalizedField === term || normalizedField.includes(term) || term.includes(normalizedField);
}

function matchingTermCount(product: Product, terms: string[]) {
  return terms.filter((term) => productSearchFields(product).some((field) => field.values.some((value) => fieldMatches(value, term)))).length;
}

function scoreProduct(product: Product, terms: string[], categories: string[], budget?: number) {
  const categoryIndex = categories.indexOf(product.category);
  const categoryScore = categoryIndex >= 0 ? Math.max(20, 65 - categoryIndex * 12) : -30;
  const attributeScore = productSearchFields(product).reduce((total, field) => {
    const matches = terms.filter((term) => field.values.some((value) => fieldMatches(value, term))).length;
    return total + Math.min(matches, 4) * field.weight;
  }, 0);
  const budgetScore = budget ? (product.price <= budget ? 35 : -100) : 0;
  const qualityScore = product.rating * 3 + Math.min(product.ratingCount / 250, 4) + (product.isNew ? 2 : 0);
  return categoryScore + attributeScore + budgetScore + qualityScore;
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
  const imageNote = sourceImage ? " Your image is included as visual inspiration while the product matches come from your written preferences." : "";
  return `I interpreted this as ${tone} with products ranked from the catalog across ${categories.slice(0, 2).join(" and ")}.${imageNote}`;
}

function buildRails(prompt: string, budget?: number) {
  const categories = relevantCategories(prompt);
  const terms = termsFor(prompt);
  const scored = mockProducts
    .map((product) => ({ product, score: scoreProduct(product, terms, categories, budget), matchCount: matchingTermCount(product, terms) }))
    .sort((a, b) => b.score - a.score || b.matchCount - a.matchCount || b.product.rating - a.product.rating || a.product.price - b.product.price);
  const withinBudget = budget ? scored.filter(({ product }) => product.price <= budget) : scored;
  const ranked = withinBudget.length >= 10 ? withinBudget : scored;
  const matchedProductIds = new Set(ranked.filter(({ matchCount }) => matchCount > 0).map(({ product }) => product.id));
  const groups = new Map<string, Product[]>();

  for (const { product } of ranked) {
    const title = product.subcategory || product.category;
    const group = groups.get(title) ?? [];
    if (!group.some((item) => item.id === product.id)) group.push(product);
    groups.set(title, group);
  }

  const rails = Array.from(groups.entries())
    .filter(([, products]) => products.length >= 2)
    .slice(0, 5)
    .map(([title, products]) => {
      const matchedProducts = products.filter((product) => matchedProductIds.has(product.id));
      const railProducts = matchedProducts.length >= 2 ? matchedProducts : products;
      return {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title,
        productIds: railProducts.slice(0, 10).map((product) => product.id),
      };
    });

  if (rails.length >= 3) return rails;

  const fallbackRails = availableCategories
    .filter((category) => !rails.some((rail) => rail.title === category))
    .map((category) => ({
      id: category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: category,
      productIds: ranked.filter(({ product }) => product.category === category).slice(0, 10).map(({ product }) => product.id),
    }))
    .filter((rail) => rail.productIds.length > 0);

  return [...rails, ...fallbackRails].slice(0, 5);
}

function selectedProducts(rails: LookRail[], lockedProductIds: string[]) {
  const validProductIds = new Set(mockProducts.map((product) => product.id));
  const locks = lockedProductIds.filter((id) => validProductIds.has(id));
  const selected = [...locks];

  for (const rail of rails) {
    if (selected.length >= 4) break;
    const candidate = rail.productIds.find((id) => !selected.includes(id));
    if (candidate) selected.push(candidate);
  }

  return selected;
}

export function generateLook(prompt: string, options: GenerateOptions = {}): SavedLook {
  const writtenPrompt = prompt.trim();
  const recommendations = Array.from(new Set((options.recommendations ?? []).map((item) => item.trim()).filter(Boolean)));
  const searchPrompt = [writtenPrompt, ...recommendations].filter(Boolean).join(" ") || "an easy everyday look";
  const budget = getBudget(searchPrompt, options.budget);
  const rails = buildRails(searchPrompt, budget);
  const categories = relevantCategories(searchPrompt);
  const lockedProductIds = options.lockedProductIds ?? [];
  const now = Date.now();

  return {
    id: makeId(),
    title: createTitle(writtenPrompt || recommendations.find((item) => !/\bunder\b/i.test(item)) || searchPrompt),
    description: createDescription(searchPrompt, categories, options.sourceImage),
    prompt: writtenPrompt,
    recommendations,
    sourceImage: options.sourceImage,
    layout: "editorial",
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
    recommendations: look.recommendations,
  });
  let rails = lowered.includes("cheaper") || lowered.includes("lower price") || lowered.includes("under $")
    ? raw.rails.map((rail) => ({
      ...rail,
      productIds: [...rail.productIds].sort((a, b) => {
        const aPrice = mockProducts.find((product) => product.id === a)?.price ?? 0;
        const bPrice = mockProducts.find((product) => product.id === b)?.price ?? 0;
        return aPrice - bPrice;
      }),
    }))
    : raw.rails;

  const priorityTitles = lowered.includes("shoe")
    ? ["Footwear"]
    : lowered.includes("accessor")
      ? ["Jewelry", "Footwear"]
      : [];
  if (priorityTitles.length > 0) {
    rails = [...rails].sort((a, b) => {
      const aIndex = priorityTitles.indexOf(a.title);
      const bIndex = priorityTitles.indexOf(b.title);
      return (aIndex < 0 ? priorityTitles.length : aIndex) - (bIndex < 0 ? priorityTitles.length : bIndex);
    });
  }

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
