"use client";

import { ArrowDown, ArrowUp, Copy, Lock, LockOpen, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { EditorialElement } from "@/lib/editorial";

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
}: {
  element: EditorialElement;
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: (direction: "forward" | "backward") => void;
  onToggleLock: () => void;
}) {
  return (
    <div className="flex w-full min-w-0 shrink-0 items-center gap-1 border-t border-divider/60 bg-surface/40 px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-midnight/60">{element.name}</span>
      <Action label="Bring forward" onClick={() => onReorder("forward")}>
        <ArrowUp className="h-4 w-4" />
      </Action>
      <Action label="Send backward" onClick={() => onReorder("backward")}>
        <ArrowDown className="h-4 w-4" />
      </Action>
      <Action label={element.locked ? "Unlock element" : "Lock element"} onClick={onToggleLock} active={element.locked}>
        {element.locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
      </Action>
      <Action label="Duplicate element" onClick={onDuplicate}>
        <Copy className="h-4 w-4" />
      </Action>
      <Action label="Delete element" onClick={onDelete} danger>
        <Trash2 className="h-4 w-4" />
      </Action>
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
