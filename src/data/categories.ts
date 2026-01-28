export type CategoryLeaf = {
  id: string;
  name: string;
};

export type Subcategory = {
  id: string;
  name: string;
  leaves?: CategoryLeaf[];
};

export type Category = {
  id: string;
  name: string;
  subcategories: Subcategory[];
};

export const categories: Category[] = [
  {
    id: "apparel",
    name: "Apparel",
    subcategories: [
      { id: "apparel-tops", name: "Tops" },
      { id: "apparel-bottoms", name: "Bottoms" },
      { id: "apparel-outerwear", name: "Outerwear" },
      { id: "apparel-loungewear", name: "Loungewear" },
      { id: "apparel-knitwear", name: "Knitwear" },
      { id: "apparel-footwear", name: "Footwear" },
    ],
  },
  {
    id: "home-living",
    name: "Home & Living",
    subcategories: [
      {
        id: "home-bedding",
        name: "Bedding",
        leaves: [
          { id: "home-bedding-sheets", name: "Sheets" },
          { id: "home-bedding-blankets", name: "Blankets" },
          { id: "home-bedding-pillows", name: "Pillows" },
        ],
      },
      {
        id: "home-kitchen",
        name: "Kitchen",
        leaves: [
          { id: "home-kitchen-drinkware", name: "Drinkware" },
          { id: "home-kitchen-cookware", name: "Cookware" },
          { id: "home-kitchen-serveware", name: "Serveware" },
        ],
      },
      { id: "home-furniture", name: "Furniture" },
      { id: "home-decor", name: "Decor" },
      { id: "home-bath", name: "Bath" },
      { id: "home-lighting", name: "Lighting" },
      { id: "home-organization", name: "Organization" },
      { id: "home-electronics", name: "Electronics" },
    ],
  },
  {
    id: "outdoors",
    name: "Outdoors",
    subcategories: [
      {
        id: "outdoors-camping",
        name: "Camping",
        leaves: [
          { id: "outdoors-camping-tents", name: "Tents" },
          { id: "outdoors-camping-sleeping", name: "Sleeping" },
          { id: "outdoors-camping-cooking", name: "Cooking" },
        ],
      },
      { id: "outdoors-hiking", name: "Hiking" },
      { id: "outdoors-travel", name: "Travel" },
      { id: "outdoors-water", name: "Water" },
      { id: "outdoors-outdoor-living", name: "Outdoor Living" },
    ],
  },
  {
    id: "pet",
    name: "Pet",
    subcategories: [
      { id: "pet-toys", name: "Toys" },
      { id: "pet-grooming", name: "Grooming" },
      { id: "pet-leashes", name: "Leashes" },
      { id: "pet-beds", name: "Beds" },
    ],
  },
  {
    id: "beauty",
    name: "Beauty",
    subcategories: [
      {
        id: "beauty-skincare",
        name: "Skincare",
        leaves: [
          { id: "beauty-skincare-cleansers", name: "Cleansers" },
          { id: "beauty-skincare-moisturizers", name: "Moisturizers" },
          { id: "beauty-skincare-serums", name: "Serums" },
        ],
      },
      { id: "beauty-body", name: "Body" },
      { id: "beauty-hair", name: "Hair" },
      { id: "beauty-fragrance", name: "Fragrance" },
    ],
  },
  {
    id: "kids",
    name: "Kids",
    subcategories: [
      { id: "kids-play", name: "Play" },
      { id: "kids-nursery", name: "Nursery" },
      { id: "kids-apparel", name: "Apparel" },
      { id: "kids-books", name: "Books" },
    ],
  },
  {
    id: "accessories",
    name: "Accessories",
    subcategories: [
      { id: "accessories-jewelry", name: "Jewelry" },
      { id: "accessories-bags", name: "Bags" },
      { id: "accessories-wallets", name: "Wallets" },
      { id: "accessories-hats", name: "Hats" },
      { id: "accessories-tech", name: "Tech" },
    ],
  },
  {
    id: "wellness",
    name: "Wellness",
    subcategories: [
      { id: "wellness-supplements", name: "Supplements" },
      { id: "wellness-sleep", name: "Sleep" },
      { id: "wellness-mindfulness", name: "Mindfulness" },
      { id: "wellness-recovery", name: "Recovery" },
    ],
  },
  {
    id: "food-drink",
    name: "Food & Drink",
    subcategories: [
      {
        id: "food-pantry",
        name: "Pantry",
        leaves: [
          { id: "food-pantry-oils", name: "Oils & Vinegars" },
          { id: "food-pantry-spices", name: "Spices" },
          { id: "food-pantry-grains", name: "Grains" },
        ],
      },
      { id: "food-snacks", name: "Snacks" },
      { id: "food-tea", name: "Tea" },
      { id: "food-coffee", name: "Coffee" },
    ],
  },
];

// Helper to get category path labels
export function getCategoryPath(
  categoryId?: string,
  subcategoryId?: string,
  leafId?: string,
): string[] {
  const path: string[] = [];

  if (!categoryId) return path;

  const category = categories.find((c) => c.id === categoryId);
  if (!category) return path;
  path.push(category.name);

  if (!subcategoryId) return path;

  const subcategory = category.subcategories.find((s) => s.id === subcategoryId);
  if (!subcategory) return path;
  path.push(subcategory.name);

  if (!leafId || !subcategory.leaves) return path;

  const leaf = subcategory.leaves.find((l) => l.id === leafId);
  if (leaf) path.push(leaf.name);

  return path;
}

// Map product category/subcategory strings to our category IDs
export function mapProductToCategory(product: {
  category: string;
  subcategory: string;
}): { categoryId: string; subcategoryId: string } | null {
  const categoryMap: Record<string, string> = {
    "Home & Living": "home-living",
    Apparel: "apparel",
    Beauty: "beauty",
    Outdoors: "outdoors",
    Pet: "pet",
    Kids: "kids",
    Food: "food-drink",
    Accessories: "accessories",
    Wellness: "wellness",
  };

  const categoryId = categoryMap[product.category];
  if (!categoryId) return null;

  const category = categories.find((c) => c.id === categoryId);
  if (!category) return null;

  const subcategory = category.subcategories.find(
    (s) => s.name.toLowerCase() === product.subcategory.toLowerCase(),
  );

  return {
    categoryId,
    subcategoryId: subcategory?.id ?? "",
  };
}
