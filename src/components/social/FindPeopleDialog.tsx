"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { Portal } from "@/components/ui/Portal";
import { UserSearch } from "./UserSearch";

/**
 * Modal wrapper around UserSearch so people can be found and added (follow /
 * inner circle) from anywhere — e.g. the profile's inner-circle section.
 */
export function FindPeopleDialog({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast?: (message: string) => void;
}) {
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
            className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-divider/60 p-4">
              <div>
                <h2 className="font-headline text-lg tracking-tight text-text">Find people</h2>
                <p className="text-xs text-text/50">Follow or add people to your inner circle</p>
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

            <div className="flex-1 overflow-y-auto p-4">
              <UserSearch onToast={onToast} />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
