"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { interests } from "@/data/interests";
import { useInterests } from "@/hooks/useInterests";

// Tiles shown before "Show more" — matches the widest grid's first row (4).
const COLLAPSED_COUNT = 4;

/**
 * Inline interest picker used to personalize the feed. Selections are persisted
 * immediately via useInterests (localStorage), so there is no explicit save —
 * this powers the personalization section on the profile page.
 */
export function InterestPicker() {
  const { selected, isSelected, toggle, isHydrated } = useInterests();
  const [mounted, setMounted] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !isHydrated) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-surface/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text/50">
        {selected.length > 0
          ? `${selected.length} selected — your feed is tailored to these.`
          : "Pick a few interests to tailor your feed."}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {(showAll ? interests : interests.slice(0, COLLAPSED_COUNT)).map((interest) => {
          const active = isSelected(interest.id);
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggle(interest.id)}
              aria-pressed={active}
              className={cn(
                "group relative aspect-[4/3] overflow-hidden rounded-2xl ring-2 transition-all",
                active ? "ring-accent" : "ring-transparent hover:ring-text/20",
              )}
            >
              <Image
                src={interest.image}
                alt={interest.label}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                className={cn(
                  "absolute inset-0 transition-colors",
                  active ? "bg-accent/40" : "bg-black/30 group-hover:bg-black/40",
                )}
              />
              <span className="absolute inset-x-0 bottom-0 p-2.5 text-left text-sm font-semibold leading-tight text-white">
                {interest.label}
              </span>
              {active && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-accent shadow">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {interests.length > COLLAPSED_COUNT && (
        <div className="relative flex justify-center pt-1">
          {/* Fold line the button sits on */}
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-divider/60" />
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="relative z-10 inline-flex items-center gap-1.5 rounded-full border border-divider/60 bg-bg px-5 py-2 text-sm font-semibold text-text shadow-sm transition-colors hover:border-accent hover:text-accent"
          >
            {showAll ? "Show less" : `Show more (${interests.length - COLLAPSED_COUNT})`}
            <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}

