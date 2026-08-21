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
import { useRequireAuth } from "@/components/auth/AccountInvitationDialog";

type Source = "explore" | "faves";

const EXPLORE_LIMIT = 40;

/**
 * Product picker for the composer's "+" tool: browse Explore or Favorites and
 * search the catalog. Selecting a product places it on the canvas, which is what
 * makes the post shoppable.
 */
export function AddProductTool({
  onAdd,
  onAddMany,
  tagsOnly = false,
  variant = "bottom",
  onClose,
}: {
  onAdd: (productId: string) => void;
  /** Adds a batch at once; linking several products is the common case. */
  onAddMany?: (productIds: string[]) => void;
  /** True when the page is a photo, where products are tagged rather than placed. */
  tagsOnly?: boolean;
  variant?: "bottom" | "rail";
  onClose: () => void;
}) {
  const { favorites } = useFavorites();
  const { lists } = useFaveLists();
  const { requireAuth, invitation } = useRequireAuth();
  const [source, setSource] = useState<Source>("explore");
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

  const exploreProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    const catalog = term ? mockProducts : mockProducts.slice(0, EXPLORE_LIMIT);
    if (!term) return catalog;
    return catalog.filter((product) => {
      const brand = getBrandById(product.brandId)?.name ?? "";
      return product.name.toLowerCase().includes(term)
        || brand.toLowerCase().includes(term)
        || product.category.toLowerCase().includes(term)
        || (product.subcategory ?? "").toLowerCase().includes(term);
    }).slice(0, EXPLORE_LIMIT);
  }, [query]);

  const products = source === "faves" ? faveProducts : exploreProducts;

  const emptyMessage = source === "faves"
    ? "Nothing saved yet — browse Explore to add products."
    : query.trim() ? "No products match that search." : "No products available.";

  return (
    <>
        <PostToolPanel
        title="Add products"
        variant={variant}
        onClose={onClose}
      actions={onAddMany && chosen.length > 0 ? (
        <button
          type="button"
          onClick={() => { requireAuth("add products to your post", () => { onAddMany(chosen); setChosen([]); }); }}
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
        <SourceTab active={source === "explore"} onClick={() => setSource("explore")} icon={<Sparkles className="h-3.5 w-3.5" />}>
          Explore
        </SourceTab>
        <SourceTab active={source === "faves"} onClick={() => setSource("faves")} icon={<Heart className="h-3.5 w-3.5" />}>
          Favorites
        </SourceTab>
      </div>

      {source === "explore" && (
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
        <ul className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => {
                  requireAuth("add a product to your post", () => {
                    if (!onAddMany) {
                      onAdd(product.id);
                      return;
                    }
                    setChosen((current) => (current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id]));
                  });
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
      {invitation}
    </>
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
