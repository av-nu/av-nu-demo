"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Users, UserCheck, Globe2, Check, Link2, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FaveList } from "@/data/faves";
import { getInnerCircle } from "@/data/social";
import { Portal } from "@/components/ui/Portal";
import { useFaveLists } from "@/hooks/useFaveLists";
import { socialService } from "@/lib/social";

interface ShareListDialogProps {
  list: FaveList;
  onClose: () => void;
  onToast?: (message: string) => void;
}

// A single share mode covers visibility + audience. "inner-all" and "specific"
// both map to inner-circle visibility, differing only by audience size.
type ShareMode = "private" | "inner-all" | "specific" | "public";

const OPTIONS: {
  value: ShareMode;
  icon: typeof Lock;
  label: string;
  description: string;
}[] = [
  { value: "private", icon: Lock, label: "Private", description: "Only you can see this list." },
  { value: "inner-all", icon: Users, label: "Inner circle", description: "Everyone in your inner circle can see it." },
  { value: "specific", icon: UserCheck, label: "Specific people", description: "Only the people you choose can see it." },
  { value: "public", icon: Globe2, label: "Make public", description: "Anyone can discover it in the feed." },
];

function initialMode(list: FaveList): ShareMode {
  if (list.visibility === "public") return "public";
  if (list.visibility === "inner-circle") {
    return list.sharedWith.length > 0 ? "specific" : "inner-all";
  }
  return "private";
}

export function ShareListDialog({ list, onClose, onToast }: ShareListDialogProps) {
  const { setVisibility } = useFaveLists();
  const innerCircle = getInnerCircle();

  const [mode, setMode] = useState<ShareMode>(initialMode(list));
  const [selected, setSelected] = useState<string[]>(list.sharedWith);
  const [peopleQuery, setPeopleQuery] = useState("");

  const filteredInnerCircle = innerCircle.filter((p) =>
    p.name.toLowerCase().includes(peopleQuery.trim().toLowerCase()),
  );

  const togglePerson = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  // "Specific people" requires at least one recipient.
  const canSave = mode !== "specific" || selected.length > 0;

  const handleSave = () => {
    switch (mode) {
      case "private":
        setVisibility(list.id, "private");
        onToast?.("List set to private");
        break;
      case "inner-all":
        setVisibility(list.id, "inner-circle", []);
        onToast?.("Shared with your inner circle");
        break;
      case "specific":
        if (selected.length === 0) return;
        setVisibility(list.id, "inner-circle", selected);
        onToast?.(
          `Shared with ${selected.length} ${selected.length === 1 ? "person" : "people"}`,
        );
        break;
      case "public":
        setVisibility(list.id, "public", []);
        socialService.simulateEngagement({ id: list.id, label: list.name });
        onToast?.("Published — anyone can discover it");
        break;
    }
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
              <h2 className="font-headline text-lg tracking-tight text-text">Sharing</h2>
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
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value)}
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

            {/* Recipient selection for direct, specific-people sharing */}
            {mode === "specific" && (
              <div className="rounded-xl border border-divider/60 p-3">
                <p className="mb-2 text-xs font-medium text-text/60">
                  Choose who can see this list
                </p>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text/40" />
                  <input
                    type="text"
                    value={peopleQuery}
                    onChange={(e) => setPeopleQuery(e.target.value)}
                    placeholder="Search your inner circle…"
                    className="h-9 w-full rounded-lg border border-divider/60 bg-surface/50 pl-9 pr-3 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1">
                  {filteredInnerCircle.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-text/50">No matches.</p>
                  ) : filteredInnerCircle.map((person) => {
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
                {selected.length === 0 && (
                  <p className="mt-2 text-xs text-pink">Select at least one person.</p>
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
              disabled={!canSave}
              className="flex-1 rounded-xl bg-burgundy py-3 text-sm font-medium text-white transition-colors hover:bg-burgundy/90 disabled:opacity-40"
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
