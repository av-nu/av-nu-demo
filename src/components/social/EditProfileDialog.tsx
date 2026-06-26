"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { socialService } from "@/lib/social";
import type { MyProfile } from "@/lib/social";

const COLORS = ["bg-burgundy", "bg-accent", "bg-pink"];

export function EditProfileDialog({
  profile,
  onClose,
  onToast,
}: {
  profile: MyProfile;
  onClose: () => void;
  onToast?: (m: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio);
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    await socialService.updateProfile({
      name: name.trim(),
      handle: handle.trim().replace(/^@/, "") || "you",
      bio: bio.trim(),
      avatarColor,
      avatarUrl,
    });
    onToast?.("Profile updated");
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
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-divider/60 p-4">
              <h2 className="font-headline text-lg tracking-tight text-text">Edit profile</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <span className={cn("flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-xl font-semibold text-white", avatarColor)}>
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    (name.trim()[0] || "Y").toUpperCase()
                  )}
                </span>
                <div className="space-y-2">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-full border border-divider/60 px-3 py-1.5 text-xs font-medium text-text/70 transition-colors hover:bg-surface"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload photo
                  </button>
                  <div className="flex items-center gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setAvatarColor(c);
                          setAvatarUrl(undefined);
                        }}
                        aria-label={`Use ${c} avatar`}
                        className={cn("h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-bg", c, avatarColor === c && !avatarUrl ? "ring-text/40" : "ring-transparent")}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
              <Field label="Handle" value={handle} onChange={setHandle} placeholder="username" prefix="@" />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text/60">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell people what you're into"
                  className="w-full resize-none rounded-xl border border-divider/60 bg-surface/50 px-4 py-3 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <div className="border-t border-divider/60 p-3">
              <button
                type="button"
                onClick={handleSave}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-burgundy py-3 text-sm font-medium text-white transition-colors hover:bg-burgundy/90"
              >
                <Check className="h-4 w-4" />
                Save profile
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-text/60">{label}</label>
      <div className="flex items-center rounded-xl border border-divider/60 bg-surface/50 px-4 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20">
        {prefix && <span className="text-sm text-text/40">{prefix}</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full bg-transparent text-sm text-text placeholder:text-text/40 focus:outline-none"
        />
      </div>
    </div>
  );
}
