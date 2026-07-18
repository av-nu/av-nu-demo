"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { useFavorites } from "@/hooks/useFavorites";
import { DEFAULT_PRODUCT_LIST_NAME, useFaveLists } from "@/hooks/useFaveLists";
import { flattenPages } from "@/data/faves";
import { getProductById } from "@/lib/data";

interface ProductPickerDialogProps {
  onClose: () => void;
  onSelect: (productId: string) => void;
  /** Product ids already in the list (shown as added). */
  inListIds?: string[];
  /** Keep the dialog open after selecting, for adding several at once. */
  multi?: boolean;
  onConfirm?: (productIds: string[]) => void;
}

export function ProductPickerDialog({
  onClose,
  onSelect,
  inListIds = [],
  multi = false,
  onConfirm,
}: ProductPickerDialogProps) {
  const { favorites } = useFavorites();
  const { lists, isHydrated } = useFaveLists();
  const defaultList = lists.find((list) => list.name === DEFAULT_PRODUCT_LIST_NAME);
  const [selectedListId, setSelectedListId] = useState<string>(defaultList?.id ?? "");
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!selectedListId && defaultList?.id) {
      setSelectedListId(defaultList.id);
      return;
    }
    if (selectedListId !== "all" && selectedListId && !lists.some((list) => list.id === selectedListId)) {
      setSelectedListId(defaultList?.id ?? "all");
    }
  }, [defaultList?.id, isHydrated, lists, selectedListId]);

  const selectedList = lists.find((list) => list.id === selectedListId);
  const savedIds = new Set<string>(selectedList ? [...selectedList.productIds, ...flattenPages(selectedList.pages)] : favorites);
  if (!selectedList) {
    lists.forEach((list) => {
      list.productIds.forEach((id) => savedIds.add(id));
      flattenPages(list.pages).forEach((id) => savedIds.add(id));
    });
  }

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
                  Add products
                </h2>
                <p className="text-xs text-text/50">{onConfirm ? `Select from ${selectedList?.name ?? DEFAULT_PRODUCT_LIST_NAME}, then add them together` : "Tap a product to add it"}</p>
              </div>
              <select value={selectedListId} onChange={(event) => setSelectedListId(event.target.value)} aria-label="Product list" className="max-w-[9rem] rounded-lg border border-divider/60 bg-surface/50 px-2 py-2 text-xs text-text focus:border-accent/50 focus:outline-none">
                <option value="">Loading saved lists…</option>
                <option value="all">All saved products</option>
                {lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
              </select>
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
                    This list has no products yet. Choose another list or add products from Shop.
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
                <div className={onConfirm ? "grid grid-cols-2 gap-2" : "grid grid-cols-3 gap-3 sm:grid-cols-4"}>
                  {products.map((product) => {
                    const alreadyAdded = inListIds.includes(product.id);
                    const pending = pendingIds.includes(product.id);
                    const added = alreadyAdded || pending;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={Boolean(onConfirm) && alreadyAdded}
                        onClick={() => {
                          if (onConfirm) {
                            setPendingIds((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id]);
                            return;
                          }
                          onSelect(product.id);
                          if (!multi) onClose();
                        }}
                        className={cn("group relative overflow-hidden rounded-xl bg-surface text-left disabled:cursor-default", onConfirm && "flex h-20 items-center")}
                      >
                        <div className={cn("relative aspect-square", onConfirm && "h-20 w-20 shrink-0")}>
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
                        <p className={cn("line-clamp-1 px-2 py-1.5 text-[11px] text-text/70", onConfirm && "line-clamp-2 flex-1 font-medium")}>
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
                  disabled={Boolean(onConfirm) && pendingIds.length === 0}
                  onClick={() => {
                    if (onConfirm) onConfirm(pendingIds);
                    onClose();
                  }}
                  className="w-full rounded-xl bg-burgundy py-3 text-sm font-medium text-white transition-colors hover:bg-burgundy/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {onConfirm ? `Add ${pendingIds.length} product${pendingIds.length === 1 ? "" : "s"}` : "Done"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
