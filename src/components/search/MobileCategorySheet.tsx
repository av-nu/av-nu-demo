"use client";

import { memo } from "react";
import { X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { CategoryTree } from "./CategoryTree";

interface MobileCategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory?: string;
  selectedSubcategory?: string;
  selectedLeaf?: string;
  onSelect: (categoryId?: string, subcategoryId?: string, leafId?: string) => void;
}

export const MobileCategorySheet = memo(function MobileCategorySheet({
  isOpen,
  onClose,
  selectedCategory,
  selectedSubcategory,
  selectedLeaf,
  onSelect,
}: MobileCategorySheetProps) {
  const handleSelect = (
    categoryId?: string,
    subcategoryId?: string,
    leafId?: string,
  ) => {
    onSelect(categoryId, subcategoryId, leafId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-bg/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 top-0 z-50 max-h-[70vh] overflow-y-auto rounded-b-2xl bg-bg shadow-xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-divider/50 bg-bg px-4 py-3">
              <h2 className="font-headline text-lg text-text">Categories</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text/60 transition-colors hover:bg-surface hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <CategoryTree
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                selectedLeaf={selectedLeaf}
                onSelect={handleSelect}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
