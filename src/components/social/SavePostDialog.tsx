"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FolderPlus, Plus, X } from "lucide-react";

import { Portal } from "@/components/ui/Portal";
import { useSavedPostGroups } from "@/hooks/useSavedPostGroups";

export function SavePostDialog({ postId, onClose, onToast, onSaved }: { postId: string; onClose: () => void; onToast?: (message: string) => void; onSaved?: () => void }) {
  const { groups, addToGroup, removeFromGroup, isInGroup, createGroup } = useSavedPostGroups();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const toggleGroup = (groupId: string, groupName: string) => {
    if (isInGroup(groupId, postId)) {
      removeFromGroup(groupId, postId);
      onToast?.(`Removed from ${groupName}`);
    } else {
      addToGroup(groupId, postId);
      onSaved?.();
      onToast?.(`Saved to ${groupName}`);
    }
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    createGroup(name, postId);
    onSaved?.();
    onToast?.(`Created “${name.trim()}” and saved the post`);
    setName("");
    setCreating(false);
  };

  return (
    <Portal>
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[130] flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
          <motion.div initial={{ y: 28, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 28, opacity: 0 }} onClick={(event) => event.stopPropagation()} className="w-full overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-md sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-divider/60 p-4"><div><h2 className="font-headline text-lg text-text">Save post to</h2><p className="text-xs text-text/50">Choose one or more post collections.</p></div><button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 hover:bg-surface"><X className="h-4 w-4" /></button></div>
            <div className="max-h-[50vh] overflow-y-auto p-2">{groups.map((group) => { const selected = isInGroup(group.id, postId); return <button key={group.id} type="button" onClick={() => toggleGroup(group.id, group.name)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-surface"><span className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected ? "bg-accent/15 text-accent" : "bg-surface text-text/40"}`}><FolderPlus className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text">{group.name}</span><span className="block text-xs text-text/50">{group.postIds.length} saved {group.postIds.length === 1 ? "post" : "posts"}</span></span>{selected && <Check className="h-5 w-5 text-accent" />}</button>; })}</div>
            <div className="border-t border-divider/60 p-3">{creating ? <div className="space-y-2"><input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleCreate()} placeholder="e.g. Weekend inspiration" className="h-11 w-full rounded-xl border border-divider bg-surface/40 px-3 text-sm focus:border-accent/50 focus:outline-none" /><div className="flex gap-2"><button type="button" onClick={() => setCreating(false)} className="flex-1 rounded-xl border border-divider py-2.5 text-sm text-text/65">Cancel</button><button type="button" onClick={handleCreate} disabled={!name.trim()} className="flex-1 rounded-xl bg-text py-2.5 text-sm font-semibold text-bg disabled:opacity-40">Create</button></div></div> : <button type="button" onClick={() => setCreating(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-divider py-3 text-sm font-semibold text-text/65 hover:border-accent hover:text-accent"><Plus className="h-4 w-4" />Create new post collection</button>}</div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
