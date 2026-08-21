export const BRAND_FILTER_GROUPS = [
  {
    id: "ownership",
    label: "Ownership & Identity",
    color: "bg-accent",
    options: ["Women-Owned", "Black-Owned", "AAPI-Owned", "Hispanic/Latino-Owned", "Indigenous-Owned", "LGBTQ+-Owned", "Veteran-Owned", "Disability-Owned"],
  },
  {
    id: "made",
    label: "Made & Sourced",
    color: "bg-guide",
    options: ["Made in USA", "Handmade", "Small Batch", "Recycled Materials", "Upcycled Materials", "Organic Materials"],
  },
  {
    id: "values",
    label: "Values",
    color: "bg-list",
    options: ["Gives Back", "Sustainable Practices", "Cruelty-Free", "Vegan", "Ethical Production", "Low-Waste", "Responsible Packaging"],
  },
  {
    id: "categories",
    label: "Categories",
    color: "bg-navy",
    options: ["Accessories", "Apparel", "Beauty", "Food", "Jewelry", "Wellness"],
  },
] as const;

export type BrandFilterGroupId = (typeof BRAND_FILTER_GROUPS)[number]["id"];
export type BrandFilterMetadata = Record<BrandFilterGroupId, string[]>;
export type SelectedBrandFilters = Partial<Record<BrandFilterGroupId, string[]>>;

export function brandMatchesFilters(metadata: BrandFilterMetadata, selected: SelectedBrandFilters) {
  return (Object.entries(selected) as Array<[BrandFilterGroupId, string[] | undefined]>).every(([group, values]) => {
    if (!values || values.length === 0) return true;
    if (group === "categories") return values.some((value) => metadata[group].includes(value));
    return values.every((value) => metadata[group].includes(value));
  });
}
