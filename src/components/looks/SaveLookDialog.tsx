"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Sparkles, X } from "lucide-react";

import { Portal } from "@/components/ui/Portal";
import { useAuth } from "@/hooks/useAuth";

type SaveLookDialogProps = {
  onClose: () => void;
  onCreatedAccount: () => void;
};

export function SaveLookDialog({ onClose, onCreatedAccount }: SaveLookDialogProps) {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    signUp({ name: name.trim() || "avnu shopper", email: email.trim() });
    onCreatedAccount();
  };

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full rounded-t-3xl bg-bg p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-burgundy/10 text-burgundy">
                <Sparkles className="h-5 w-5" />
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-4 font-headline text-2xl tracking-tight text-text">Save this look to your profile</h2>
            <p className="mt-2 text-sm leading-relaxed text-text/55">
              Create an account to keep, edit, and reopen this look whenever you want.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-text/60">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="h-11 w-full rounded-xl border border-divider/60 bg-surface/50 px-4 text-sm text-text placeholder:text-text/40 focus:border-ember/50 focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-text/60">Email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-11 w-full rounded-xl border border-divider/60 bg-surface/50 px-4 text-sm text-text placeholder:text-text/40 focus:border-ember/50 focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
              </label>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3 text-sm font-semibold text-white transition-colors hover:bg-navy/90"
              >
                <Mail className="h-4 w-4" />
                Create account & save look
              </button>
            </form>
            <p className="mt-3 text-center text-xs text-text/40">Demo mode — your account and saved look stay on this device.</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
