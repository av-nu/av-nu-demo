"use client";

import { useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Sparkles, X } from "lucide-react";

import { Portal } from "@/components/ui/Portal";
import { useAuth } from "@/hooks/useAuth";

export function AccountInvitationDialog({
  open,
  action,
  onClose,
  onAuthenticated,
}: {
  open: boolean;
  action?: string;
  onClose: () => void;
  onAuthenticated?: () => void;
}) {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    signUp({ name: name.trim() || "there", email: trimmedEmail });
    onClose();
    onAuthenticated?.();
  };

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[220] flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: 28, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 28, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full rounded-t-3xl bg-bg p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-pink/10 px-3 py-1 text-xs font-semibold text-pink">
                    <Sparkles className="h-3.5 w-3.5" />
                    Join av | nu
                  </span>
                  <h2 className="mt-3 font-headline text-2xl tracking-tight text-text">Make it yours</h2>
                  <p className="mt-1 text-sm leading-relaxed text-text/60">
                    {action ? `Create an account to ${action}.` : "Create an account to keep your ideas and favorites together."}
                  </p>
                </div>
                <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text/50 hover:bg-surface hover:text-text">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={submit} className="mt-5 space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-text/60">Name</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" className="h-11 w-full rounded-xl border border-divider/60 bg-surface/50 px-3 text-sm text-text outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-text/60">Email</span>
                  <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" className="h-11 w-full rounded-xl border border-divider/60 bg-surface/50 px-3 text-sm text-text outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20" />
                </label>
                <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-navy/90">
                  <Mail className="h-4 w-4" />
                  Continue with email
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<string>();
  const pending = useRef<(() => void) | undefined>();

  const requireAuth = useCallback((nextAction: string, callback?: () => void) => {
    if (isAuthenticated) {
      callback?.();
      return true;
    }
    pending.current = callback;
    setAction(nextAction);
    setOpen(true);
    return false;
  }, [isAuthenticated]);

  const close = useCallback(() => {
    pending.current = undefined;
    setOpen(false);
  }, []);

  const complete = useCallback(() => {
    const callback = pending.current;
    pending.current = undefined;
    setOpen(false);
    callback?.();
  }, []);

  return {
    isAuthenticated,
    requireAuth,
    invitation: <AccountInvitationDialog open={open} action={action} onClose={close} onAuthenticated={complete} />,
  };
}
