"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Star, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { ProductPickerDialog } from "@/components/faves/ProductPickerDialog";
import { getProductById } from "@/lib/data";
import { useVideoReviews } from "@/hooks/useVideoReviews";
import { socialService } from "@/lib/social";
import type { FaveVisibility } from "@/data/faves";

const VISIBILITY: { value: FaveVisibility; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "inner-circle", label: "Inner circle" },
  { value: "private", label: "Private" },
];

export function VideoReviewUploadDialog({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast?: (message: string) => void;
}) {
  const { addVideoReview } = useVideoReviews();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoUrl, setVideoUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(0);
  const [visibility, setVisibility] = useState<FaveVisibility>("public");
  const [pickerOpen, setPickerOpen] = useState(false);

  const product = productId ? getProductById(productId) : undefined;
  const canSubmit = Boolean(videoUrl && productId);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUrl(URL.createObjectURL(file));
    setFileName(file.name);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const id = await addVideoReview({
      productId,
      videoUrl,
      caption: caption.trim(),
      rating: rating || undefined,
      visibility,
    });
    if (visibility === "public" || visibility === "inner-circle") {
      socialService.simulateEngagement({ id, label: caption.trim() || "your video review" });
    }
    onToast?.("Video review published");
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
              <h2 className="font-headline text-lg tracking-tight text-text">New video review</h2>
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
              {/* Video upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFile}
                  className="hidden"
                />
                {videoUrl ? (
                  <div className="relative overflow-hidden rounded-xl bg-surface">
                    <video src={videoUrl} className="aspect-[4/5] w-full object-cover" muted playsInline controls />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-divider/60 text-text/50 transition-colors hover:border-accent/50 hover:text-text/70"
                  >
                    <Upload className="h-7 w-7" />
                    <span className="text-sm font-medium">Upload a video</span>
                    <span className="text-xs">MP4 or MOV</span>
                  </button>
                )}
                {fileName && <p className="mt-1.5 truncate text-xs text-text/40">{fileName}</p>}
              </div>

              {/* Product */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text/60">Product reviewed</label>
                {product ? (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex w-full items-center gap-3 rounded-xl border border-divider/60 p-2 text-left transition-colors hover:border-accent/40"
                  >
                    <span className="relative h-12 w-12 overflow-hidden rounded-lg bg-surface">
                      <Image src={product.images[0]} alt={product.name} fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text">{product.name}</span>
                      <span className="block text-xs text-accent">Change</span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="w-full rounded-xl border border-divider/60 px-4 py-3 text-left text-sm text-text/50 transition-colors hover:border-accent/40"
                  >
                    Choose a product from your faves…
                  </button>
                )}
              </div>

              {/* Rating */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text/60">Your rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                      <Star className={cn("h-7 w-7 transition-colors", n <= rating ? "fill-pink text-pink" : "text-divider")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text/60">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  placeholder="What did you think?"
                  className="w-full resize-none rounded-xl border border-divider/60 bg-surface/50 px-4 py-3 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text/60">Who can see this</label>
                <div className="flex gap-2">
                  {VISIBILITY.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibility(opt.value)}
                      className={cn(
                        "flex-1 rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                        visibility === opt.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-divider/60 text-text/60 hover:border-text/30",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-divider/60 p-3">
              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-burgundy py-3 text-sm font-medium text-white transition-colors hover:bg-burgundy/90 disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
                Publish review
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {pickerOpen && (
        <ProductPickerDialog
          onClose={() => setPickerOpen(false)}
          onSelect={(id) => setProductId(id)}
        />
      )}
    </Portal>
  );
}
