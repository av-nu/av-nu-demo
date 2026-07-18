"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Mail, Send, X } from "lucide-react";

import type { Product } from "@/data/mockProducts";
import { contacts } from "@/data/social";
import { Portal } from "@/components/ui/Portal";
import { useSocialGraph } from "@/hooks/useSocialGraph";

export function ShareProductDialog({ product, onClose, onToast }: { product: Product; onClose: () => void; onToast?: (message: string) => void }) {
  const { innerCircle } = useSocialGraph();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string[]>([]);

  const shareWithPerson = (name: string) => {
    setSentTo((current) => current.includes(name) ? current : [...current, name]);
    onToast?.(`Shared ${product.name} with ${name}`);
  };

  const shareByEmail = () => {
    if (!email.trim() || !email.includes("@")) return;
    onToast?.(`Shared ${product.name} by email`);
    setEmail("");
  };

  return (
    <Portal>
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
          <motion.div initial={{ y: 32, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 32, opacity: 0 }} onClick={(event) => event.stopPropagation()} className="w-full overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-md sm:rounded-3xl">
            <div className="flex items-center gap-3 border-b border-divider/60 p-4">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-surface"><Image src={product.images[0]} alt={product.name} fill sizes="48px" className="object-cover" /></div>
              <div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-[0.14em] text-text/45">Share product</p><p className="truncate font-headline text-base text-text">{product.name}</p></div>
              <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 hover:bg-surface"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-5 p-4">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-text/45">Share with Inner Circle</h3>
                <div className="mt-2 space-y-1">
                  {innerCircle.length === 0 && <p className="rounded-xl bg-surface/60 p-3 text-sm text-text/50">Add people to your Inner Circle to share privately.</p>}
                  {innerCircle.map((person) => { const contact = contacts.find((item) => item.id === person.id); if (!contact) return null; const sent = sentTo.includes(contact.name); return <button key={contact.id} type="button" onClick={() => shareWithPerson(contact.name)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-surface"><span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${contact.color}`}>{contact.initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text">{contact.name}</span><span className="block truncate text-xs text-text/50">@{contact.handle}</span></span>{sent ? <Check className="h-4 w-4 text-accent" /> : <Send className="h-4 w-4 text-text/35" />}</button>; })}
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-text/45">Share with a friend by email</h3>
                <div className="mt-2 flex gap-2"><div className="relative min-w-0 flex-1"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/35" /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="friend@example.com" className="h-10 w-full rounded-full border border-divider bg-surface/40 pl-9 pr-3 text-sm focus:border-accent/50 focus:outline-none" /></div><button type="button" onClick={shareByEmail} disabled={!email.includes("@")} className="rounded-full bg-text px-4 text-xs font-semibold text-bg disabled:opacity-40">Send</button></div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
