import type { CommunityList } from "@/data/faves";
import { mockProducts, type Product } from "@/data/mockProducts";
import { createEditorialPage } from "@/lib/editorial";
import type { SavedLook } from "@/lib/lookEngine";

type GuideDefinition = {
  slug: string;
  title: string;
  description: string;
  authorId: string;
  terms: string[];
  start: number;
};

const definitions: GuideDefinition[] = [
  { slug: "coastal-dinner", title: "Coastal Dinner", description: "Relaxed tailoring, warm-weather textures, and a little shine for dinner by the water.", authorId: "c-priya", terms: ["coastal", "resort", "vacation", "occasion", "jewelry"], start: 0 },
  { slug: "wedding-guest", title: "Wedding Guest", description: "Polished pieces that feel special without competing with the moment.", authorId: "f-aria", terms: ["occasion", "dress", "tailored", "jewelry", "elegant"], start: 9 },
  { slug: "easy-saturday", title: "Easy Saturday", description: "Easy layers and comfortable shapes for a full day of plans.", authorId: "c-mara", terms: ["casual", "relaxed", "weekend", "soft", "everyday"], start: 18 },
  { slug: "polished-work", title: "Polished Work", description: "Quietly confident layers for the days that call for focus and presence.", authorId: "c-jonah", terms: ["work", "tailored", "classic", "polished", "structured"], start: 27 },
  { slug: "weekend-city", title: "Weekend City", description: "A compact edit for coffee walks, galleries, and wherever the afternoon goes.", authorId: "c-sof", terms: ["city", "casual", "footwear", "travel", "layer"], start: 36 },
  { slug: "minimalist-date", title: "Minimalist Date", description: "Clean lines, restrained color, and one considered detail.", authorId: "f-noor", terms: ["minimal", "clean", "asymmetric", "jewelry", "beauty"], start: 45 },
  { slug: "garden-party", title: "Garden Party", description: "Light layers, soft color, and small details for an afternoon outside.", authorId: "c-deni", terms: ["garden", "spring", "occasion", "floral", "soft"], start: 54 },
  { slug: "everyday-neutrals", title: "Everyday Neutrals", description: "The dependable pieces that make getting dressed feel simple and intentional.", authorId: "c-leo", terms: ["neutral", "minimal", "classic", "everyday", "beauty"], start: 63 },
];

function productText(product: Product) {
  return [product.name, product.category, product.subcategory, product.productType, ...(product.styleTags ?? []), ...(product.occasionTags ?? []), ...(product.moodTags ?? [])].join(" ").toLowerCase();
}

function selectProducts(terms: string[], start: number) {
  const matches = mockProducts.filter((product) => terms.some((term) => productText(product).includes(term)));
  const pool = Array.from(new Map([...matches, ...mockProducts].map((product) => [product.id, product])).values());
  const selected: Product[] = [];

  for (let offset = 0; selected.length < 4 && offset < pool.length; offset += 1) {
    const product = pool[(start + offset * 3) % pool.length];
    if (product && !selected.some((item) => item.id === product.id)) selected.push(product);
  }

  return selected;
}

function lookPageFor(id: string, title: string, productIds: string[]) {
  return { id, productIds, editorial: createEditorialPage(productIds, title, "collection-story") };
}

export const curatedGuideLooks: SavedLook[] = definitions.map((definition, index) => {
  const productIds = selectProducts(definition.terms, definition.start).map((product) => product.id);
  const id = `curated-guide-${definition.slug}`;
  return {
    id,
    title: definition.title,
    description: definition.description,
    prompt: `curated guide: ${definition.slug}`,
    layout: "editorial",
    pages: [lookPageFor(`${id}-page-1`, definition.title, productIds)],
    selectedProductIds: productIds,
    lockedProductIds: [],
    rails: [],
    createdAt: Date.now() - (definitions.length - index) * 1000,
    updatedAt: Date.now() - (definitions.length - index) * 1000,
  };
});

export const curatedGuidePosts: CommunityList[] = curatedGuideLooks.map((look, index) => ({
  id: `curated-post-${look.id}`,
  authorId: definitions[index].authorId,
  name: look.title,
  caption: look.description,
  format: "featured",
  pages: (look.pages ?? []).map((page) => ({ id: page.id, template: 4, productIds: page.productIds, editorial: page.editorial })),
  likes: 96 + index * 19,
  comments: [],
}));

export function discoverGuidePosts(existing: CommunityList[]) {
  const curatedIds = new Set(curatedGuidePosts.map((post) => post.id));
  return [...curatedGuidePosts, ...existing.filter((post) => !curatedIds.has(post.id))];
}
