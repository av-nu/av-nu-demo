"use client";

import { useState } from "react";
import { Check, Globe2, Link2, Lock, Search, UserCheck, Users, X } from "lucide-react";

import { Portal } from "@/components/ui/Portal";
import { getInnerCircle } from "@/data/social";
import type { FaveVisibility } from "@/data/faves";
import { cn } from "@/lib/utils";

type ShareMode = "private" | "inner-all" | "specific" | "public";

type ShareLookbookDialogProps = {
  title: string;
  onClose: () => void;
  onShare: (visibility: FaveVisibility, sharedWith: string[]) => void;
};

const options = [
  { value: "private" as const, label: "Private", description: "Only you can see this Lookbook.", icon: Lock },
  { value: "inner-all" as const, label: "Inner circle", description: "Share with your full inner circle.", icon: Users },
  { value: "specific" as const, label: "Specific people", description: "Choose people from your inner circle.", icon: UserCheck },
  { value: "public" as const, label: "Publish publicly", description: "Post to the community feed with likes and comments.", icon: Globe2 },
];

export function ShareLookbookDialog({ title, onClose, onShare }: ShareLookbookDialogProps) {
  const [mode, setMode] = useState<ShareMode>("public");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const people = getInnerCircle().filter((person) => person.name.toLowerCase().includes(query.trim().toLowerCase()));
  const canShare = mode !== "specific" || selected.length > 0;

  const submit = () => {
    if (!canShare) return;
    onShare(mode === "public" ? "public" : mode === "private" ? "private" : "inner-circle", mode === "specific" ? selected : []);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
        <div className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-md sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-divider/60 p-4">
            <div><h2 className="font-headline text-lg tracking-tight text-text">Share Lookbook</h2><p className="truncate text-xs text-text/50">{title}</p></div>
            <button type="button" onClick={onClose} aria-label="Close sharing" className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 hover:bg-surface"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {options.map((option) => {
              const Icon = option.icon;
              const active = mode === option.value;
              return <button key={option.value} type="button" onClick={() => setMode(option.value)} className={cn("flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors", active ? "border-accent bg-accent/5" : "border-divider/60 hover:border-text/20")}>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", active ? "bg-accent/15 text-accent" : "bg-surface text-text/50")}><Icon className="h-4 w-4" /></span>
                <span className="flex-1"><span className="block text-sm font-medium text-text">{option.label}</span><span className="block text-xs text-text/50">{option.description}</span></span>
                {active && <Check className="mt-1 h-4 w-4 text-accent" />}
              </button>;
            })}
            {mode === "specific" && <div className="rounded-xl border border-divider/60 p-3">
              <div className="relative mb-2"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your inner circle" className="h-9 w-full rounded-lg border border-divider/60 bg-surface/50 pl-9 pr-3 text-sm text-text focus:border-accent/50 focus:outline-none" /></div>
              {people.map((person) => { const checked = selected.includes(person.id); return <button key={person.id} type="button" onClick={() => setSelected((current) => checked ? current.filter((id) => id !== person.id) : [...current, person.id])} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface/60"><span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white", person.color)}>{person.initials}</span><span className="flex-1 text-sm text-text">{person.name}</span><span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", checked ? "border-accent bg-accent text-white" : "border-divider text-transparent")}><Check className="h-3 w-3" /></span></button>; })}
              {selected.length === 0 && <p className="mt-2 text-xs text-pink">Select at least one person.</p>}
            </div>}
          </div>
          <div className="flex gap-2 border-t border-divider/60 p-3"><button type="button" onClick={() => navigator.clipboard.writeText(window.location.href)} className="inline-flex items-center gap-2 rounded-xl border border-divider/60 px-4 py-3 text-sm font-medium text-text/70"><Link2 className="h-4 w-4" />Copy link</button><button type="button" disabled={!canShare} onClick={submit} className="flex-1 rounded-xl bg-burgundy py-3 text-sm font-medium text-white disabled:opacity-40">{mode === "public" ? "Publish post" : "Share Lookbook"}</button></div>
        </div>
      </div>
    </Portal>
  );
}
