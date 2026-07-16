import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "Product Data"
ASSET_SOURCE = DATA_ROOT / "women fashion"
ASSET_DEST = ROOT / "public/products/women-fashion"
OUTPUT = ROOT / "src/data/seedProducts.ts"


def clean_text(value):
    return re.sub(r"\s+", " ", str(value or "").strip())


def safe_price(value, fallback):
    try:
        number = float(value)
        return round(number, 2) if number >= 0 else fallback
    except (TypeError, ValueError):
        return fallback


def safe_rating(value, fallback=4.2):
    try:
        number = float(value)
        return min(5, max(0, round(number, 1)))
    except (TypeError, ValueError):
        return fallback


def safe_count(value, fallback=0):
    try:
        return max(0, int(float(value)))
    except (TypeError, ValueError):
        return fallback


def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", clean_text(value).lower()).strip("-")[:72] or "item"


def fashion_subcategory(text):
    value = text.lower()
    if any(term in value for term in ["dress", "gown", "saree", "anarkali"]):
        return "Dresses"
    if any(term in value for term in ["shirt", "top", "blouse", "jacket", "blazer", "cardigan"]):
        return "Tops"
    if any(term in value for term in ["trouser", "pant", "short", "skirt"]):
        return "Bottoms"
    if any(term in value for term in ["shoe", "sandal", "boot"]):
        return "Footwear"
    if any(term in value for term in ["bag", "tote", "purse"]):
        return "Bags"
    return "Apparel"



def build_products():
    products = []

    with (DATA_ROOT / "archive (2)" / "makeup_data.json").open(encoding="utf-8") as handle:
        for row in json.load(handle):
            name = clean_text(row.get("name")) or "Beauty essential"
            product_type = clean_text(row.get("product_type") or row.get("category")) or "Beauty"
            image = clean_text(row.get("api_featured_image") or row.get("image_link"))
            if image.startswith("//"):
                image = f"https:{image}"
            if image == "/images/original/missing.png":
                image = "/products/_pool/mockup-free-BBUbUMxC_rc-unsplash.jpg"
            products.append({
                "id": f"makeup-{slug(row.get('id'))}",
                "brandId": "velvet-fern",
                "name": name,
                "price": safe_price(row.get("price"), 24),
                "rating": safe_rating(row.get("rating")),
                "ratingCount": 0,
                "category": "Beauty",
                "subcategory": product_type.replace("_", " ").title(),
                "leaf": clean_text(row.get("brand")) or None,
                "images": [image],
                "isNew": False,
                "description": clean_text(row.get("description")) or f"A considered {product_type.replace('_', ' ')} essential for everyday routines.",
            })

    ASSET_DEST.mkdir(parents=True, exist_ok=True)
    for source in sorted(ASSET_SOURCE.iterdir(), key=lambda item: item.name.lower()):
        if not source.is_file() or source.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue
        shutil.copy2(source, ASSET_DEST / source.name)
        name = clean_text(source.stem.replace("-", " "))
        products.append({
            "id": f"fashion-{slug(source.stem)}",
            "brandId": "wildflower-studio",
            "name": name.title(),
            "price": 48,
            "rating": 4.6,
            "ratingCount": 24,
            "category": "Apparel",
            "subcategory": fashion_subcategory(name),
            "images": [f"/products/women-fashion/{source.name}"],
            "isNew": True,
            "description": "A statement fashion piece from the new women’s fashion collection.",
        })

    return products


products = build_products()
with OUTPUT.open("w", encoding="utf-8") as handle:
    handle.write('import type { Product } from "@/data/mockProducts";\n\n')
    handle.write("export const seedProducts: Product[] = JSON.parse(String.raw`")
    json.dump(products, handle, ensure_ascii=False, separators=(",", ":"))
    handle.write("`) as Product[];\n")

print(f"Generated {len(products)} products at {OUTPUT}")
print(f"Copied {len(list(ASSET_DEST.iterdir()))} local fashion images to {ASSET_DEST}")
