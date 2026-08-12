"use client";

import { BookImage, Brush, Image as ImageIcon, Layers3, LayoutTemplate, Plus, Smile, Type } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The bottom tool rail. Phase 2 owns the rail, selection state, and layout; the
 * individual tool panels land in Phase 3.
 */
/**
 * `image` has no place in the rail: it is opened from a selected image rather
 * than chosen, since it only means anything with one selected.
 */
export type PostTool = "draw" | "text" | "add" | "photos" | "stickers" | "layers" | "layouts" | "pages" | "image";

export const POST_TOOLS: Array<{ id: PostTool; label: string; icon: typeof Brush }> = [
  { id: "draw", label: "Draw", icon: Brush },
  { id: "text", label: "Text", icon: Type },
  { id: "add", label: "Add", icon: Plus },
  { id: "photos", label: "Photos", icon: ImageIcon },
  { id: "stickers", label: "Stickers", icon: Smile },
  { id: "layouts", label: "Layouts", icon: LayoutTemplate },
  { id: "layers", label: "Layers", icon: Layers3 },
  { id: "pages", label: "Pages", icon: BookImage },
];

export function PostToolbar({
  active,
  onSelect,
  disabled = false,
}: {
  active?: PostTool;
  onSelect: (tool: PostTool) => void;
  disabled?: boolean;
}) {
  return (
    <nav
      aria-label="Post tools"
      className="w-full min-w-0 shrink-0 border-t border-divider/60 bg-bg/95 backdrop-blur"
    >
      {/* Scrolls horizontally on narrow phones rather than shrinking targets.
          `min-w-0` stops the row's min-content width from widening the shell. */}
      <ul className="flex min-w-0 items-stretch gap-1 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:gap-2">
        {POST_TOOLS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <li key={id} className="shrink-0">
              <button
                type="button"
                disabled={disabled}
                aria-pressed={isActive}
                onClick={() => onSelect(id)}
                className={cn(
                  "flex min-w-[62px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[10px] font-semibold transition-colors disabled:opacity-40",
                  isActive ? "bg-accent/15 text-midnight" : "text-midnight/60 hover:bg-surface hover:text-midnight",
                )}
              >
                <span className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                  isActive ? "border-accent/55 bg-accent/20 text-midnight" : "border-divider/70 bg-bg",
                )}>
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
