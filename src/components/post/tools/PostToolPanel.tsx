"use client";

import { useState } from "react";

import { Plus, X } from "lucide-react";

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
  // Only offer to save a real colour that is not already a preset or saved.
  const canSave = showPalette && value !== "transparent" && !colors.includes(value) && !hasColor(value);

  return (
    <div className="min-w-0">
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      {showPalette && canSave && (
        <>
          <span aria-hidden="true" className="h-6 w-px shrink-0 bg-divider" />
          <button
            type="button"
            onClick={() => saveColor(value)}
            aria-label={`Save ${value} to your palette`}
            title="Save to palette"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-divider text-midnight/50 transition-colors hover:border-accent hover:text-midnight"
          >
            <Plus className="h-4 w-4" />
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
            {tab === "saved" ? "Save a colour with +" : "No colours used yet"}
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
