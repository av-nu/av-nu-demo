import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "demo_master_visual_grouping_metadata_pass_1");
const ASSETS_PATH = path.join(SOURCE_DIR, "demo_master_assets_content_audited_pass_3.json");
const PRODUCTS_PATH = path.join(SOURCE_DIR, "demo_master_products_content_audited_pass_3.json");
const LINKED_PATH = path.join(SOURCE_DIR, "demo_master_assets_cloudinary-linked.json");
const REPORT_PATH = path.join(SOURCE_DIR, "cloudinary-sync-report.json");

const args = new Set(process.argv.slice(2));

async function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    try {
      const source = await readFile(path.join(ROOT, filename), "utf8");
      for (const line of source.split(/\r?\n/)) {
        const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!match || process.env[match[1]]) continue;
        process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function readRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function normalizeFilename(value) {
  return path
    .basename(value)
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePublicId(value) {
  return normalizeFilename(value.split("/").at(-1) ?? value);
}

function resourceKey(resourceType, publicId) {
  return `${resourceType}:${publicId}`;
}

function resourceFields(resource) {
  return {
    cloudinary_asset_id: resource.asset_id ?? null,
    cloudinary_public_id: resource.public_id ?? null,
    cloudinary_version: resource.version ?? null,
    cloudinary_resource_type: resource.resource_type ?? null,
    cloudinary_type: resource.type ?? null,
    cloudinary_format: resource.format ?? null,
    secure_url: resource.secure_url ?? null,
    width: resource.width ?? null,
    height: resource.height ?? null,
    bytes: resource.bytes ?? null,
    duration_seconds: resource.duration ?? null,
    cloudinary_created_at: resource.created_at ?? null,
  };
}

async function listAllResources(cloudName, apiKey, apiSecret, resourceType) {
  const resources = [];
  let nextCursor;
  const authorization = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;

  do {
    const url = new URL(`https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload`);
    url.searchParams.set("max_results", "500");
    if (nextCursor) url.searchParams.set("next_cursor", nextCursor);

    const response = await fetch(url, { headers: { Authorization: authorization } });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`Cloudinary ${resourceType} request failed (${response.status}): ${detail}`);
    }

    const result = await response.json();
    resources.push(...(result.resources ?? []));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  return resources.map((resource) => ({
    ...resource,
    resource_type: resource.resource_type ?? resourceType,
  }));
}

function metadataSummary(assets, products) {
  const assetTypes = assets.reduce((counts, asset) => {
    counts[asset.asset_type] = (counts[asset.asset_type] ?? 0) + 1;
    return counts;
  }, {});
  const assetIds = new Set(assets.map((asset) => asset.id));
  const referencedAssetIds = new Set(
    products.flatMap((product) => [
      ...(product.image_asset_ids ?? []),
      ...(product.video_asset_ids ?? []),
    ]),
  );

  return {
    source_assets: assets.length,
    source_products: products.length,
    source_asset_types: assetTypes,
    source_public_ids_present: assets.filter((asset) => asset.cloudinary_public_id).length,
    source_asset_ids_referenced: referencedAssetIds.size,
    source_asset_references_missing: [...referencedAssetIds].filter((id) => !assetIds.has(id)).length,
  };
}

function matchAsset(asset, resourcesByKey, resourcesByType) {
  const resourceType = asset.asset_type;
  if (asset.cloudinary_public_id) {
    const exact = resourcesByKey.get(resourceKey(resourceType, asset.cloudinary_public_id));
    if (exact) return [exact];
  }

  const normalizedSource = normalizeFilename(asset.source_filename);
  return (resourcesByType.get(resourceType) ?? []).filter((resource) => {
    const normalizedPublicId = normalizePublicId(resource.public_id);
    return normalizedPublicId === normalizedSource || normalizedPublicId.startsWith(`${normalizedSource}-`);
  });
}

function linkAssets(assets, resources) {
  const resourcesByKey = new Map();
  const resourcesByType = new Map();

  for (const resource of resources) {
    const type = resource.resource_type;
    resourcesByKey.set(resourceKey(type, resource.public_id), resource);
    const typedResources = resourcesByType.get(type) ?? [];
    typedResources.push(resource);
    resourcesByType.set(type, typedResources);
  }

  const statusCounts = {};
  const unmatched = [];
  const ambiguous = [];
  const matchedResourceKeys = new Set();
  const linked = assets.map((asset) => {
    const matches = matchAsset(asset, resourcesByKey, resourcesByType);
    const status = matches.length === 1 ? "matched" : matches.length === 0 ? "unmatched" : "ambiguous";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;

    if (status === "unmatched") unmatched.push({ id: asset.id, source_filename: asset.source_filename, cloudinary_public_id: asset.cloudinary_public_id ?? null });
    if (status === "ambiguous") ambiguous.push({ id: asset.id, source_filename: asset.source_filename, cloudinary_public_id: asset.cloudinary_public_id ?? null, match_count: matches.length });
    if (status === "matched") matchedResourceKeys.add(resourceKey(matches[0].resource_type, matches[0].public_id));

    return {
      ...asset,
      ...(matches.length === 1 ? resourceFields(matches[0]) : {}),
      sync_status: status,
      match_count: matches.length,
    };
  });

  const unusedResources = resources
    .filter((resource) => !matchedResourceKeys.has(resourceKey(resource.resource_type, resource.public_id)))
    .map((resource) => ({
      resource_type: resource.resource_type,
      public_id: resource.public_id,
      asset_id: resource.asset_id ?? null,
      secure_url: resource.secure_url ?? null,
    }));

  return { linked, statusCounts, unmatched, ambiguous, unusedResources };
}

function printSummary(summary) {
  console.log(JSON.stringify(summary));
}

async function main() {
  await loadLocalEnv();
  const [assets, products] = await Promise.all([readJson(ASSETS_PATH), readJson(PRODUCTS_PATH)]);
  const summary = metadataSummary(assets, products);

  if (args.has("--metadata-only")) {
    printSummary(summary);
    return;
  }

  const cloudName = readRequiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = readRequiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = readRequiredEnv("CLOUDINARY_API_SECRET");
  const [images, videos] = await Promise.all([
    listAllResources(cloudName, apiKey, apiSecret, "image"),
    listAllResources(cloudName, apiKey, apiSecret, "video"),
  ]);
  const result = linkAssets(assets, [...images, ...videos]);
  const report = {
    generated_at: new Date().toISOString(),
    dry_run: !args.has("--apply"),
    cloudinary_resource_counts: { image: images.length, video: videos.length },
    source: summary,
    sync_status_counts: result.statusCounts,
    unmatched: result.unmatched,
    ambiguous: result.ambiguous,
    unused_cloudinary_resources: result.unusedResources,
    cloudinary_resource_samples: {
      image: images.slice(0, 10).map((resource) => resource.public_id),
      video: videos.slice(0, 10).map((resource) => resource.public_id),
    },
  };

  await mkdir(SOURCE_DIR, { recursive: true });
  await Promise.all([
    writeFile(LINKED_PATH, `${JSON.stringify(result.linked, null, 2)}\n`),
    writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`),
  ]);

  printSummary({
    dry_run: report.dry_run,
    cloudinary_resource_counts: report.cloudinary_resource_counts,
    source: report.source,
    sync_status_counts: report.sync_status_counts,
    unmatched_count: report.unmatched.length,
    ambiguous_count: report.ambiguous.length,
    unused_cloudinary_resource_count: report.unused_cloudinary_resources.length,
    output_files: [LINKED_PATH, REPORT_PATH],
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
