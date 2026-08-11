"use client";

import { ArrowDown, ArrowUp, Brush, Eye, EyeOff, Image as ImageIcon, LayoutTemplate, Lock, LockOpen, Shapes, ShoppingBag, Smile, Type, Video } from "lucide-react";

import { PostToolPanel } from "@/components/post/tools/PostToolPanel";
import { cn } from "@/lib/utils";
import type { EditorialElement, EditorialPageDesign } from "@/lib/editorial";

const ICONS: Record<EditorialElement["type"], typeof Type> = {
  product: ShoppingBag,
  image: ImageIcon,
  video: Video,
  text: Type,
  shape: Shapes,
  sticker: Smile,
  drawing: Brush,
  placeholder: LayoutTemplate,
};

function labelFor(element: EditorialElement): string {
  if (element.type === "text") return element.content.trim().slice(0, 28) || "Text";
  if (element.type === "sticker") return `${element.value} Sticker`;
  if (element.type === "drawing") return `Drawing (${element.paths.length})`;
  return element.name;
}

/**
 * Stacking order and per-element visibility. Listed front-to-back, matching how
 * the canvas reads rather than how the array is stored.
 */
export function LayersTool({
  design,
  selectedId,
  onSelect,
  onReorder,
  onPatch,
  onClose,
}: {
  design: EditorialPageDesign;
  selectedId?: string;
  onSelect: (elementId: string) => void;
  onReorder: (elementId: string, direction: "forward" | "backward") => void;
  onPatch: (elementId: string, patch: Partial<EditorialElement>) => void;
  onClose: () => void;
}) {
  const ordered = [...design.elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <PostToolPanel title="Layers" onClose={onClose}>
      {ordered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-divider/70 px-3 py-6 text-center text-xs text-midnight/50">
          Nothing on this page yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {ordered.map((element, index) => {
            const Icon = ICONS[element.type];
            const isSelected = element.id === selectedId;
            return (
              <li
                key={element.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors",
                  isSelected ? "border-navy bg-navy/10" : "border-divider/60",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(element.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Icon className="h-4 w-4 shrink-0 text-midnight/55" />
                  <span className={cn("truncate text-xs", element.hidden ? "text-midnight/35 line-through" : "text-midnight/80")}>
                    {labelFor(element)}
                  </span>
                </button>
                <IconButton
                  label={element.hidden ? "Show layer" : "Hide layer"}
                  onClick={() => onPatch(element.id, { hidden: !element.hidden })}
                >
                  {element.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </IconButton>
                <IconButton
                  label={element.locked ? "Unlock layer" : "Lock layer"}
                  onClick={() => onPatch(element.id, { locked: !element.locked })}
                >
                  {element.locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                </IconButton>
                <IconButton label="Bring forward" disabled={index === 0} onClick={() => onReorder(element.id, "forward")}>
                  <ArrowUp className="h-4 w-4" />
                </IconButton>
                <IconButton label="Send backward" disabled={index === ordered.length - 1} onClick={() => onReorder(element.id, "backward")}>
                  <ArrowDown className="h-4 w-4" />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}
    </PostToolPanel>
  );
}

function IconButton({
  label,
  onClick,
  children,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-midnight/55 transition-colors hover:bg-surface hover:text-midnight disabled:opacity-25"
    >
      {children}
    </button>
  );
}
