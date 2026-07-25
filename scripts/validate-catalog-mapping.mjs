import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "demo_master_visual_grouping_metadata_pass_1");
const PRODUCTS_PATH = path.join(SOURCE_DIR, "demo_master_products_content_audited_pass_3.json");
const BRANDS_PATH = path.join(ROOT, "src/data/mockBrands.ts");
const MAP_PATH = path.join(ROOT, "scripts/merchant-brand-map.json");
const REPORT_PATH = path.join(SOURCE_DIR, "catalog-brand-mapping-report.json");

function brandIdsFromSource(source) {
  return [...source.matchAll(/\bid:\s*["']([^"']+)["']/g)].map((match) => match[1]);
}

async function main() {
  const [products, brandsSource, mapping] = await Promise.all([
    readFile(PRODUCTS_PATH, "utf8").then(JSON.parse),
    readFile(BRANDS_PATH, "utf8"),
    readFile(MAP_PATH, "utf8").then(JSON.parse),
  ]);
  const validBrandIds = new Set(brandIdsFromSource(brandsSource));
  const merchantCounts = {};
  const unmappedMerchants = [];
  const invalidBrandIds = [];

  for (const product of products) {
    merchantCounts[product.merchant] = (merchantCounts[product.merchant] ?? 0) + 1;
  }

  for (const merchant of Object.keys(merchantCounts)) {
    const entry = mapping[merchant];
    if (!entry) {
      unmappedMerchants.push(merchant);
      continue;
    }
    if (!validBrandIds.has(entry.brandId)) invalidBrandIds.push({ merchant, brandId: entry.brandId });
  }

  const report = {
    generated_at: new Date().toISOString(),
    product_count: products.length,
    merchant_count: Object.keys(merchantCounts).length,
    merchant_counts: merchantCounts,
    mapping,
    valid_existing_brand_ids: [...validBrandIds],
    unmapped_merchants: unmappedMerchants,
    invalid_brand_ids: invalidBrandIds,
    status: unmappedMerchants.length === 0 && invalidBrandIds.length === 0 ? "ready_for_review" : "blocked",
  };

  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    status: report.status,
    product_count: report.product_count,
    merchant_count: report.merchant_count,
    unmapped_merchants: report.unmapped_merchants.length,
    invalid_brand_ids: report.invalid_brand_ids.length,
    report_file: REPORT_PATH,
  }));

  if (report.status === "blocked") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
