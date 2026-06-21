"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Check, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Product } from "@/data/mockProducts";
import { Portal } from "@/components/ui/Portal";
import { useFavorites } from "@/hooks/useFavorites";
import { useFaveLists } from "@/hooks/useFaveLists";

interface SaveToListDialogProps {
  product: Product;
  onClose: () => void;
  onToast?: (message: string) => void;
}

export function SaveToListDialog({ product, onClose, onToast }: SaveToListDialogProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const {
    lists,
    createList,
    toggleProductInList,
    isInList,
    removeProductEverywhere,
  } = useFaveLists();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const saved = isFavorite(product.id);

  const handleToggleMyFaves = useCallback(() => {
    if (saved) {
      // Unsave entirely: remove from umbrella + every list.
      toggleFavorite(product.id);
      removeProductEverywhere(product.id);
      onToast?.("Removed from My Faves");
    } else {
      toggleFavorite(product.id);
      onToast?.("Added to My Faves");
    }
  }, [saved, product.id, toggleFavorite, removeProductEverywhere, onToast]);

  const handleToggleList = useCallback(
    (listId: string, listName: string) => {
      const has = isInList(listId, product.id);
      toggleProductInList(listId, product.id);
      if (!has) {
        if (!saved) toggleFavorite(product.id);
        onToast?.(`Added to ${listName}`);
      } else {
        onToast?.(`Removed from ${listName}`);
      }
    },
    [isInList, product.id, toggleProductInList, saved, toggleFavorite, onToast],
  );

  const handleCreate = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    createList(name, product.id);
    if (!saved) toggleFavorite(product.id);
    onToast?.(`Created "${name}"`);
    setNewName("");
    setCreating(false);
  }, [newName, product.id, createList, saved, toggleFavorite, onToast]);

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={onClose}
        >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-md sm:rounded-3xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-divider/60 p-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wide text-text/50">Save to</p>
              <p className="line-clamp-1 font-headline text-sm font-medium text-text">
                {product.name}
              </p>
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

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-2">
            {/* My Faves (umbrella) */}
            <button
              type="button"
              onClick={handleToggleMyFaves}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface/60"
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  saved ? "bg-pink/15 text-pink" : "bg-surface text-text/50",
                )}
              >
                <Heart className={cn("h-5 w-5", saved && "fill-pink")} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-text">My Faves</span>
                <span className="block text-xs text-text/50">Everything you save</span>
              </span>
              {saved && <Check className="h-5 w-5 text-pink" />}
            </button>

            {lists.length > 0 && (
              <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-text/40">
                Your lists
              </p>
            )}

            {lists.map((list) => {
              const inList = isInList(list.id, product.id);
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => handleToggleList(list.id, list.name)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface/60"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold",
                      inList ? "bg-accent/15 text-accent" : "bg-surface text-text/40",
                    )}
                  >
                    {list.productIds.length}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text">
                      {list.name}
                    </span>
                    <span className="block text-xs text-text/50">
                      {list.productIds.length} {list.productIds.length === 1 ? "item" : "items"}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border",
                      inList
                        ? "border-accent bg-accent text-white"
                        : "border-divider text-transparent",
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Create new list */}
          <div className="border-t border-divider/60 p-3">
            {creating ? (
              <div className="space-y-3">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="List name"
                  className="h-11 w-full rounded-xl border border-divider/60 bg-surface/50 px-4 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="flex-1 rounded-xl border border-divider/60 py-2.5 text-sm font-medium text-text/70 transition-colors hover:bg-surface/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="flex-1 rounded-xl bg-burgundy py-2.5 text-sm font-medium text-white transition-colors hover:bg-burgundy/90 disabled:opacity-40"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-divider py-3 text-sm font-medium text-text/70 transition-colors hover:border-accent hover:text-accent"
              >
                <Plus className="h-4 w-4" />
                Create new list
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
