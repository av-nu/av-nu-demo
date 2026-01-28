"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

import type { Brand } from "@/data/mockBrands";
import { BrandCard } from "@/components/brand/BrandCard";

export function BrandsClient({ brands }: { brands: Brand[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;

    const query = searchQuery.toLowerCase();
    return brands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(query) ||
        brand.tagline.toLowerCase().includes(query) ||
        brand.location.toLowerCase().includes(query) ||
        brand.categories.some((cat) => cat.toLowerCase().includes(query)),
    );
  }, [brands, searchQuery]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    brands.forEach((brand) => brand.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [brands]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search brands by name, category, or location..."
          className="h-12 w-full rounded-xl border border-divider/50 bg-surface/50 pl-12 pr-4 text-text placeholder:text-text/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            !searchQuery
              ? "bg-accent text-white"
              : "bg-surface/50 text-text/60 hover:bg-surface hover:text-text"
          }`}
        >
          All
        </button>
        {allCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSearchQuery(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              searchQuery.toLowerCase() === cat.toLowerCase()
                ? "bg-accent text-white"
                : "bg-surface/50 text-text/60 hover:bg-surface hover:text-text"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="text-sm text-text/50">
        {filteredBrands.length} brand{filteredBrands.length !== 1 ? "s" : ""}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>

      {filteredBrands.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-12 text-center"
        >
          <p className="text-text/50">No brands found matching your search.</p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-2 text-sm text-accent hover:underline"
          >
            Clear search
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map((brand, index) => (
            <BrandCard key={brand.id} brand={brand} priority={index < 6} />
          ))}
        </div>
      )}
    </div>
  );
}
