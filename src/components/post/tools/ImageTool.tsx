"use client";

import { Crop, Frame, Maximize } from "lucide-react";

import { PostToolPanel, ToolFieldLabel, ToolSection } from "@/components/post/tools/PostToolPanel";
import { cn } from "@/lib/utils";
import { EDITORIAL_IMAGE_MASKS, type EditorialImageMask, type EditorialMediaElement } from "@/lib/editorial";

type Section = "shape" | "crop";

/**
 * Per-image framing: corner rounding, shape, and how the picture sits inside its
 * box.
 *
 * Only offered for a loose image. A slot's frame belongs to its layout, so its
 * shape is not the author's to change here.
 */
export function ImageTool({
  selected,
  section,
  onSection,
  onPatch,
  onClose,
}: {
  selected: EditorialMediaElement;
  section: Section | undefined;
  onSection: (section: Section | undefined) => void;
  onPatch: (patch: Partial<EditorialMediaElement>) => void;
  onClose: () => void;
}) {
  const toggle = (next: Section) => onSection(section === next ? undefined : next);

  return (
    <PostToolPanel title="Image" onClose={onClose}>
      <ToolSection label="Shape" icon={<Frame className="h-3.5 w-3.5" />} open={section === "shape"} onToggle={() => toggle("shape")}>
        <label className="block">
          <ToolFieldLabel>Corner rounding</ToolFieldLabel>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="120"
              step="2"
              value={selected.borderRadius}
              onChange={(event) => onPatch({ borderRadius: Number(event.target.value) })}
              className="w-full accent-navy"
            />
            <span
              aria-hidden="true"
              className="h-7 w-7 shrink-0 border-2 border-midnight/40 bg-surface"
              // Scaled to the swatch so the control previews its own effect.
              style={{ borderRadius: `${Math.min(50, (selected.borderRadius / 120) * 50)}%` }}
            />
          </div>
        </label>

        <div className="mt-3">
          <ToolFieldLabel>Frame</ToolFieldLabel>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {EDITORIAL_IMAGE_MASKS.map((mask) => (
              <button
                key={mask.id}
                type="button"
                onClick={() => onPatch({ mask: mask.id as EditorialImageMask })}
                aria-pressed={selected.mask === mask.id}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                  selected.mask === mask.id ? "border-navy bg-navy text-white" : "border-divider/70 text-midnight/65 hover:border-midnight/30",
                )}
              >
                {mask.label}
              </button>
            ))}
          </div>
        </div>
      </ToolSection>

      <ToolSection label="Crop" icon={<Crop className="h-3.5 w-3.5" />} open={section === "crop"} onToggle={() => toggle("crop")}>
        <label className="block">
          <ToolFieldLabel>Zoom</ToolFieldLabel>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.05"
            value={selected.zoom}
            onChange={(event) => onPatch({ zoom: Number(event.target.value) })}
            className="w-full accent-navy"
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <ToolFieldLabel>Across</ToolFieldLabel>
            <input
              type="range"
              min="0"
              max="100"
              value={selected.cropX}
              onChange={(event) => onPatch({ cropX: Number(event.target.value) })}
              className="w-full accent-navy"
            />
          </label>
          <label className="block">
            <ToolFieldLabel>Down</ToolFieldLabel>
            <input
              type="range"
              min="0"
              max="100"
              value={selected.cropY}
              onChange={(event) => onPatch({ cropY: Number(event.target.value) })}
              className="w-full accent-navy"
            />
          </label>
        </div>

        <div className="mt-3">
          <ToolFieldLabel>Fill</ToolFieldLabel>
          <div className="flex gap-2">
            {(["cover", "contain"] as const).map((fit) => (
              <button
                key={fit}
                type="button"
                onClick={() => onPatch({ fit })}
                aria-pressed={selected.fit === fit}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                  selected.fit === fit ? "border-navy bg-navy text-white" : "border-divider/70 text-midnight/65 hover:border-midnight/30",
                )}
              >
                <Maximize className="h-3.5 w-3.5" />
                {fit === "cover" ? "Fill the box" : "Show it all"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-midnight/45">
            Zooming out below 100% also shows the whole picture.
          </p>
        </div>
      </ToolSection>
    </PostToolPanel>
  );
}
