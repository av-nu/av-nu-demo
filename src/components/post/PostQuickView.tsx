"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { PostDetail } from "@/components/post/PostDetail";
import { Portal } from "@/components/ui/Portal";
import type { Post } from "@/lib/post";
import type { SocialUser } from "@/lib/social";

/**
 * A post opened from a feed or grid. The body is shared with the post page, so
 * opening a post from a link and from the feed give the same thing.
 */
export function PostQuickView({
  post,
  author,
  liked,
  saved,
  onLike,
  onSave,
  onShare,
  onComment,
  onProductClick,
  onClose,
}: {
  post: Post;
  author: Pick<SocialUser, "id" | "name" | "handle" | "initials" | "color" | "avatarUrl" | "isCurrentUser">;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onComment?: (text: string) => void;
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
          // Below the product popover, so a tapped product opens over the post.
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-5"
        >
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            // One scroll column on a phone; two panes where there is width for a rail.
            className="relative flex max-h-[92dvh] min-h-0 w-full touch-pan-y flex-col overscroll-contain overflow-y-auto rounded-t-3xl bg-bg md:max-h-[86dvh] md:max-w-4xl md:flex-row md:overflow-hidden md:rounded-3xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close post"
              className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-divider/70 bg-bg/95 text-midnight/70 shadow-sm backdrop-blur hover:bg-surface"
            >
              <X className="h-5 w-5" />
            </button>

            <PostDetail
              post={post}
              author={author}
              liked={liked}
              saved={saved}
              onLike={onLike}
              onSave={onSave}
              onShare={onShare}
              onComment={onComment}
              onProductClick={onProductClick}
              headerInset
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
