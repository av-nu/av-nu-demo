"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, ChevronDown, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { mockProducts, type Product } from "@/data/mockProducts";
import { mockBrands } from "@/data/mockBrands";
import { categories, getCategoryPath } from "@/data/categories";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryTree } from "@/components/search/CategoryTree";
import { FilterChips, type FilterChip } from "@/components/search/FilterChips";
import { SearchResultsSkeleton } from "@/components/search/SearchResultsSkeleton";
import { MobileCategorySheet } from "@/components/search/MobileCategorySheet";
import { useToast } from "@/components/ui/Toast";

const ITEMS_PER_PAGE = 12;
const SIMULATED_DELAY = 250;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>();
  const [selectedLeaf, setSelectedLeaf] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { showToast, ToastContainer } = useToast();

  // Filter products based on query and category selection
  const filteredProducts = useMemo(() => {
    let results = [...mockProducts];

    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter((product) => {
        const brand = mockBrands.find((b) => b.id === product.brandId);
        const brandName = brand?.name.toLowerCase() ?? "";
        const productName = product.name.toLowerCase();
        const categoryText = `${product.category} ${product.subcategory} ${product.leaf ?? ""}`.toLowerCase();

        return (
          productName.includes(q) ||
          brandName.includes(q) ||
          categoryText.includes(q)
        );
      });
    }

    // Filter by category
    if (selectedCategory) {
      const categoryMap: Record<string, string> = {
        apparel: "Apparel",
        "home-living": "Home & Living",
        beauty: "Beauty",
        outdoors: "Outdoors",
        pet: "Pet",
        kids: "Kids",
        "food-drink": "Food",
        accessories: "Accessories",
        wellness: "Wellness",
      };
      const categoryName = categoryMap[selectedCategory];
      if (categoryName) {
        results = results.filter((p) => p.category === categoryName);
      }
    }

    // Filter by subcategory
    if (selectedSubcategory) {
      const category = categories.find((c) => c.id === selectedCategory);
      const subcategory = category?.subcategories.find((s) => s.id === selectedSubcategory);
      if (subcategory) {
        results = results.filter(
          (p) => p.subcategory.toLowerCase() === subcategory.name.toLowerCase(),
        );
      }
    }

    return results;
  }, [query, selectedCategory, selectedSubcategory, selectedLeaf]);

  // Build filter chips
  const filterChips = useMemo(() => {
    const chips: FilterChip[] = [];

    if (query.trim()) {
      chips.push({ id: "query", label: query, type: "query" });
    }

    const path = getCategoryPath(selectedCategory, selectedSubcategory, selectedLeaf);
    if (path.length > 0) {
      if (selectedLeaf) {
        chips.push({ id: "leaf", label: path.join(" > "), type: "leaf" });
      } else if (selectedSubcategory) {
        chips.push({ id: "subcategory", label: path.join(" > "), type: "subcategory" });
      } else if (selectedCategory) {
        chips.push({ id: "category", label: path[0], type: "category" });
      }
    }

    return chips;
  }, [query, selectedCategory, selectedSubcategory, selectedLeaf]);

  // Handle search submission
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setVisibleCount(ITEMS_PER_PAGE);

    setTimeout(() => {
      setQuery(inputValue);
      setIsLoading(false);
    }, SIMULATED_DELAY);
  }, [inputValue]);

  // Handle category selection
  const handleCategorySelect = useCallback(
    (categoryId?: string, subcategoryId?: string, leafId?: string) => {
      setIsLoading(true);
      setVisibleCount(ITEMS_PER_PAGE);

      setTimeout(() => {
        setSelectedCategory(categoryId);
        setSelectedSubcategory(subcategoryId);
        setSelectedLeaf(leafId);
        setIsLoading(false);
      }, SIMULATED_DELAY);
    },
    [],
  );

  // Handle chip removal
  const handleRemoveChip = useCallback((chipId: string) => {
    setIsLoading(true);

    setTimeout(() => {
      if (chipId === "query") {
        setQuery("");
        setInputValue("");
      } else if (chipId === "leaf") {
        setSelectedLeaf(undefined);
      } else if (chipId === "subcategory") {
        setSelectedSubcategory(undefined);
        setSelectedLeaf(undefined);
      } else if (chipId === "category") {
        setSelectedCategory(undefined);
        setSelectedSubcategory(undefined);
        setSelectedLeaf(undefined);
      }
      setIsLoading(false);
    }, SIMULATED_DELAY);
  }, []);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setIsLoading(true);

    setTimeout(() => {
      setQuery("");
      setInputValue("");
      setSelectedCategory(undefined);
      setSelectedSubcategory(undefined);
      setSelectedLeaf(undefined);
      setIsLoading(false);
    }, SIMULATED_DELAY);
  }, []);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredProducts.length && !isLoading) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredProducts.length));
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length, isLoading]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryDropdownOpen]);

  return (
    <div>
      {/* Main content - full width */}
      <main>
        {/* Search bar with inline category dropdown */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            {/* Category dropdown - desktop only */}
            <div ref={categoryDropdownRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className={cn(
                  "flex h-12 items-center gap-2 rounded-xl border px-4 text-sm transition-colors",
                  isCategoryDropdownOpen || selectedCategory
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-divider/50 bg-surface/50 text-text/70 hover:bg-surface hover:text-text",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="font-medium">Categories</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isCategoryDropdownOpen && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {isCategoryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-divider/50 bg-bg p-4 shadow-lg"
                  >
                    <CategoryTree
                      selectedCategory={selectedCategory}
                      selectedSubcategory={selectedSubcategory}
                      selectedLeaf={selectedLeaf}
                      onSelect={(catId, subId, leafId) => {
                        handleCategorySelect(catId, subId, leafId);
                        // Only close dropdown when selecting subcategory or leaf, not top-level category
                        if (subId || leafId || !catId) {
                          setIsCategoryDropdownOpen(false);
                        }
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text/40" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search products, brands, categories..."
                className="h-12 w-full rounded-xl border border-divider/50 bg-surface/50 pl-10 pr-4 text-text placeholder:text-text/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <button
              type="submit"
              className="flex h-12 items-center justify-center rounded-xl bg-accent px-6 font-medium text-white transition-colors hover:bg-accent/90"
            >
              Search
            </button>
            {/* Mobile category toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSheetOpen(true)}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-divider/50 bg-surface/50 text-text/60 transition-colors hover:bg-surface hover:text-text lg:hidden"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Filter chips */}
        <div className="mb-6">
          <FilterChips
            chips={filterChips}
            onRemove={handleRemoveChip}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Results header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-text/60">
            {isLoading ? (
              "Searching..."
            ) : (
              <>
                <span className="font-medium text-text">{filteredProducts.length}</span>{" "}
                {filteredProducts.length === 1 ? "result" : "results"}
              </>
            )}
          </p>
        </div>

        {/* Results grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SearchResultsSkeleton count={8} />
            </motion.div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Search className="mb-4 h-12 w-12 text-text/20" />
              <h3 className="font-headline text-lg text-text">No results found</h3>
              <p className="mt-2 text-sm text-text/50">
                Try adjusting your search or filters
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onShare={showToast}
                  />
                ))}
              </div>

              {/* Load more trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="mt-8 flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile category sheet */}
      <MobileCategorySheet
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        selectedLeaf={selectedLeaf}
        onSelect={handleCategorySelect}
      />

      <ToastContainer />
    </div>
  );
}
