"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Mail, Send, X } from "lucide-react";

import { contacts } from "@/data/social";
import { Portal } from "@/components/ui/Portal";
import { useSocialGraph } from "@/hooks/useSocialGraph";

export function SharePostDialog({ postTitle, onClose, onToast }: { postTitle: string; onClose: () => void; onToast?: (message: string) => void }) {
  const { innerCircle } = useSocialGraph();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string[]>([]);

  const shareWith = (name: string) => {
    setSentTo((current) => current.includes(name) ? current : [...current, name]);
    onToast?.(`Shared ${postTitle} with ${name}`);
  };

  const shareByEmail = () => {
    if (!email.includes("@")) return;
    onToast?.(`Shared ${postTitle} by email`);
    setEmail("");
  };

  return <Portal><AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[130] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"><motion.div initial={{ y: 28, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 28, opacity: 0 }} onClick={(event) => event.stopPropagation()} className="w-full rounded-t-3xl bg-bg p-5 shadow-xl sm:max-w-md sm:rounded-3xl"><div className="flex items-center justify-between"><div><h2 className="font-headline text-lg text-text">Share post</h2><p className="mt-1 line-clamp-1 text-xs text-text/50">{postTitle}</p></div><button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 hover:bg-surface"><X className="h-4 w-4" /></button></div><div className="mt-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-text/45">Share with Inner Circle</p><div className="mt-2 space-y-1">{innerCircle.map((person) => { const contact = contacts.find((item) => item.id === person.id); if (!contact) return null; const sent = sentTo.includes(contact.name); return <button key={contact.id} type="button" onClick={() => shareWith(contact.name)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-surface"><span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${contact.color}`}>{contact.initials}</span><span className="flex-1 text-sm font-semibold text-text">{contact.name}</span>{sent ? <Check className="h-4 w-4 text-accent" /> : <Send className="h-4 w-4 text-text/35" />}</button>; })}</div></div><div className="mt-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-text/45">Share with a friend by email</p><div className="mt-2 flex gap-2"><div className="relative min-w-0 flex-1"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/35" /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="friend@example.com" className="h-10 w-full rounded-full border border-divider bg-surface/40 pl-9 pr-3 text-sm focus:border-accent/50 focus:outline-none" /></div><button type="button" onClick={shareByEmail} disabled={!email.includes("@")} className="rounded-full bg-text px-4 text-xs font-semibold text-bg disabled:opacity-40">Send</button></div></div></motion.div></motion.div></AnimatePresence></Portal>;
}
