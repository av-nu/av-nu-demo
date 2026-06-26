"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Mail, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

/**
 * Dynamic post-purchase account block, rendered inside the confirmation card.
 * Guests get a Clerk-style sign-up (social options + prefilled name/email);
 * signed-in shoppers get a personalized confirmation that the order was saved.
 */
export function AccountUpsell({
  defaultName,
  defaultEmail,
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const { isAuthenticated, user, signUp } = useAuth();
  const [name, setName] = useState(defaultName ?? "");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    signUp({ name: name.trim() || "there", email: email.trim() });
    setJustSignedUp(true);
  };

  const handleSocial = () => {
    signUp({
      name: name.trim() || defaultName || "there",
      email: email.trim() || defaultEmail || "",
    });
    setJustSignedUp(true);
  };

  // Signed-in (either pre-existing session or just-completed sign-up).
  if (isAuthenticated) {
    const firstName = (user?.name ?? "").trim().split(" ")[0];
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center sm:p-7"
      >
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Check className="h-5 w-5" />
        </span>
        <h2 className="mt-4 font-headline text-xl tracking-tight text-text">
          {justSignedUp
            ? `You're all set${firstName ? `, ${firstName}` : ""}!`
            : `Saved to your account${firstName ? `, ${firstName}` : ""}`}
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-text/60">
          We&apos;ve linked this order to your account and you&apos;re earning
          points. Track it and manage returns anytime from your orders.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="plum" size="sm">
            <Link href="/orders">View your orders</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Keep shopping</Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  // Guest sign-up (Clerk-style).
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-divider/60 bg-bg/70 p-6 text-left sm:p-7"
    >
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-pink/10 px-3 py-1 text-xs font-medium text-pink">
          <Sparkles className="h-3.5 w-3.5" />
          Start earning points
        </span>
        <h2 className="mt-3 font-headline text-2xl tracking-tight text-text">
          Create your account
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-text/60">
          Sign up to start earning points on this purchase.
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-sm space-y-2.5">
        <SocialButton provider="google" onClick={handleSocial} />
        <SocialButton provider="apple" onClick={handleSocial} />
        {!showEmailForm && (
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-divider/70 bg-bg px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface"
          >
            <Mail className="h-4 w-4 text-text/60" />
            Sign up with email
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {showEmailForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onSubmit={handleSubmit}
            className="mx-auto mt-4 max-w-sm space-y-3 overflow-hidden"
          >
            <Field
              label="Name"
              value={name}
              onChange={setName}
              placeholder="Your name"
              autoComplete="name"
            />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Create a password"
              autoComplete="new-password"
            />
            <Button type="submit" variant="plum" size="lg" className="mt-1 w-full">
              Create account
            </Button>
            <p className="text-center text-xs text-text/40">
              We&apos;ll attach your recent order automatically.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SocialButton({
  provider,
  onClick,
}: {
  provider: "google" | "apple";
  onClick: () => void;
}) {
  const label = provider === "google" ? "Continue with Google" : "Continue with Apple";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-divider/70 bg-bg px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface"
    >
      {provider === "google" ? <GoogleIcon /> : <AppleIcon />}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.36 12.78c-.02-2.06 1.68-3.05 1.76-3.1-0.96-1.4-2.45-1.6-2.98-1.62-1.27-.13-2.48.75-3.12.75-.64 0-1.64-.73-2.7-.71-1.39.02-2.67.81-3.38 2.05-1.44 2.5-.37 6.2 1.03 8.23.69.99 1.5 2.1 2.57 2.06 1.03-.04 1.42-.66 2.67-.66 1.24 0 1.6.66 2.69.64 1.11-.02 1.81-1 2.49-2 .78-1.15 1.1-2.26 1.12-2.32-.02-.01-2.15-.83-2.17-3.29ZM14.3 6.73c.57-.69.95-1.65.85-2.6-.82.03-1.81.54-2.4 1.23-.53.61-.99 1.58-.87 2.51.91.07 1.85-.46 2.42-1.14Z" />
    </svg>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-text/60">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-divider/60 bg-surface/50 px-4 py-2.5 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
