"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, ListPlus, BookOpen, ChevronRight } from "lucide-react";

import { Portal } from "@/components/ui/Portal";
import { VideoReviewUploadDialog } from "./VideoReviewUploadDialog";

type Mode = "choose" | "video";

/**
 * Entry point for creating a profile post: a video review or a published list.
 */
export function AddPostMenu({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast?: (message: string) => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");

  if (mode === "video") {
    return <VideoReviewUploadDialog onClose={onClose} onToast={onToast} />;
  }
  const options = [
    {
      key: "video" as const,
      icon: Camera,
      title: "Moment",
      description: "Review or share how you use a product",
    },
    {
      key: "list" as const,
      icon: ListPlus,
      title: "List",
      description: "Create a private list or share it with a friend",
    },
    {
      key: "lookbook" as const,
      icon: BookOpen,
      title: "Guide",
      description: "Inspire others with your shoppable curation",
    },
  ];

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
            className="w-full overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-divider/60 p-4">
              <h2 className="font-headline text-lg tracking-tight text-text">Add a post</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 p-3">
              {options.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      if (opt.key === "lookbook") {
                        router.push("/create/guide");
                        return;
                      }
                      if (opt.key === "list") {
                        router.push("/create/list");
                        return;
                      }
                      setMode(opt.key);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-divider/60 p-3 text-left transition-colors hover:border-accent/40 hover:bg-surface/50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-text">{opt.title}</span>
                      <span className="block text-xs text-text/50">{opt.description}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-text/30" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
