"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Heart, Search, Sparkles } from "lucide-react";

import { PostToolPanel } from "@/components/post/tools/PostToolPanel";
import { flattenPages } from "@/data/faves";
import { mockProducts, type Product } from "@/data/mockProducts";
import { useFaveLists } from "@/hooks/useFaveLists";
import { useFavorites } from "@/hooks/useFavorites";
import { getBrandById, getProductById } from "@/lib/data";
import { cn } from "@/lib/utils";

type Source = "faves" | "explore" | "search";

const EXPLORE_LIMIT = 40;
const SEARCH_LIMIT = 40;

/**
 * Product picker for the composer's "+" tool: pull from Faves, browse the
 * catalog, or search it. Selecting a product places it on the canvas, which is
 * what makes the post shoppable.
 */
export function AddProductTool({
  onAdd,
  onAddMany,
  tagsOnly = false,
  onClose,
}: {
  onAdd: (productId: string) => void;
  /** Adds a batch at once; linking several products is the common case. */
  onAddMany?: (productIds: string[]) => void;
  /** True when the page is a photo, where products are tagged rather than placed. */
  tagsOnly?: boolean;
  onClose: () => void;
}) {
  const { favorites } = useFavorites();
  const { lists } = useFaveLists();
  // Opening on an empty Faves tab is a poor first impression, so start on
  // Explore until the author has actually saved something.
  const hasFaves = favorites.length > 0 || lists.some((list) => list.productIds.length > 0 || flattenPages(list.pages).length > 0);
  const [source, setSource] = useState<Source>(hasFaves ? "faves" : "explore");
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);

  // Everything the user has saved: loose favourites plus every list.
  const faveProducts = useMemo(() => {
    const ids = new Set<string>(favorites);
    for (const list of lists) {
      list.productIds.forEach((id) => ids.add(id));
      flattenPages(list.pages).forEach((id) => ids.add(id));
    }
    return Array.from(ids).map((id) => getProductById(id)).filter(Boolean) as Product[];
  }, [favorites, lists]);

  const exploreProducts = useMemo(() => mockProducts.slice(0, EXPLORE_LIMIT), []);

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return mockProducts
      .filter((product) => {
        const brand = getBrandById(product.brandId)?.name ?? "";
        return (
          product.name.toLowerCase().includes(term)
          || brand.toLowerCase().includes(term)
          || product.category.toLowerCase().includes(term)
          || (product.subcategory ?? "").toLowerCase().includes(term)
        );
      })
      .slice(0, SEARCH_LIMIT);
  }, [query]);

  const products = source === "faves" ? faveProducts : source === "explore" ? exploreProducts : searchResults;

  const emptyMessage = source === "faves"
    ? "Nothing saved yet — browse the catalog to add products."
    : source === "search"
      ? query.trim() ? "No products match that search." : "Search the catalog by product, brand, or category."
      : "No products available.";

  return (
    <PostToolPanel
      title="Add products"
      onClose={onClose}
      actions={onAddMany && chosen.length > 0 ? (
        <button
          type="button"
          onClick={() => { onAddMany(chosen); setChosen([]); }}
          className="inline-flex h-8 shrink-0 items-center rounded-full bg-navy px-3 text-[11px] font-semibold text-white transition-colors hover:bg-navy/90"
        >
          Add {chosen.length}
        </button>
      ) : undefined}
    >
      <p className="mb-2 text-[11px] leading-relaxed text-midnight/50">
        {tagsOnly
          ? "Tags products onto the photo. Tagged products show in the post's shop row."
          : "Places the product's imagery on the canvas and tags it, so it shows in the post's shop row."}
      </p>
      <div className="mb-3 flex gap-2">
        <SourceTab active={source === "faves"} onClick={() => setSource("faves")} icon={<Heart className="h-3.5 w-3.5" />}>
          Faves
        </SourceTab>
        <SourceTab active={source === "explore"} onClick={() => setSource("explore")} icon={<Sparkles className="h-3.5 w-3.5" />}>
          Explore
        </SourceTab>
        <SourceTab active={source === "search"} onClick={() => setSource("search")} icon={<Search className="h-3.5 w-3.5" />}>
          Search
        </SourceTab>
      </div>

      {source === "search" && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-midnight/40" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, brands, categories…"
            className="h-10 w-full rounded-xl border border-divider/70 bg-surface/40 pl-9 pr-3 text-sm text-midnight placeholder:text-midnight/40 focus:border-accent/50 focus:outline-none"
          />
        </div>
      )}

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-divider/70 px-3 py-6 text-center text-xs text-midnight/50">
          {emptyMessage}
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {products.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => {
                  if (!onAddMany) {
                    onAdd(product.id);
                    return;
                  }
                  setChosen((current) => (current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id]));
                }}
                aria-pressed={chosen.includes(product.id)}
                className="group block w-full text-left"
                title={product.name}
              >
                <span className={cn(
                  "relative block aspect-square overflow-hidden rounded-xl border bg-surface transition-colors",
                  chosen.includes(product.id) ? "border-navy ring-2 ring-navy" : "border-divider/60 group-hover:border-accent",
                )}>
                  <Image src={product.images[0]} alt={product.name} fill sizes="120px" className="object-cover" />
                  {chosen.includes(product.id) && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
                      {chosen.indexOf(product.id) + 1}
                    </span>
                  )}
                </span>
                <span className="mt-1 block truncate text-[10px] font-medium text-midnight/70">{product.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PostToolPanel>
  );
}

function SourceTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
        active ? "border-navy bg-navy text-white" : "border-divider/70 text-midnight/65 hover:border-midnight/30",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
