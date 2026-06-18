"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Users, Globe2, Check, Link2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FaveList, FaveVisibility } from "@/data/faves";
import { getInnerCircle } from "@/data/social";
import { Portal } from "@/components/ui/Portal";
import { useFaveLists } from "@/hooks/useFaveLists";

interface ShareListDialogProps {
  list: FaveList;
  onClose: () => void;
  onToast?: (message: string) => void;
}

const OPTIONS: {
  value: FaveVisibility;
  icon: typeof Lock;
  label: string;
  description: string;
}[] = [
  { value: "private", icon: Lock, label: "Private", description: "Only you can see this list." },
  { value: "inner-circle", icon: Users, label: "Inner circle", description: "Share with people closest to you." },
  { value: "public", icon: Globe2, label: "Public", description: "Visible to followers and shown as a shoppable post on the home feed." },
];

export function ShareListDialog({ list, onClose, onToast }: ShareListDialogProps) {
  const { setVisibility } = useFaveLists();
  const innerCircle = getInnerCircle();

  const [visibility, setVis] = useState<FaveVisibility>(list.visibility);
  // "all" when sharedWith is empty, otherwise specific selection.
  const [shareMode, setShareMode] = useState<"all" | "selected">(
    list.sharedWith.length > 0 ? "selected" : "all",
  );
  const [selected, setSelected] = useState<string[]>(list.sharedWith);

  const togglePerson = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    const sharedWith =
      visibility === "inner-circle" && shareMode === "selected" ? selected : [];
    setVisibility(list.id, visibility, sharedWith);
    onToast?.(
      visibility === "private"
        ? "List set to private"
        : visibility === "public"
          ? "Shared publicly — now on the home feed"
          : "Shared with your inner circle",
    );
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/favorites/${list.id}`,
      );
      onToast?.("Link copied to clipboard");
    } catch {
      onToast?.("Could not copy link");
    }
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
          className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-md sm:rounded-3xl"
        >
          <div className="flex items-center justify-between border-b border-divider/60 p-4">
            <div>
              <h2 className="font-headline text-lg tracking-tight text-text">Share list</h2>
              <p className="text-xs text-text/50">{list.name}</p>
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

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = visibility === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVis(opt.value)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                    active ? "border-accent bg-accent/5" : "border-divider/60 hover:border-text/20",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      active ? "bg-accent/15 text-accent" : "bg-surface text-text/50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-text">{opt.label}</span>
                    <span className="block text-xs text-text/50">{opt.description}</span>
                  </span>
                  {active && <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />}
                </button>
              );
            })}

            {/* Inner-circle recipient selection */}
            {visibility === "inner-circle" && (
              <div className="rounded-xl border border-divider/60 p-3">
                <div className="mb-3 flex gap-2">
                  {(["all", "selected"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setShareMode(mode)}
                      className={cn(
                        "flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        shareMode === mode
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-divider/60 text-text/60 hover:border-text/30",
                      )}
                    >
                      {mode === "all" ? "All inner circle" : "Selected people"}
                    </button>
                  ))}
                </div>

                {shareMode === "selected" && (
                  <div className="space-y-1">
                    {innerCircle.map((person) => {
                      const checked = selected.includes(person.id);
                      return (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => togglePerson(person.id)}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface/60"
                        >
                          <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white", person.color)}>
                            {person.initials}
                          </span>
                          <span className="flex-1 text-sm text-text">{person.name}</span>
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border",
                              checked ? "border-accent bg-accent text-white" : "border-divider text-transparent",
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-divider/60 p-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 rounded-xl border border-divider/60 px-4 py-3 text-sm font-medium text-text/70 transition-colors hover:bg-surface/60"
            >
              <Link2 className="h-4 w-4" />
              Copy link
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-xl bg-burgundy py-3 text-sm font-medium text-white transition-colors hover:bg-burgundy/90"
            >
              Save
            </button>
          </div>
        </motion.div>
      </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
