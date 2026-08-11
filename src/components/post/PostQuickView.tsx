"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { PostCard } from "@/components/post/PostCard";
import { Portal } from "@/components/ui/Portal";
import type { Post } from "@/lib/post";
import type { SocialUser } from "@/lib/social";

/** A post opened from the feed, using the same card so the two cannot diverge. */
export function PostQuickView({
  post,
  author,
  liked,
  saved,
  onLike,
  onSave,
  onShare,
  onProductClick,
  onClose,
}: {
  post: Post;
  author: Pick<SocialUser, "name" | "initials" | "color" | "avatarUrl">;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onProductClick?: (productId: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-5"
        >
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-bg sm:max-w-lg sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close post"
              className="sticky right-0 top-0 z-20 ml-auto mr-2 mt-2 flex h-10 w-10 items-center justify-center rounded-full border border-divider/70 bg-bg/95 text-midnight/70 shadow-sm backdrop-blur hover:bg-surface"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="-mt-10">
              <PostCard
                post={post}
                author={author}
                liked={liked}
                saved={saved}
                onLike={onLike}
                onComment={() => undefined}
                onSave={onSave}
                onShare={onShare}
                onOpen={() => undefined}
                onProductClick={onProductClick}
                showPins
              />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
