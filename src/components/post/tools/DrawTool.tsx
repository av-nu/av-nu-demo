"use client";

import { Brush, Eraser, Highlighter, PenLine, Pencil } from "lucide-react";

import { ColorSwatches, POST_COLORS, PostToolPanel, ToolFieldLabel } from "@/components/post/tools/PostToolPanel";
import type { DrawSettings } from "@/components/post/tools/DrawingSurface";
import { DRAW_TOOL_PRESETS } from "@/lib/drawing";
import { cn } from "@/lib/utils";
import type { EditorialDrawTool } from "@/lib/editorial";

/**
 * Canvas units. The canvas is 1000 units wide but renders around 358px on a
 * phone, so one unit is roughly a third of a pixel — an eraser sized like a pen
 * would have a ~4px reach and feel broken.
 */
const ERASER_DEFAULT_WIDTH = 90;

const UTENSILS: Array<{ id: EditorialDrawTool | "eraser"; label: string; icon: typeof PenLine }> = [
  { id: "pen", label: "Pen", icon: PenLine },
  { id: "pencil", label: "Pencil", icon: Pencil },
  { id: "marker", label: "Marker", icon: Brush },
  { id: "highlighter", label: "Highlighter", icon: Highlighter },
  { id: "eraser", label: "Eraser", icon: Eraser },
];

export function DrawTool({
  settings,
  onChange,
  onClose,
}: {
  settings: DrawSettings;
  onChange: (settings: DrawSettings) => void;
  onClose: () => void;
}) {
  const isEraser = settings.tool === "eraser";

  return (
    <PostToolPanel title="Draw" onClose={onClose}>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {UTENSILS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange({
              ...settings,
              tool: id,
              // Adopt the utensil's natural weight when switching to it.
              width: id === "eraser" ? ERASER_DEFAULT_WIDTH : DRAW_TOOL_PRESETS[id].width,
            })}
            aria-pressed={settings.tool === id}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-2 text-[10px] font-semibold transition-colors",
              settings.tool === id ? "border-navy bg-navy text-white" : "border-divider/70 text-midnight/65 hover:border-midnight/30",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <>
          <div className="mt-3">
            <ToolFieldLabel>{isEraser ? "Eraser size" : "Size"}</ToolFieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={isEraser ? 20 : 2}
                max={isEraser ? 160 : 60}
                step="1"
                value={settings.width}
                onChange={(event) => onChange({ ...settings, width: Number(event.target.value) })}
                className="w-full accent-navy"
              />
              <span
                aria-hidden="true"
                className={cn("shrink-0 rounded-full", isEraser && "border border-dashed border-midnight/50")}
                style={{
                  width: Math.max(4, Math.min(28, settings.width / 2)),
                  height: Math.max(4, Math.min(28, settings.width / 2)),
                  backgroundColor: isEraser ? "transparent" : settings.color,
                }}
              />
            </div>
          </div>

          {!isEraser && (
            <div className="mt-3">
              <ToolFieldLabel>Color</ToolFieldLabel>
              <ColorSwatches value={settings.color} colors={POST_COLORS} onChange={(color) => onChange({ ...settings, color })} />
            </div>
          )}
        </>

      <p className="mt-3 text-[11px] leading-relaxed text-midnight/45">
        {isEraser ? "Drag across a stroke to remove it." : "Draw directly on the canvas."}
      </p>
    </PostToolPanel>
  );
}
