"use client";

import { ArrowDown, ArrowUp, Copy, Eraser, Lock, LockOpen, Repeat2, Trash2, ZoomIn, ZoomOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { isEditorialMediaElement, isSlotElement, type EditorialElement } from "@/lib/editorial";

/**
 * Actions for the current selection. Sits directly above the tool rail so the
 * common operations stay in thumb reach on a phone.
 */
export function SelectionBar({
  element,
  onDuplicate,
  onDelete,
  onReorder,
  onToggleLock,
  onReplaceSlot,
  onClearSlot,
  onZoom,
}: {
  element: EditorialElement;
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: (direction: "forward" | "backward") => void;
  onToggleLock: () => void;
  onReplaceSlot?: () => void;
  onClearSlot?: () => void;
  onZoom?: (zoom: number) => void;
}) {
  // A filled layout slot gets swap and empty actions, so the layout survives its
  // contents being changed instead of leaving a hole.
  const inSlot = isSlotElement(element);
  const zoom = isEditorialMediaElement(element) ? element.zoom : 1;

  return (
    <div className="w-full min-w-0 shrink-0 border-t border-divider/60 bg-surface/40">
    {inSlot && onZoom && (
      // Scale within the frame, which pairs with dragging to reframe.
      <div className="flex items-center gap-3 px-3 pt-2">
        <ZoomOut className="h-4 w-4 shrink-0 text-midnight/45" />
        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={zoom}
          onChange={(event) => onZoom(Number(event.target.value))}
          aria-label="Scale the image inside its slot"
          className="w-full accent-navy"
        />
        <ZoomIn className="h-4 w-4 shrink-0 text-midnight/45" />
      </div>
    )}
    <div className="flex w-full min-w-0 items-center gap-1 px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-midnight/60">
        {inSlot ? `Slot ${element.slot + 1}` : element.name}
      </span>
      {inSlot && onReplaceSlot && (
        <button
          type="button"
          onClick={onReplaceSlot}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-navy px-3 text-[11px] font-semibold text-white transition-colors hover:bg-navy/90"
        >
          <Repeat2 className="h-4 w-4" />
          Replace
        </button>
      )}
      {inSlot && onClearSlot && (
        <button
          type="button"
          onClick={onClearSlot}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-divider/70 px-3 text-[11px] font-semibold text-midnight/70 transition-colors hover:border-midnight/30 hover:text-midnight"
        >
          <Eraser className="h-4 w-4" />
          Empty
        </button>
      )}
      <Action label="Bring forward" onClick={() => onReorder("forward")}>
        <ArrowUp className="h-4 w-4" />
      </Action>
      <Action label="Send backward" onClick={() => onReorder("backward")}>
        <ArrowDown className="h-4 w-4" />
      </Action>
      {!inSlot && (
        <>
          <Action label={element.locked ? "Unlock element" : "Lock element"} onClick={onToggleLock} active={element.locked}>
            {element.locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
          </Action>
          <Action label="Duplicate element" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Action>
        </>
      )}
      {!inSlot && (
        <Action label="Delete element" onClick={onDelete} danger>
          <Trash2 className="h-4 w-4" />
        </Action>
      )}
    </div>
    </div>
  );
}

function Action({
  label,
  onClick,
  children,
  active = false,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
        active ? "bg-navy text-white" : danger ? "text-midnight/60 hover:bg-bg hover:text-pink" : "text-midnight/60 hover:bg-bg hover:text-midnight",
      )}
    >
      {children}
    </button>
  );
}
