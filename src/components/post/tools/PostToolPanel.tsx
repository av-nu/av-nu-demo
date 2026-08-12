"use client";

import { useState } from "react";

import { ChevronDown, Star, X } from "lucide-react";

import { useColorPalette } from "@/hooks/useColorPalette";

/** Shared bottom-sheet shell for every composer tool. */
export function PostToolPanel({
  title,
  onClose,
  children,
  actions,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="w-full min-w-0 shrink-0 border-t border-divider/60 bg-bg"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <h2 className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.14em] text-midnight/50">{title}</h2>
        {actions}
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-midnight/55 transition-colors hover:bg-surface hover:text-midnight"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Capped so the canvas stays visible while a tool is open on a phone. */}
      <div className="max-h-[38dvh] overflow-y-auto px-3 pb-3">{children}</div>
    </section>
  );
}

/**
 * A collapsible group within a tool panel. Panels grew long enough that
 * everything competed for the same small sheet; one section open at a time keeps
 * the canvas visible.
 */
export function ToolSection({
  label,
  icon,
  open,
  onToggle,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-divider/50 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-2.5 text-left"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-midnight/60">{icon}</span>
        <span className="min-w-0 flex-1 text-xs font-semibold text-midnight/80">{label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-midnight/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

export function ToolFieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-midnight/40">{children}</p>;
}

/**
 * Horizontal swatch row shared by the text and draw tools, including the
 * author's saved palette.
 */
export function ColorSwatches({
  value,
  onChange,
  colors,
  allowTransparent = false,
  showPalette = true,
}: {
  value: string;
  onChange: (color: string) => void;
  colors: string[];
  allowTransparent?: boolean;
  /** Set false for pickers where a saved palette is not meaningful. */
  showPalette?: boolean;
}) {
  const { colors: saved, recent, saveColor, removeColor, hasColor, recordRecent } = useColorPalette();
  const [tab, setTab] = useState<"saved" | "recent">("saved");
  const list = tab === "saved" ? saved : recent;
  const pick = (color: string) => {
    recordRecent(color);
    onChange(color);
  };
  // Any real colour can be favourited, presets included: hiding the control for
  // presets meant it was almost never on screen.
  const isSaved = hasColor(value);
  const canSave = showPalette && value !== "transparent";

  return (
    <div className="min-w-0">
    <div className="flex min-w-0 items-center gap-2">
    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {allowTransparent && (
        <button
          type="button"
          onClick={() => onChange("transparent")}
          aria-label="No color"
          aria-pressed={value === "transparent"}
          className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 bg-white ${value === "transparent" ? "border-midnight" : "border-divider"}`}
        >
          <span className="absolute left-1/2 top-1/2 h-[2px] w-9 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-pink" />
        </button>
      )}
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => pick(color)}
          aria-label={`Color ${color}`}
          aria-pressed={value === color}
          className={`h-8 w-8 shrink-0 rounded-full border-2 transition-transform ${value === color ? "scale-110 border-midnight" : "border-divider/70"}`}
          style={{ backgroundColor: color }}
        />
      ))}
      <label className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-divider/70">
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "conic-gradient(#FF6361,#FFD380,#ACAB36,#7DCFB6,#003F5C,#BC5090,#FF6361)" }}
        />
        <input
          type="color"
          value={value === "transparent" ? "#000000" : value}
          onChange={(event) => pick(event.target.value)}
          aria-label="Custom color"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

    </div>
      {canSave && (
        <>
          <span aria-hidden="true" className="h-6 w-px shrink-0 bg-divider" />
          <button
            type="button"
            onClick={() => (isSaved ? removeColor(value) : saveColor(value))}
            aria-pressed={isSaved}
            aria-label={isSaved ? `Remove ${value} from saved colours` : `Save ${value} to your colours`}
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold transition-colors ${isSaved ? "border-navy bg-navy text-white" : "border-divider/70 text-midnight/70 hover:border-midnight/40 hover:text-midnight"}`}
          >
            <Star className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
            {isSaved ? "Saved" : "Save"}
            <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border border-white/40" style={{ backgroundColor: value }} />
          </button>
        </>
      )}
    </div>

    {/* Saved colours sit on their own row: at the end of the preset row they
        scrolled out of sight, so a palette was effectively unreachable. */}
    {showPalette && (saved.length > 0 || recent.length > 0) && (
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pt-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="flex shrink-0 overflow-hidden rounded-full border border-divider/70">
          {(["saved", "recent"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${tab === id ? "bg-navy text-white" : "text-midnight/50 hover:text-midnight"}`}
            >
              {id === "saved" ? "Saved" : "Recent"}
            </button>
          ))}
        </span>
        {list.length === 0 && (
          <span className="shrink-0 text-[11px] text-midnight/40">
            {tab === "saved" ? "Tap Save to keep a colour" : "No colours used yet"}
          </span>
        )}
        {list.map((color) => {
            const isActive = value.toLowerCase() === color;
            return (
              <span key={color} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => pick(color)}
                  aria-label={`${tab === "saved" ? "Saved" : "Recent"} color ${color}`}
                  aria-pressed={isActive}
                  className={`block h-8 w-8 rounded-full border-2 transition-transform ${isActive ? "scale-110 border-midnight" : "border-divider/70"}`}
                  style={{ backgroundColor: color }}
                />
                {/* Remove is offered only on the selected swatch, so the row does
                    not fill with delete affordances. */}
                {isActive && tab === "saved" && (
                  <button
                    type="button"
                    onClick={() => removeColor(color)}
                    aria-label={`Remove ${color} from your palette`}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-midnight text-white"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </span>
            );
        })}
      </div>
    )}
    </div>
  );
}

/** Brand-aligned palette offered across the tools. */
export const POST_COLORS = [
  "#030125",
  "#FFFFFF",
  "#FF6361",
  "#FFD380",
  "#ACAB36",
  "#BC5090",
  "#003F5C",
  "#7DCFB6",
  "#8A4F7D",
  "#E8E2D6",
];
