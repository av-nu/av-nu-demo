"use client";

import { memo } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";

export interface FilterChip {
  id: string;
  label: string;
  type: "query" | "category" | "subcategory" | "leaf";
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (chipId: string) => void;
  onClearAll: () => void;
}

export const FilterChips = memo(function FilterChips({
  chips,
  onRemove,
  onClearAll,
}: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence mode="popLayout">
        {chips.map((chip) => (
          <motion.button
            key={chip.id}
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => onRemove(chip.id)}
            className={cn(
              "group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
              chip.type === "query"
                ? "bg-pink/10 text-pink hover:bg-pink/20"
                : "bg-accent/10 text-accent hover:bg-accent/20",
            )}
          >
            <span className="max-w-[150px] truncate">
              {chip.type === "query" ? `"${chip.label}"` : chip.label}
            </span>
            <X className="h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
          </motion.button>
        ))}
      </AnimatePresence>

      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-text/50 transition-colors hover:text-text/70"
        >
          Clear all
        </button>
      )}
    </div>
  );
});
