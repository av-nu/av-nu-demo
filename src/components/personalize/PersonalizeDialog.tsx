"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowLeft, ArrowRight, Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { interests } from "@/data/interests";
import { useInterests } from "@/hooks/useInterests";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface PersonalizeDialogProps {
  onClose: () => void;
  onToast?: (message: string) => void;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-text" aria-hidden>
      <path fill="currentColor" d="M16.37 12.78c-.03-2.62 2.14-3.88 2.24-3.94-1.22-1.79-3.12-2.03-3.8-2.06-1.61-.16-3.15.95-3.97.95-.82 0-2.08-.93-3.43-.9-1.76.03-3.39 1.03-4.3 2.6-1.84 3.19-.47 7.9 1.31 10.49.87 1.27 1.9 2.69 3.26 2.64 1.31-.05 1.8-.85 3.39-.85 1.58 0 2.03.85 3.42.82 1.41-.02 2.31-1.29 3.17-2.57.99-1.47 1.4-2.9 1.42-2.97-.03-.01-2.72-1.04-2.75-4.13M13.9 4.99c.72-.88 1.21-2.1 1.08-3.32-1.04.04-2.3.69-3.05 1.56-.67.77-1.26 2.01-1.1 3.2 1.16.09 2.35-.59 3.07-1.44" />
    </svg>
  );
}

export function PersonalizeDialog({ onClose, onToast }: PersonalizeDialogProps) {
  const { selected, isSelected, toggle } = useInterests();
  const [, setAccount] = useLocalStorage<{ username: string }>("avnu-account", {
    username: "",
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");

  const canContinue = selected.length >= 1;

  const finish = () => {
    const name = username.trim();
    if (name) setAccount({ username: name });
    onToast?.(name ? `You're all set, @${name}!` : "Preferences saved!");
    onClose();
  };

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-2xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-divider/60 px-5 py-4">
              <div className="flex items-center gap-2">
                {[1, 2].map((s) => (
                  <span
                    key={s}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      step === s ? "w-6 bg-accent" : "w-2 bg-divider",
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {step === 1 ? (
              <>
                <div className="px-5 pt-5">
                  <h2 className="font-headline text-2xl tracking-tight text-text">
                    What are you into?
                  </h2>
                  <p className="mt-1 text-sm text-text/50">
                    Pick a few interests and we&apos;ll tailor your feed.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {interests.map((interest) => {
                      const active = isSelected(interest.id);
                      return (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => toggle(interest.id)}
                          className={cn(
                            "group relative aspect-[4/3] overflow-hidden rounded-2xl ring-2 transition-all",
                            active ? "ring-accent" : "ring-transparent hover:ring-text/20",
                          )}
                        >
                          <Image
                            src={interest.image}
                            alt={interest.label}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div
                            className={cn(
                              "absolute inset-0 transition-colors",
                              active ? "bg-accent/40" : "bg-black/30 group-hover:bg-black/40",
                            )}
                          />
                          <span className="absolute inset-x-0 bottom-0 p-2.5 text-left text-sm font-semibold leading-tight text-white">
                            {interest.label}
                          </span>
                          {active && (
                            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-accent shadow">
                              <Check className="h-4 w-4" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-divider/60 px-5 py-4">
                  <span className="text-sm text-text/50">
                    {selected.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canContinue}
                    className="flex items-center gap-2 rounded-full bg-burgundy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-burgundy/90 disabled:opacity-40"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="mx-auto max-w-sm text-center">
                    <h2 className="font-headline text-2xl tracking-tight text-text">
                      Create your username
                    </h2>
                    <p className="mt-1 text-sm text-text/50">
                      To save your preferences, create a username to continue.
                    </p>

                    {/* Social options (mock) */}
                    <div className="mt-6 space-y-2.5">
                      <button
                        type="button"
                        onClick={finish}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-divider/70 bg-bg py-3 text-sm font-medium text-text transition-colors hover:bg-surface/60"
                      >
                        <GoogleIcon />
                        Continue with Google
                      </button>
                      <button
                        type="button"
                        onClick={finish}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-divider/70 bg-bg py-3 text-sm font-medium text-text transition-colors hover:bg-surface/60"
                      >
                        <AppleIcon />
                        Continue with Apple
                      </button>
                    </div>

                    <div className="my-5 flex items-center gap-3">
                      <span className="h-px flex-1 bg-divider" />
                      <span className="text-xs text-text/40">or</span>
                      <span className="h-px flex-1 bg-divider" />
                    </div>

                    {/* Username */}
                    <div className="text-left">
                      <label className="mb-1.5 block text-xs font-medium text-text/60">
                        Username
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text/40">
                          @
                        </span>
                        <input
                          autoFocus
                          value={username}
                          onChange={(e) =>
                            setUsername(e.target.value.replace(/\s/g, "").toLowerCase())
                          }
                          onKeyDown={(e) => e.key === "Enter" && username.trim() && finish()}
                          placeholder="yourname"
                          className="h-11 w-full rounded-xl border border-divider/60 bg-surface/50 pl-7 pr-4 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={finish}
                      disabled={!username.trim()}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-burgundy py-3 text-sm font-semibold text-white transition-colors hover:bg-burgundy/90 disabled:opacity-40"
                    >
                      <Mail className="h-4 w-4" />
                      Create account
                    </button>

                    <p className="mt-4 text-[11px] leading-relaxed text-text/40">
                      Demo only — no account is actually created. Your interests are saved locally.
                    </p>
                  </div>
                </div>

                <div className="border-t border-divider/60 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-sm font-medium text-text/60 transition-colors hover:text-text"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to interests
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
