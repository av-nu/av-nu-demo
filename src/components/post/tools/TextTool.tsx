"use client";

import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Plus } from "lucide-react";

import { ColorSwatches, POST_COLORS, PostToolPanel, ToolFieldLabel } from "@/components/post/tools/PostToolPanel";
import {
  EDITORIAL_HIGHLIGHT_STYLES,
  FONT_CATALOG,
  editorialFontStack,
  type EditorialFontId,
  type EditorialTextAlign,
  type EditorialTextElement,
} from "@/lib/editorial";
import { cn } from "@/lib/utils";

/**
 * Typography controls. With no text selected the panel offers to add some;
 * otherwise it edits the selection live.
 */
export function TextTool({
  selected,
  onAdd,
  onPatch,
  onClose,
}: {
  selected?: EditorialTextElement;
  onAdd: () => void;
  onPatch: (patch: Partial<EditorialTextElement>) => void;
  onClose: () => void;
}) {
  if (!selected) {
    return (
      <PostToolPanel title="Text" onClose={onClose}>
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-divider py-4 text-sm font-semibold text-midnight/70 transition-colors hover:border-accent/50 hover:text-midnight"
        >
          <Plus className="h-4 w-4" />
          Add text
        </button>
        <p className="mt-2 text-center text-[11px] text-midnight/45">Or select existing text on the canvas to edit it.</p>
      </PostToolPanel>
    );
  }

  return (
    <PostToolPanel
      title="Text"
      onClose={onClose}
      actions={(
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add another text layer"
          className="flex h-8 w-8 items-center justify-center rounded-full text-midnight/55 transition-colors hover:bg-surface hover:text-midnight"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    >
      <label className="block">
        <ToolFieldLabel>Words</ToolFieldLabel>
        <textarea
          value={selected.content}
          onChange={(event) => onPatch({ content: event.target.value })}
          rows={2}
          className="w-full resize-none rounded-xl border border-divider/70 bg-surface/40 px-3 py-2 text-sm text-midnight focus:border-accent/50 focus:outline-none"
        />
      </label>

      <div className="mt-3">
        <ToolFieldLabel>Font</ToolFieldLabel>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FONT_CATALOG.map((font) => (
            <button
              key={font.id}
              type="button"
              onClick={() => onPatch({ fontId: font.id as EditorialFontId })}
              aria-pressed={selected.fontId === font.id}
              style={{ fontFamily: editorialFontStack(font.id) }}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-2 text-sm transition-colors",
                selected.fontId === font.id ? "border-navy bg-navy/10 text-midnight" : "border-divider/70 text-midnight/70 hover:border-midnight/30",
              )}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <ToolFieldLabel>Size</ToolFieldLabel>
          <input
            type="range"
            min="12"
            max="160"
            step="2"
            value={selected.fontSize}
            onChange={(event) => onPatch({ fontSize: Number(event.target.value) })}
            className="w-full accent-navy"
          />
        </label>
        <div>
          <ToolFieldLabel>Style</ToolFieldLabel>
          <div className="flex gap-1.5">
            <ToggleButton
              label="Bold"
              active={selected.fontWeight >= 600}
              onClick={() => onPatch({ fontWeight: selected.fontWeight >= 600 ? 400 : 700 })}
            >
              <Bold className="h-4 w-4" />
            </ToggleButton>
            <ToggleButton label="Italic" active={selected.italic} onClick={() => onPatch({ italic: !selected.italic })}>
              <Italic className="h-4 w-4" />
            </ToggleButton>
            {(["left", "center", "right"] as EditorialTextAlign[]).map((align) => (
              <ToggleButton
                key={align}
                label={`Align ${align}`}
                active={selected.align === align}
                onClick={() => onPatch({ align })}
              >
                {align === "left" ? <AlignLeft className="h-4 w-4" /> : align === "center" ? <AlignCenter className="h-4 w-4" /> : <AlignRight className="h-4 w-4" />}
              </ToggleButton>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <ToolFieldLabel>Text color</ToolFieldLabel>
        <ColorSwatches value={selected.color} colors={POST_COLORS} onChange={(color) => onPatch({ color })} />
      </div>

      <div className="mt-3">
        <ToolFieldLabel>Highlight</ToolFieldLabel>
        <div className="mb-2 flex gap-1.5">
          {EDITORIAL_HIGHLIGHT_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onPatch({
                highlightStyle: style.id,
                // Choosing a style with no color yet would look like nothing happened.
                highlightColor: style.id !== "none" && selected.highlightColor === "transparent" ? "#FFD380" : selected.highlightColor,
              })}
              aria-pressed={selected.highlightStyle === style.id}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                selected.highlightStyle === style.id ? "border-navy bg-navy text-white" : "border-divider/70 text-midnight/65 hover:border-midnight/30",
              )}
            >
              {style.label}
            </button>
          ))}
        </div>
        {selected.highlightStyle !== "none" && (
          <ColorSwatches
            value={selected.highlightColor}
            colors={POST_COLORS}
            allowTransparent
            onChange={(highlightColor) => onPatch({ highlightColor })}
          />
        )}
      </div>
    </PostToolPanel>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
        active ? "border-navy bg-navy text-white" : "border-divider/70 text-midnight/65 hover:border-midnight/30",
      )}
    >
      {children}
    </button>
  );
}
