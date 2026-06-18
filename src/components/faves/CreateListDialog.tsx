"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { LIST_TYPES, LIST_TYPE_META, type FaveListType } from "@/data/faves";
import { Portal } from "@/components/ui/Portal";
import { useFaveLists } from "@/hooks/useFaveLists";

interface CreateListDialogProps {
  onClose: () => void;
  onCreated?: (id: string) => void;
  initialType?: FaveListType;
}

export function CreateListDialog({ onClose, onCreated, initialType }: CreateListDialogProps) {
  const { createList } = useFaveLists();
  const [name, setName] = useState("");
  const [type, setType] = useState<FaveListType>(initialType ?? LIST_TYPES[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const id = createList(name, type);
    onCreated?.(id);
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
          className="w-full overflow-hidden rounded-t-3xl bg-bg p-5 shadow-xl sm:max-w-md sm:rounded-3xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-lg tracking-tight text-text">
              Create a list
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <label className="mb-1.5 block text-xs font-medium text-text/60">List name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="e.g. Spring Refresh"
            className="mb-4 h-11 w-full rounded-xl border border-divider/60 bg-surface/50 px-4 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />

          <label className="mb-1.5 block text-xs font-medium text-text/60">Type</label>
          <div className="mb-6 grid grid-cols-3 gap-2">
            {LIST_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-xl border px-2 py-3 text-center transition-colors",
                  type === t
                    ? "border-accent bg-accent/10"
                    : "border-divider/60 hover:border-text/30",
                )}
              >
                <span className={cn("block text-sm font-medium", type === t ? "text-accent" : "text-text")}>
                  {t}
                </span>
                <span className="mt-0.5 block text-[10px] leading-tight text-text/50">
                  {LIST_TYPE_META[t].description}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full rounded-xl bg-burgundy py-3 text-sm font-medium text-white transition-colors hover:bg-burgundy/90 disabled:opacity-40"
          >
            Create list
          </button>
        </motion.div>
      </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
