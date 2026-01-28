"use client";

import { useState, memo } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { categories, type Category, type Subcategory } from "@/data/categories";

interface CategoryTreeProps {
  selectedCategory?: string;
  selectedSubcategory?: string;
  selectedLeaf?: string;
  onSelect: (categoryId?: string, subcategoryId?: string, leafId?: string) => void;
}

export const CategoryTree = memo(function CategoryTree({
  selectedCategory,
  selectedSubcategory,
  selectedLeaf,
  onSelect,
}: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(selectedCategory ? [selectedCategory] : []),
  );
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(
    new Set(selectedSubcategory ? [selectedSubcategory] : []),
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories((prev) => {
      const next = new Set(prev);
      if (next.has(subcategoryId)) {
        next.delete(subcategoryId);
      } else {
        next.add(subcategoryId);
      }
      return next;
    });
  };

  const handleCategoryClick = (category: Category) => {
    // Clicking a category just expands/collapses it - doesn't select
    toggleCategory(category.id);
  };

  const handleSubcategoryClick = (category: Category, subcategory: Subcategory) => {
    if (selectedSubcategory === subcategory.id && !selectedLeaf) {
      onSelect(category.id, undefined, undefined);
    } else {
      onSelect(category.id, subcategory.id, undefined);
      if (subcategory.leaves && !expandedSubcategories.has(subcategory.id)) {
        toggleSubcategory(subcategory.id);
      }
    }
  };

  const handleLeafClick = (
    category: Category,
    subcategory: Subcategory,
    leafId: string,
  ) => {
    if (selectedLeaf === leafId) {
      onSelect(category.id, subcategory.id, undefined);
    } else {
      onSelect(category.id, subcategory.id, leafId);
    }
  };

  return (
    <nav className="space-y-1">
      <button
        type="button"
        onClick={() => onSelect(undefined, undefined, undefined)}
        className={cn(
          "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
          !selectedCategory
            ? "bg-accent/10 text-accent"
            : "text-text/70 hover:bg-surface hover:text-text",
        )}
      >
        All Products
      </button>

      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = selectedCategory === category.id;

        return (
          <div key={category.id}>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center text-text/40 hover:text-text/70"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-2 text-left text-sm font-medium transition-colors",
                  isSelected
                    ? "text-accent"
                    : "text-text/70 hover:bg-surface hover:text-text",
                )}
              >
                {category.name}
              </button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="ml-4 space-y-0.5 border-l border-divider/50 pl-4">
                    {category.subcategories.map((subcategory) => {
                      const subExpanded = expandedSubcategories.has(subcategory.id);
                      const subSelected = selectedSubcategory === subcategory.id;
                      const hasLeaves = subcategory.leaves && subcategory.leaves.length > 0;

                      return (
                        <div key={subcategory.id}>
                          <div className="flex items-center">
                            {hasLeaves ? (
                              <button
                                type="button"
                                onClick={() => toggleSubcategory(subcategory.id)}
                                className="flex h-7 w-6 shrink-0 items-center justify-center text-text/40 hover:text-text/70"
                              >
                                {subExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                            ) : (
                              <div className="w-6" />
                            )}
                            <button
                              type="button"
                              onClick={() => handleSubcategoryClick(category, subcategory)}
                              className={cn(
                                "flex-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                                subSelected
                                  ? "bg-accent/10 text-accent"
                                  : "text-text/60 hover:bg-surface hover:text-text",
                              )}
                            >
                              {subcategory.name}
                            </button>
                          </div>

                          <AnimatePresence>
                            {hasLeaves && subExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.12 }}
                                className="overflow-hidden"
                              >
                                <div className="ml-6 space-y-0.5 border-l border-divider/30 pl-3">
                                  {subcategory.leaves!.map((leaf) => (
                                    <button
                                      key={leaf.id}
                                      type="button"
                                      onClick={() =>
                                        handleLeafClick(category, subcategory, leaf.id)
                                      }
                                      className={cn(
                                        "w-full rounded-md px-2 py-1 text-left text-xs transition-colors",
                                        selectedLeaf === leaf.id
                                          ? "bg-accent/10 text-accent"
                                          : "text-text/50 hover:bg-surface hover:text-text/70",
                                      )}
                                    >
                                      {leaf.name}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
});
