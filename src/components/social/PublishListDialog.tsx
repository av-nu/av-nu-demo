"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Globe2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { useFaveLists } from "@/hooks/useFaveLists";
import { getProductById } from "@/lib/data";
import { flattenPages } from "@/data/faves";
import { socialService } from "@/lib/social";

/**
 * Quick "publish a list to your profile feed" flow. Lets the user pick one of
 * their lists, write a caption, and publish it publicly. Reused from the
 * profile page and the faves section.
 */
export function PublishListDialog({
  onClose,
  onToast,
  preselectedListId,
}: {
  onClose: () => void;
  onToast?: (message: string) => void;
  preselectedListId?: string;
}) {
  const { lists, setVisibility, setCaption } = useFaveLists();

  // Lists that actually have products to show.
  const publishable = useMemo(
    () =>
      lists.filter(
        (l) => l.productIds.length > 0 || flattenPages(l.pages ?? []).length > 0,
      ),
    [lists],
  );

  const [selectedId, setSelectedId] = useState<string>(
    preselectedListId ?? publishable[0]?.id ?? "",
  );
  const selected = publishable.find((l) => l.id === selectedId);
  const [caption, setCaptionDraft] = useState<string>(selected?.caption ?? "");

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const list = publishable.find((l) => l.id === id);
    setCaptionDraft(list?.caption ?? "");
  };

  const handlePublish = () => {
    if (!selected) return;
    const trimmed = caption.trim();
    if (selected.visibility !== "public") {
      setVisibility(selected.id, "public", []);
    }
    setCaption(selected.id, trimmed);
    socialService.simulateEngagement({ id: selected.id, label: selected.name });
    onToast?.(
      selected.visibility === "public"
        ? "Caption updated"
        : `Published "${selected.name}" to your profile`,
    );
    onClose();
  };

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-divider/60 p-4">
              <h2 className="font-headline text-lg tracking-tight text-text">Publish a list</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {publishable.length === 0 ? (
                <p className="py-8 text-center text-sm text-text/50">
                  You don&apos;t have any lists with products yet. Create one in My Faves first.
                </p>
              ) : (
                <>
                  {/* List picker */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text/60">Choose a list</label>
                    <div className="space-y-2">
                      {publishable.map((list) => {
                        const ids =
                          list.visibility === "public" && (list.pages?.length ?? 0) > 0
                            ? flattenPages(list.pages)
                            : list.productIds;
                        const cover = getProductById(ids[0] ?? "")?.images[0];
                        const active = selectedId === list.id;
                        return (
                          <button
                            key={list.id}
                            type="button"
                            onClick={() => handleSelect(list.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors",
                              active ? "border-accent bg-accent/5" : "border-divider/60 hover:border-text/20",
                            )}
                          >
                            <span className="relative h-12 w-12 overflow-hidden rounded-lg bg-surface">
                              {cover && (
                                <Image src={cover} alt={list.name} fill sizes="48px" className="object-cover" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-text">{list.name}</span>
                              <span className="block text-xs text-text/50">
                                {ids.length} {ids.length === 1 ? "item" : "items"}
                                {list.visibility === "public" && " · already public"}
                              </span>
                            </span>
                            {active && <Check className="h-4 w-4 shrink-0 text-accent" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text/60">Caption</label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaptionDraft(e.target.value)}
                      rows={3}
                      placeholder="Add a caption for your post…"
                      className="w-full resize-none rounded-xl border border-divider/60 bg-surface/50 px-4 py-3 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </>
              )}
            </div>

            {publishable.length > 0 && (
              <div className="border-t border-divider/60 p-3">
                <button
                  type="button"
                  disabled={!selected}
                  onClick={handlePublish}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-burgundy py-3 text-sm font-medium text-white transition-colors hover:bg-burgundy/90 disabled:opacity-40"
                >
                  <Globe2 className="h-4 w-4" />
                  {selected?.visibility === "public" ? "Update caption" : "Publish to profile"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
