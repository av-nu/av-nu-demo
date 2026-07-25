import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "demo_master_visual_grouping_metadata_pass_1");
const PRODUCTS_PATH = path.join(SOURCE_DIR, "demo_master_products_content_audited_pass_3.json");
const LINKED_ASSETS_PATH = path.join(SOURCE_DIR, "demo_master_assets_cloudinary-linked.json");
const MAPPING_PATH = path.join(ROOT, "scripts/merchant-brand-map.json");
const OUTPUT_PATH = path.join(ROOT, "src/data/seedProducts.ts");

function categoryFor(product) {
  if (product.category === "Jewelry") return { category: "Accessories", subcategory: "Jewelry" };
  if (product.category === "Shoes") return { category: "Apparel", subcategory: "Footwear" };
  return {
    category: product.category,
    subcategory: product.subcategory || product.product_type || "Essentials",
  };
}

function bySortOrder(a, b) {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0);
}

function displayProductName(product) {
  const sourceName = product.name?.trim() || product.handle || product.id;
  const cleanedName = sourceName
    .replace(/\bcamel\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([-/])/g, "$1")
    .replace(/([-/])\s+/g, "$1 ")
    .replace(/^[-–—]\s*|\s*[-–—]$/g, "")
    .trim();
  return cleanedName || product.handle || product.id;
}

function uniqueProductName(product, nameCounts) {
  const baseName = displayProductName(product);
  if ((nameCounts.get(baseName) ?? 0) <= 1) return baseName;
  const suffix = product.handle?.split("-").at(-1) || product.id;
  return `${baseName} · ${suffix}`;
}

function buildMediaIndex(assets) {
  const byProduct = new Map();
  for (const asset of assets) {
    if (asset.sync_status !== "matched" || !asset.secure_url) {
      throw new Error(`Asset ${asset.id} is not matched or has no secure URL`);
    }
    const productAssets = byProduct.get(asset.product_id) ?? [];
    productAssets.push(asset);
    byProduct.set(asset.product_id, productAssets);
  }
  return byProduct;
}

function toAppProduct(product, mapping, mediaByProduct, nameCounts) {
  const brand = mapping[product.merchant];
  if (!brand?.brandId) throw new Error(`No brand mapping for merchant: ${product.merchant}`);

  const media = (mediaByProduct.get(product.id) ?? []).sort(bySortOrder);
  const images = media.filter((asset) => asset.asset_type === "image");
  const videos = media.filter((asset) => asset.asset_type === "video");
  if (images.length === 0) throw new Error(`Product ${product.id} has no matched image assets`);

  const category = categoryFor(product);
  return {
    id: product.id,
    brandId: brand.brandId,
    name: uniqueProductName(product, nameCounts),
    price: Number(product.price) || 0,
    rating: 4.5,
    ratingCount: 0,
    category: category.category,
    subcategory: category.subcategory,
    leaf: product.product_type || undefined,
    images: images.map((asset) => asset.secure_url),
    videos: videos.map((asset) => asset.secure_url),
    imageAssetIds: images.map((asset) => asset.id),
    videoAssetIds: videos.map((asset) => asset.id),
    cloudinaryImagePublicIds: images.map((asset) => asset.cloudinary_public_id),
    cloudinaryVideoPublicIds: videos.map((asset) => asset.cloudinary_public_id),
    isNew: false,
    description: product.description,
    merchant: product.merchant,
    handle: product.handle,
    collection: product.collection,
    productType: product.product_type,
    currency: product.currency,
    colors: product.colors,
    materials: product.materials,
    sizes: product.sizes,
    styleTags: product.style_tags,
    occasionTags: product.occasion_tags,
    moodTags: product.mood_tags,
    searchTags: product.search_tags,
    recommendationTags: product.recommendation_tags,
  };
}

async function main() {
  const [products, assets, mapping] = await Promise.all([
    readFile(PRODUCTS_PATH, "utf8").then(JSON.parse),
    readFile(LINKED_ASSETS_PATH, "utf8").then(JSON.parse),
    readFile(MAPPING_PATH, "utf8").then(JSON.parse),
  ]);
  const mediaByProduct = buildMediaIndex(assets);
  const nameCounts = products.reduce((counts, product) => {
    const name = displayProductName(product);
    counts.set(name, (counts.get(name) ?? 0) + 1);
    return counts;
  }, new Map());
  const appProducts = products.map((product) => toAppProduct(product, mapping, mediaByProduct, nameCounts));
  const source = JSON.stringify(appProducts).replaceAll("`", "\\`");
  const output = `import type { Product } from "@/data/mockProducts";\n\nexport const seedProducts: Product[] = JSON.parse(String.raw\`${source}\`) as Product[];\n`;
  await writeFile(OUTPUT_PATH, output);
  console.log(JSON.stringify({
    generated_products: appProducts.length,
    generated_images: appProducts.reduce((count, product) => count + product.images.length, 0),
    generated_videos: appProducts.reduce((count, product) => count + product.videos.length, 0),
    output_file: OUTPUT_PATH,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
