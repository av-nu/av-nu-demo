"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { useFavorites } from "@/hooks/useFavorites";
import { useFaveLists } from "@/hooks/useFaveLists";
import { flattenPages } from "@/data/faves";
import { getProductById } from "@/lib/data";

interface ProductPickerDialogProps {
  onClose: () => void;
  onSelect: (productId: string) => void;
  /** Product ids already in the list (shown as added). */
  inListIds?: string[];
  /** Keep the dialog open after selecting, for adding several at once. */
  multi?: boolean;
}

export function ProductPickerDialog({
  onClose,
  onSelect,
  inListIds = [],
  multi = false,
}: ProductPickerDialogProps) {
  const { favorites } = useFavorites();
  const { lists } = useFaveLists();

  // Everything the user has saved anywhere: umbrella faves + every list's
  // products (collection + carousel pages), de-duplicated.
  const savedIds = new Set<string>(favorites);
  lists.forEach((l) => {
    l.productIds.forEach((id) => savedIds.add(id));
    flattenPages(l.pages).forEach((id) => savedIds.add(id));
  });

  const products = Array.from(savedIds)
    .map((id) => getProductById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getProductById>>[];

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-lg sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-divider/60 px-5 py-4">
              <div>
                <h2 className="font-headline text-lg tracking-tight text-text">
                  Add from your faves
                </h2>
                <p className="text-xs text-text/50">Tap a product to add it</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {products.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-text/50">
                    You haven&apos;t saved any products yet.
                  </p>
                  <Link
                    href="/"
                    onClick={onClose}
                    className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
                  >
                    Browse products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {products.map((product) => {
                    const added = inListIds.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          onSelect(product.id);
                          if (!multi) onClose();
                        }}
                        className="group relative overflow-hidden rounded-xl bg-surface text-left"
                      >
                        <div className="relative aspect-square">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="120px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div
                            className={cn(
                              "absolute inset-0 transition-colors",
                              added ? "bg-accent/40" : "bg-transparent group-hover:bg-black/10",
                            )}
                          />
                          {added && (
                            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-accent">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-1 px-2 py-1.5 text-[11px] text-text/70">
                          {product.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {multi && products.length > 0 && (
              <div className="border-t border-divider/60 p-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl bg-burgundy py-3 text-sm font-medium text-white transition-colors hover:bg-burgundy/90"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
