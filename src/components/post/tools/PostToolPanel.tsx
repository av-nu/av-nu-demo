"use client";

import { X } from "lucide-react";

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

/** Horizontal swatch row shared by the text and draw tools. */
export function ColorSwatches({
  value,
  onChange,
  colors,
  allowTransparent = false,
}: {
  value: string;
  onChange: (color: string) => void;
  colors: string[];
  allowTransparent?: boolean;
}) {
  return (
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
          onClick={() => onChange(color)}
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
          onChange={(event) => onChange(event.target.value)}
          aria-label="Custom color"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
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
