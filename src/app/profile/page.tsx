"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Settings, Truck, FlaskConical } from "lucide-react";

import { useLocalStorage } from "@/hooks/useLocalStorage";

interface ProfileSettings {
  // Account
  name: string;
  email: string;
  // Preferences
  reduceMotion: boolean;
  hideCents: boolean;
  compactGrid: boolean;
  // Shipping
  zip: string;
  state: string;
}

const defaultSettings: ProfileSettings = {
  name: "",
  email: "",
  reduceMotion: false,
  hideCents: false,
  compactGrid: false,
  zip: "",
  state: "",
};

const US_STATES = [
  "", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

function SectionHeader({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <h2 className="font-headline text-lg tracking-tight text-text">{title}</h2>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-text/60">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-divider/60 bg-surface/50 px-4 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-200"
      />
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1">
        <div className="text-sm font-medium text-text">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-text/50">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 focus:ring-offset-bg ${
          checked ? "bg-accent" : "bg-divider"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-text/60">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-divider/60 bg-surface/50 px-4 text-sm text-text focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-200 appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt || "Select state..."}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ProfilePage() {
  const [settings, setSettings] = useLocalStorage<ProfileSettings>(
    "avnu-profile",
    defaultSettings
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const updateSetting = <K extends keyof ProfileSettings>(
    key: K,
    value: ProfileSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!isHydrated) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 rounded-2xl bg-surface/50" />
        <div className="h-48 rounded-2xl bg-surface/50" />
        <div className="h-32 rounded-2xl bg-surface/50" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8 pb-8"
    >
      {/* Demo Mode Badge */}
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <FlaskConical className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-700">Demo mode</span>
        <span className="text-xs text-amber-600/80">
          — This is a preview environment. Data is stored locally.
        </span>
      </div>

      {/* Account Section */}
      <section className="rounded-2xl border border-divider/50 bg-surface/30 p-6">
        <SectionHeader icon={User} title="Account" />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Name"
            value={settings.name}
            onChange={(v) => updateSetting("name", v)}
            placeholder="Your name"
          />
          <InputField
            label="Email"
            value={settings.email}
            onChange={(v) => updateSetting("email", v)}
            type="email"
            placeholder="you@example.com"
          />
        </div>
      </section>

      {/* Preferences Section */}
      <section className="rounded-2xl border border-divider/50 bg-surface/30 p-6">
        <SectionHeader icon={Settings} title="Preferences" />
        <div className="divide-y divide-divider/30">
          <Toggle
            label="Reduce motion"
            description="Minimize animations throughout the app"
            checked={settings.reduceMotion}
            onChange={(v) => updateSetting("reduceMotion", v)}
          />
          <Toggle
            label="Hide cents"
            description="Show prices as whole numbers (e.g., $25 instead of $25.00)"
            checked={settings.hideCents}
            onChange={(v) => updateSetting("hideCents", v)}
          />
          <Toggle
            label="Compact grid"
            description="Show more products per row"
            checked={settings.compactGrid}
            onChange={(v) => updateSetting("compactGrid", v)}
          />
        </div>
      </section>

      {/* Shipping Section */}
      <section className="rounded-2xl border border-divider/50 bg-surface/30 p-6">
        <SectionHeader icon={Truck} title="Shipping" />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Default ZIP code"
            value={settings.zip}
            onChange={(v) => updateSetting("zip", v)}
            placeholder="12345"
          />
          <SelectField
            label="State"
            value={settings.state}
            onChange={(v) => updateSetting("state", v)}
            options={US_STATES}
          />
        </div>
      </section>
    </motion.div>
  );
}
