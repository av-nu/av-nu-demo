import { mockBrands } from "@/data/mockBrands";

export type Product = {
  id: string;
  brandId: string;
  name: string;
  price: number;
  rating: number;
  ratingCount: number;
  category: string;
  subcategory: string;
  leaf?: string;
  images: string[];
  isNew: boolean;
  description: string;
};

const productImages = [
  "/products/_pool/2h-media-s4A3YYhz7II-unsplash.jpg",
  "/products/_pool/andrej-lisakov-fOo4p1SFbrk-unsplash.jpg",
  "/products/_pool/andrej-lisakov-megMgyWXwck-unsplash.jpg",
  "/products/_pool/andrey-matveev-Q6HUG_m1xKA-unsplash.jpg",
  "/products/_pool/behnam-norouzi-y0K8EMigxV4-unsplash.jpg",
  "/products/_pool/bundo-kim-oQnnY4mLZmE-unsplash.jpg",
  "/products/_pool/con-se-ZFQfp1ihgmk-unsplash.jpg",
  "/products/_pool/curated-lifestyle-4_-N5jH7WPM-unsplash1.jpg",
  "/products/_pool/curated-lifestyle-gLmmY_kGIdU-unsplash2.jpg",
  "/products/_pool/curated-lifestyle-iw0VRtZS0E4-unsplash3.jpg",
  "/products/_pool/daiga-ellaby-Fs9Vw1OYHJU-unsplash.jpg",
  "/products/_pool/daiga-ellaby-eKBG7QgDQq0-unsplash.jpg",
  "/products/_pool/ela-de-pure-5eoYsqzmDW4-unsplash.jpg",
  "/products/_pool/george-dagerotip-EbJJPQ3_co8-unsplash1.jpg",
  "/products/_pool/george-dagerotip-Y24RoK5flmY-unsplash2.jpg",
  "/products/_pool/getty-images-63mXBf49V_E-unsplash1.jpg",
  "/products/_pool/getty-images-A9by5fW3N8s-unsplash2.jpg",
  "/products/_pool/getty-images-ZXEv4N7xXjg-unsplash.jpg",
  "/products/_pool/getty-images-iWq-K1gzKQI-unsplash3.jpg",
  "/products/_pool/james-lewis-GeXsUpTSYFg-unsplash.jpg",
  "/products/_pool/jose-m-ayala-abXRpkfW6MA-unsplash.jpg",
  "/products/_pool/jsb-co-6ak39XYMMvk-unsplash.jpg",
  "/products/_pool/karolina-grabowska-fpz3RrJtoh8-unsplash.jpg",
  "/products/_pool/lasse-jensen-g4IG8Ux6wvA-unsplash.jpg",
  "/products/_pool/matus-gocman-_VD-KDdnoOM-unsplash.jpg",
  "/products/_pool/mitchell-luo-dH20XDNJsN8-unsplash1.jpg",
  "/products/_pool/mitchell-luo-GYNNykpWOU4-unsplash2.jpg",
  "/products/_pool/mitchell-luo-ryXtOo247mI-unsplash3.jpg",
  "/products/_pool/mockup-free-BBUbUMxC_rc-unsplash.jpg",
  "/products/_pool/pablo-merchan-montes--JfwKVjInI0-unsplash.jpg",
  "/products/_pool/planet-volumes-VD9oRt9v4Yo-unsplash.jpg",
  "/products/_pool/planet-volumes-frrwVFGvLL4-unsplash.jpg",
  "/products/_pool/polina-kuzovkova-K38VKmY_T0o-unsplash.jpg",
  "/products/_pool/sayan-majhi-lWVgBTkXtCU-unsplash.jpg",
  "/products/_pool/simon-reza-DNEIasg9HaY-unsplash.jpg",
  "/products/_pool/the-nix-company-tR-fqLlBg5c-unsplash.jpg",
  "/products/_pool/tony-zheng-ozzyqRVqyQ0-unsplash.jpg",
  "/products/_pool/twinewood-studio-7ZaRKlsIK6w-unsplash.jpg",
  "/products/_pool/victoria-priessnitz-UR-0lB0sDTA-unsplash.jpg",
];

function getSeriesKey(imagePath: string) {
  const file = imagePath.split("/").pop() ?? imagePath;
  const name = file.replace(/\.[^/.]+$/, "");
  const parts = name.split("-").filter(Boolean);

  // Unsplash-style filenames are usually: first-last-<id>-unsplash[<n>]
  // We group by the first two hyphen-delimited parts (photographer) so that
  // numbered series like ...unsplash1/2/3 stay together.
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : name;
}

function getSeriesIndex(imagePath: string) {
  const file = imagePath.split("/").pop() ?? imagePath;
  const match = file.match(/unsplash(\d+)\.[a-zA-Z0-9]+$/);
  if (!match) return 0;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : 0;
}

function buildImageSeries(images: string[]) {
  const seriesByKey = new Map<string, string[]>();
  images.forEach((img) => {
    const key = getSeriesKey(img);
    const series = seriesByKey.get(key) ?? [];
    series.push(img);
    seriesByKey.set(key, series);
  });

  const series = Array.from(seriesByKey.values());
  series.forEach((group) => {
    group.sort((a, b) => {
      const diff = getSeriesIndex(a) - getSeriesIndex(b);
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });
  });

  return series;
}

const productImageSeries = buildImageSeries(productImages);

const productNamesBySeriesKey: Record<string, string[]> = {
  "2h-media": ["Wireless Earbuds", "Noise-Cancelling Earbuds"],
  "andrej-lisakov": ["Cane Lounge Chair", "Woven Lounge Chair"],
  "andrey-matveev": ["Compact Speaker System", "Desktop Speaker Set"],
  "behnam-norouzi": ["Woodgrain Bookshelf Speaker", "Walnut Speaker"],
  "bundo-kim": ["Minimal Leather Watch", "Classic Leather Strap Watch"],
  "con-se": ["Floorstanding Speaker Pair", "Tower Speaker Set"],
  "curated-lifestyle": ["Hand Wash + Body Lotion Set", "Spa Therapy Essentials"],
  "daiga-ellaby": ["Aromatherapy Roller Set", "Room Spray + Roller Set"],
  "ela-de": ["Moisturizing Shampoo + Conditioner", "Hydrating Haircare Duo"],
  "george-dagerotip": ["Braided Rope Armchair", "Woven Accent Chair"],
  "getty-images": ["Minimal Speaker System", "Bookshelf Speaker Pair"],
  "james-lewis": ["Leather Chukka Boot", "Everyday Leather Boot"],
  "jose-m": ["Wicker Patio Chair Set", "Outdoor Bistro Chair"],
  "jsb-co": ["Rope Hanging Swing", "Hanging Swing Seat"],
  "karolina-grabowska": ["Minimal Ceramic Vase", "Stoneware Vase"],
  "lasse-jensen": ["Smartwatch — Leather Strap", "Smartwatch — Minimal"],
  "matus-gocman": ["Smartwatch Charging Stand", "Desk Tech Essentials"],
  "mitchell-luo": ["Textured Oxford Shoe", "Navy Lace-Up Derby"],
  "mockup-free": ["Skincare Starter Set", "Daily Skincare Essentials"],
  "pablo-merchan": ["Chunky Knit Throw", "Textured Knit Blanket"],
  "planet-volumes": ["Modern Sofa", "Minimal Living Room"],
  "polina-kuzovkova": ["Minimal Lounge Chair", "Modern Lounge Chair"],
  "sayan-majhi": ["Smartwatch — Leather Strap", "Smartwatch — Everyday"],
  "simon-reza": ["Brown Leather Sneaker", "Everyday Leather Trainer"],
  "the-nix": ["Grooming Essentials Set", "All-Over Wash + Toner Set"],
  "tony-zheng": ["Compact Home Speaker", "Bluetooth Speaker"],
  "twinewood-studio": ["Vanity Essentials", "Everyday Skincare Set"],
  "victoria-priessnitz": ["Ankle-Strap Sandal", "Minimal Strap Sandal"],
};

const categoryOverridesBySeriesKey: Record<
  string,
  {
    category: string;
    subcategory: string;
  }
> = {
  // Tech / audio
  "2h-media": { category: "Accessories", subcategory: "Tech" },
  "andrey-matveev": { category: "Home & Living", subcategory: "Electronics" },
  "behnam-norouzi": { category: "Home & Living", subcategory: "Electronics" },
  "con-se": { category: "Home & Living", subcategory: "Electronics" },
  "getty-images": { category: "Home & Living", subcategory: "Electronics" },
  "tony-zheng": { category: "Home & Living", subcategory: "Electronics" },

  // Beauty / grooming
  "curated-lifestyle": { category: "Beauty", subcategory: "Body" },
  "daiga-ellaby": { category: "Beauty", subcategory: "Fragrance" },
  "ela-de": { category: "Beauty", subcategory: "Hair" },
  "mockup-free": { category: "Beauty", subcategory: "Skincare" },
  "the-nix": { category: "Beauty", subcategory: "Body" },
  "twinewood-studio": { category: "Beauty", subcategory: "Skincare" },

  // Apparel / footwear
  "james-lewis": { category: "Apparel", subcategory: "Footwear" },
  "mitchell-luo": { category: "Apparel", subcategory: "Footwear" },
  "simon-reza": { category: "Apparel", subcategory: "Footwear" },
  "victoria-priessnitz": { category: "Apparel", subcategory: "Footwear" },

  // Home / furniture + decor
  "andrej-lisakov": { category: "Home & Living", subcategory: "Furniture" },
  "george-dagerotip": { category: "Home & Living", subcategory: "Furniture" },
  "planet-volumes": { category: "Home & Living", subcategory: "Furniture" },
  "polina-kuzovkova": { category: "Home & Living", subcategory: "Furniture" },
  "karolina-grabowska": { category: "Home & Living", subcategory: "Decor" },
  "pablo-merchan": { category: "Home & Living", subcategory: "Bedding" },

  // Outdoor living
  "jose-m": { category: "Outdoors", subcategory: "Outdoor Living" },
  "jsb-co": { category: "Outdoors", subcategory: "Outdoor Living" },

  // Wearables
  "bundo-kim": { category: "Accessories", subcategory: "Tech" },
  "lasse-jensen": { category: "Accessories", subcategory: "Tech" },
  "matus-gocman": { category: "Accessories", subcategory: "Tech" },
  "sayan-majhi": { category: "Accessories", subcategory: "Tech" },
};

const categorySubcategories: Record<string, string[]> = {
  "Home & Living": [
    "Bedding",
    "Kitchen",
    "Decor",
    "Bath",
    "Lighting",
    "Organization",
  ],
  Apparel: ["Tops", "Bottoms", "Outerwear", "Loungewear", "Knitwear"],
  Beauty: ["Skincare", "Body", "Hair", "Fragrance"],
  Outdoors: ["Camping", "Hiking", "Travel", "Water"],
  Pet: ["Toys", "Grooming", "Leashes", "Beds"],
  Kids: ["Play", "Nursery", "Apparel", "Books"],
  Food: ["Pantry", "Snacks", "Tea", "Spice"],
  Accessories: ["Jewelry", "Bags", "Wallets", "Hats"],
  Wellness: ["Supplements", "Sleep", "Mindfulness", "Recovery"],
};

const nameByCategory: Record<string, string[]> = {
  "Home & Living": [
    "Washed Linen Throw",
    "Stoneware Mug Set",
    "Acacia Serving Board",
    "Cotton Bath Towel",
    "Glass Oil Cruet",
    "Hand-poured Candle",
    "Wool Felt Coasters",
    "Rattan Catchall Tray",
    "Ceramic Incense Holder",
  ],
  Apparel: [
    "Relaxed Cotton Tee",
    "Ribbed Tank",
    "Canvas Work Jacket",
    "Relaxed Chino Pant",
    "Soft Knit Cardigan",
    "Merino Beanie",
    "Linen Lounge Short",
    "Brushed Fleece Hoodie",
  ],
  Beauty: [
    "Rosewater Cleanser",
    "Nourishing Face Oil",
    "Mineral Sunscreen",
    "Silk Body Lotion",
    "Scalp Reset Serum",
    "Botanical Shampoo",
    "Soft Neroli Mist",
  ],
  Outdoors: [
    "Trail Daypack",
    "Insulated Bottle",
    "Compact Camp Towel",
    "Pocket Headlamp",
    "Ultralight Cook Kit",
    "Packable Wind Shell",
    "River Sandals",
  ],
  Pet: [
    "Wool Rope Tug",
    "Everyday Leash",
    "Soft Bristle Brush",
    "Travel Water Bowl",
    "Calming Bandana",
    "Machine-washable Bed",
  ],
  Kids: [
    "Wooden Stacking Rings",
    "Soft Blocks Set",
    "Storybook Bundle",
    "Coloring Roll",
    "Mini Apron",
    "Play Dough Kit",
  ],
  Food: [
    "Smoked Sea Salt Trio",
    "Stoneground Granola",
    "Citrus Marmalade",
    "Olive Oil Tin",
    "Herbal Tea Blend",
    "Dark Chocolate Bites",
    "Chili Crunch",
  ],
  Accessories: [
    "Hand-stitched Card Case",
    "Minimal Leather Tote",
    "Everyday Hoop Earrings",
    "Woven Bucket Hat",
    "Silk Scarf",
    "Braided Keychain",
  ],
  Wellness: [
    "Magnesium Capsules",
    "Sleep Tea",
    "Breathwork Cards",
    "Muscle Balm",
    "Adaptogen Blend",
    "Aromatherapy Roller",
  ],
};

const leafByCategory: Record<string, string[]> = {
  Beauty: ["Cedar", "Unscented", "Rose", "Bergamot", "Sensitive"],
  Food: ["Spicy", "Classic", "Citrus", "Smoky", "Sea Salt"],
  Wellness: ["Night", "Daily", "Calm", "Restore", "Focus"],
  Apparel: ["Stone", "Ink", "Sage", "Oat", "Clay"],
  Outdoors: ["Alpine", "Coastal", "Desert", "Forest"],
  Accessories: ["Brass", "Sterling", "Black", "Natural"],
  "Home & Living": ["Natural", "Ivory", "Charcoal", "Sage"],
  Kids: ["Sand", "Cloud", "Sprout"],
  Pet: ["Cedar", "Oat"],
};

const descriptionByCategory: Record<string, string[]> = {
  "Home & Living": [
    "A warm, tactile piece designed to make your space feel lived-in—never busy.",
    "Subtle texture, soft edges, and a finish that looks better with time.",
    "An everyday essential with an editorial silhouette and durable materials.",
  ],
  Apparel: [
    "Relaxed fit, clean lines, and fabric that holds its shape without feeling stiff.",
    "A staple you’ll reach for on repeat—easy, breathable, and quietly refined.",
    "Designed for layering with a finish that reads elevated but never loud.",
  ],
  Beauty: [
    "Gentle, effective, and designed to look as good on your shelf as it feels on skin.",
    "A lightweight formula with a balanced finish—made for daily use.",
    "Clean ingredients with a soft scent and an understated, modern texture.",
  ],
  Outdoors: [
    "Built for the pack: lightweight, durable, and ready for early starts.",
    "Practical details with a minimalist look—made to travel well.",
    "Trail-tested performance with a calm, considered design.",
  ],
  Pet: [
    "Comfort-forward and durable—made for daily walks and lazy afternoons.",
    "A simple upgrade that feels good in hand and holds up over time.",
    "Soft where it matters, sturdy where it counts.",
  ],
  Kids: [
    "Designed for curious hands, with materials that can take real play.",
    "Simple shapes, warm colors, and a build that lasts beyond one season.",
    "A playroom favorite with a clean, modern aesthetic.",
  ],
  Food: [
    "Small-batch flavor that elevates the basics without overpowering them.",
    "Balanced, bright, and made to disappear quickly in a well-loved kitchen.",
    "A pantry staple with clean ingredients and a soft, nostalgic note.",
  ],
  Accessories: [
    "Made with thoughtful proportions and a finish that wears beautifully.",
    "An understated piece that sharpens any outfit without trying too hard.",
    "Clean hardware, durable materials, and an easy, everyday feel.",
  ],
  Wellness: [
    "A gentle daily support designed to layer seamlessly into your routine.",
    "Calm, measured, and designed to feel like a small reset.",
    "A quiet ritual that helps you wind down and recharge.",
  ],
};

function prng(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

function getPrice(category: string, seed: number) {
  const r = prng(seed);
  const ranges: Record<string, [number, number]> = {
    "Home & Living": [18, 140],
    Apparel: [22, 180],
    Beauty: [14, 96],
    Outdoors: [16, 220],
    Pet: [10, 140],
    Kids: [12, 120],
    Food: [8, 68],
    Accessories: [18, 240],
    Wellness: [12, 110],
  };
  const [min, max] = ranges[category] ?? [12, 120];
  const raw = min + (max - min) * r;
  const rounded = Math.round(raw / 2) * 2;
  return clamp(rounded, min, max);
}

function getRating(seed: number) {
  const r = prng(seed);
  const raw = 3.2 + r * 1.8;
  const half = Math.round(raw * 2) / 2;
  return clamp(half, 0, 5);
}

function getRatingCount(seed: number) {
  const r = prng(seed);
  const base = 18 + Math.floor(r * 1500);
  return base;
}

function getImages(seed: number) {
  const count = 2 + (seed % 3);
  const series = productImageSeries[seed % productImageSeries.length] ?? productImages;
  const start = seed % series.length;
  const images: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const next = series[(start + i) % series.length];
    if (next && !images.includes(next)) images.push(next);
  }

  // If the selected series is smaller than the desired count, fill deterministically
  // from the global pool.
  if (images.length < count) {
    const fallbackStart = (seed * 7) % productImages.length;
    for (let i = 0; images.length < count && i < productImages.length; i += 1) {
      const next = productImages[(fallbackStart + i) % productImages.length];
      if (next && !images.includes(next)) images.push(next);
    }
  }

  return images;
}

function getLeaf(category: string, seed: number) {
  const options = leafByCategory[category];
  if (!options) return undefined;
  return prng(seed) > 0.55 ? pick(options, seed) : undefined;
}

function getDescription(category: string, seed: number) {
  const options = descriptionByCategory[category] ?? [
    "A refined essential with durable materials and a quiet finish.",
  ];
  return pick(options, seed);
}

function buildProducts(): Product[] {
  const products: Product[] = [];
  let index = 0;

  mockBrands.forEach((brand, brandIndex) => {
    const count = 6 + (brandIndex < 12 ? 1 : 0);

    for (let i = 0; i < count; i += 1) {
      const defaultCategory = brand.categories[i % brand.categories.length];
      const defaultSubcategories = categorySubcategories[defaultCategory] ?? ["Essentials"];
      const defaultSubcategory = pick(defaultSubcategories, i + brandIndex);
      const images = getImages(index + 3);
      const seriesKey = images[0] ? getSeriesKey(images[0]) : "";
      const nameOverrides = productNamesBySeriesKey[seriesKey];

      const categoryOverride = categoryOverridesBySeriesKey[seriesKey];
      const category = categoryOverride?.category ?? defaultCategory;
      const subcategory = categoryOverride?.subcategory ?? defaultSubcategory;

      const baseName = pick(nameByCategory[category] ?? ["Everyday Essential"], i + brandIndex * 3);
      const finalBaseName = nameOverrides
        ? pick(nameOverrides, i + brandIndex * 3)
        : baseName;
      const leaf = getLeaf(category, index + brandIndex * 11);

      const name = leaf ? `${finalBaseName} — ${leaf}` : finalBaseName;
      const price = getPrice(category, index + 10);

      products.push({
        id: `prod-${String(index + 1).padStart(3, "0")}`,
        brandId: brand.id,
        name,
        price,
        rating: getRating(index + 1),
        ratingCount: getRatingCount(index + 200),
        category,
        subcategory,
        leaf,
        images,
        isNew: prng(index + 7) > 0.72,
        description: getDescription(category, index + 1000),
      });

      index += 1;
    }
  });

  return products;
}

export const mockProducts: Product[] = buildProducts();
