"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { Portal } from "@/components/ui/Portal";
import { useFaveLists } from "@/hooks/useFaveLists";

interface CreateListDialogProps {
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export function CreateListDialog({ onClose, onCreated }: CreateListDialogProps) {
  const { createList } = useFaveLists();
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    const id = createList(name);
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
              className="mb-6 h-11 w-full rounded-xl border border-divider/60 bg-surface/50 px-4 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />

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
