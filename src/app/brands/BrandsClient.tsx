"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { motion } from "framer-motion";

import { BrandWindow } from "@/components/brand/BrandWindow";
import type { BrandAttribute, WindowProductPhoto } from "@/lib/data";
import { brandMatchesFilters, BRAND_FILTER_GROUPS, type BrandFilterGroupId, type BrandFilterMetadata, type SelectedBrandFilters } from "@/lib/brandFilters";
import type { Brand } from "@/data/mockBrands";

export type BrandWindowData = {
  brand: Brand;
  averageRating: number;
  productCount: number;
  heroImage: string;
  products: WindowProductPhoto[];
  attributes: BrandAttribute[];
  filters: BrandFilterMetadata;
};

export function BrandsClient({ windows }: { windows: BrandWindowData[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<BrandFilterGroupId>();
  const [selected, setSelected] = useState<SelectedBrandFilters>({});

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return windows.filter((window) => {
      if (query && !window.brand.name.toLowerCase().includes(query)) return false;
      return brandMatchesFilters(window.filters, selected);
    });
  }, [searchQuery, selected, windows]);

  const selectedCount = Object.values(selected).reduce((count, values) => count + (values?.length ?? 0), 0);
  const activeGroupData = BRAND_FILTER_GROUPS.find((group) => group.id === activeGroup);

  const toggleFilter = (group: BrandFilterGroupId, value: string) => {
    setSelected((current) => {
      const values = current[group] ?? [];
      const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
      const next = { ...current };
      if (nextValues.length === 0) delete next[group];
      else next[group] = nextValues;
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelected({});
    setActiveGroup(undefined);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-8">
      <header className="pt-3 sm:pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Meet the makers</p>
        <h1 className="mt-2 font-headline text-3xl tracking-tight text-text sm:text-4xl">Discover brands</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text/60">Find independent brands by what they make, what they stand for, or just explore.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text/40" />
        <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search brands by name…" className="h-12 w-full rounded-2xl border border-divider/60 bg-bg/80 pl-12 pr-4 text-text placeholder:text-text/40 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      </div>

      <section aria-label="Brand filters" className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {BRAND_FILTER_GROUPS.map((group) => {
            const count = selected[group.id]?.length ?? 0;
            const active = activeGroup === group.id;
            return (
              <button key={group.id} type="button" onClick={() => setActiveGroup(active ? undefined : group.id)} aria-expanded={active} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${active ? `${group.color} border-transparent text-white` : "border-divider/70 bg-surface/40 text-text/65 hover:bg-surface"}`}>
                {group.label}
                {count > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20" : `${group.color} text-white`}`}>{count}</span>}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${active ? "rotate-180" : ""}`} />
              </button>
            );
          })}
        </div>

        {activeGroupData && (
          <div className={`rounded-2xl border border-divider/60 p-3 ${activeGroupData.id === "ownership" ? "bg-accent/5" : activeGroupData.id === "made" ? "bg-guide/5" : activeGroupData.id === "values" ? "bg-list/5" : "bg-navy/5"}`}>
            <div className="flex flex-wrap gap-2">
              {activeGroupData.options.map((option) => {
                const isSelected = selected[activeGroupData.id]?.includes(option) ?? false;
                return <button key={option} type="button" onClick={() => toggleFilter(activeGroupData.id, option)} aria-pressed={isSelected} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${isSelected ? `${activeGroupData.color} border-transparent text-white` : "border-divider/70 bg-bg/80 text-text/65 hover:border-text/30 hover:text-text"}`}>{option}</button>;
              })}
            </div>
          </div>
        )}

        {(selectedCount > 0 || searchQuery) && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"><X className="h-3.5 w-3.5" />Clear filters</button>}
      </section>

      <p className="text-sm text-text/50">{filtered.length} brand{filtered.length === 1 ? "" : "s"}{searchQuery && ` matching “${searchQuery}”`}</p>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
          <p className="text-text/50">No brands match those filters.</p>
          <button type="button" onClick={clearFilters} className="mt-2 text-sm text-accent hover:underline">Clear filters</button>
        </motion.div>
      ) : (
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2">
          {filtered.map((window, index) => <BrandWindow key={window.brand.id} brand={window.brand} averageRating={window.averageRating} productCount={window.productCount} heroImage={window.heroImage} products={window.products} attributes={window.attributes} priority={index < 2} />)}
        </div>
      )}
    </div>
  );
}
