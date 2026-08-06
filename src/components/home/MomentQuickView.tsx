"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { VideoReviewCard } from "@/components/social/VideoReviewCard";
import { Portal } from "@/components/ui/Portal";
import type { VideoReview, SocialUser } from "@/lib/social";

export function MomentQuickView({
  review,
  author,
  onClose,
}: {
  review: VideoReview;
  author: SocialUser;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
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
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm lg:items-center lg:p-5"
        >
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-bg p-3 shadow-2xl sm:p-5 lg:rounded-3xl"
          >
            <VideoReviewCard review={review} author={author} />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
