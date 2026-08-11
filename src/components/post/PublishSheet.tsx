"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Lock, Users, X } from "lucide-react";

import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import { Portal } from "@/components/ui/Portal";
import { cn } from "@/lib/utils";
import type { FaveVisibility } from "@/data/faves";
import { postCoverPage, type Post } from "@/lib/post";

const VISIBILITY: Array<{ value: FaveVisibility; label: string; icon: typeof Globe; hint: string }> = [
  { value: "public", label: "Everyone", icon: Globe, hint: "Shown in Discover" },
  { value: "inner-circle", label: "Inner circle", icon: Users, hint: "Only people you're connected to" },
  { value: "private", label: "Only me", icon: Lock, hint: "Kept to your profile" },
];

/** Final step before a post is saved: caption, audience, and a cover preview. */
export function PublishSheet({
  post,
  publishing,
  error,
  onPublish,
  onClose,
}: {
  post: Post;
  publishing: boolean;
  error?: string;
  onPublish: (caption: string, visibility: FaveVisibility) => void;
  onClose: () => void;
}) {
  const [caption, setCaption] = useState(post.caption);
  const [visibility, setVisibility] = useState<FaveVisibility>(post.visibility);
  const cover = postCoverPage(post);

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-5"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-center gap-2 border-b border-divider/60 px-4 py-3">
              <h2 className="min-w-0 flex-1 truncate font-headline text-lg text-midnight">Share your post</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-midnight/55 hover:bg-surface">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="flex gap-3">
                <span className="w-20 shrink-0 overflow-hidden rounded-xl border border-divider/60">
                  <EditorialRenderer design={cover.design} />
                </span>
                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  rows={4}
                  placeholder="Say something about this…"
                  className="min-w-0 flex-1 resize-none rounded-xl border border-divider/70 bg-surface/40 px-3 py-2 text-sm text-midnight placeholder:text-midnight/40 focus:border-accent/50 focus:outline-none"
                />
              </div>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-midnight/40">Who can see it</p>
              <div className="mt-2 space-y-1.5">
                {VISIBILITY.map(({ value, label, icon: Icon, hint }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVisibility(value)}
                    aria-pressed={visibility === value}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      visibility === value ? "border-navy bg-navy/10" : "border-divider/60 hover:border-midnight/25",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-midnight/60" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-midnight">{label}</span>
                      <span className="block text-[11px] text-midnight/55">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-4 text-[11px] text-midnight/45">
                {post.pages.length} {post.pages.length === 1 ? "page" : "pages"} · {post.productIds.length} {post.productIds.length === 1 ? "product" : "products"}
              </p>

              {error && (
                <p role="alert" className="mt-3 rounded-xl border border-pink/30 bg-pink/5 px-3 py-2 text-xs font-medium text-pink">
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-divider/60 p-3">
              <button
                type="button"
                disabled={publishing}
                onClick={() => onPublish(caption.trim(), visibility)}
                className="w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
