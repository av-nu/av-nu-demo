"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { ProductPickerDialog } from "@/components/faves/ProductPickerDialog";
import { getProductById } from "@/lib/data";
import { useVideoReviews } from "@/hooks/useVideoReviews";
import { socialService } from "@/lib/social";
import type { FaveVisibility } from "@/data/faves";

type MediaOrientation = "portrait" | "landscape";

const VISIBILITY: { value: FaveVisibility; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "inner-circle", label: "Inner circle" },
  { value: "private", label: "Private" },
];

export function VideoReviewUploadDialog({
  onClose,
  onToast,
  onPublished,
}: {
  onClose: () => void;
  onToast?: (message: string) => void;
  onPublished?: () => void;
}) {
  const { addVideoReview } = useVideoReviews();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video">("video");
  const [mediaOrientation, setMediaOrientation] = useState<MediaOrientation>("portrait");
  const [fileName, setFileName] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<FaveVisibility>("public");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [publishOptionsOpen, setPublishOptionsOpen] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);

  const product = productId ? getProductById(productId) : undefined;
  const canSubmit = Boolean(mediaUrl);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateScrollCue = () => {
      setCanScrollMore(content.scrollTop + content.clientHeight < content.scrollHeight - 12);
    };

    updateScrollCue();
    const resizeObserver = new ResizeObserver(updateScrollCue);
    resizeObserver.observe(content);
    return () => resizeObserver.disconnect();
  }, [caption, mediaOrientation, mediaUrl, pickerOpen, productId, visibility]);

  const updateOrientation = (width: number, height: number) => {
    if (width > 0 && height > 0) setMediaOrientation(width >= height ? "landscape" : "portrait");
  };

  const mediaFrameClass = mediaOrientation === "portrait"
    ? "mx-auto aspect-[9/16] h-[min(38vh,360px)] w-full max-w-[220px]"
    : "aspect-video h-[min(28vh,240px)] w-full";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaUrl(URL.createObjectURL(file));
    setMediaType(file.type.startsWith("image/") ? "image" : "video");
    setFileName(file.name);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const id = await addVideoReview({
      productId: productId || undefined,
      videoUrl: mediaType === "video" ? mediaUrl : undefined,
      mediaUrl,
      mediaType,
      caption: caption.trim(),
      visibility,
    });
    if (visibility === "public" || visibility === "inner-circle") {
      socialService.simulateEngagement({ id, label: caption.trim() || "your moment" });
    }
    onToast?.("Moment published");
    if (onPublished) onPublished();
    else onClose();
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
            className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-xl sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-divider/60 p-4">
              <h2 className="font-headline text-lg tracking-tight text-text">New moment</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1">
              <div ref={contentRef} onScroll={(event) => {
                const content = event.currentTarget;
                setCanScrollMore(content.scrollTop + content.clientHeight < content.scrollHeight - 12);
              }} className="h-full space-y-3 overflow-y-auto px-4 pb-28 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-text/60">Media format</span>
                <div className="flex rounded-full border border-divider/60 bg-surface/40 p-1">
                  {([ ["portrait", "Vertical 9:16"], ["landscape", "Horizontal 16:9"] ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMediaOrientation(value)}
                      aria-pressed={mediaOrientation === value}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                        mediaOrientation === value ? "bg-text text-bg" : "text-text/55 hover:text-text",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFile}
                  className="hidden"
                />
                {mediaUrl ? (
                  <div className={`relative ${mediaFrameClass} min-h-[160px] overflow-hidden rounded-xl bg-surface`}>
                    {mediaType === "image" ? <Image src={mediaUrl} alt="Moment upload" fill unoptimized onLoad={(event) => updateOrientation(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)} className="object-contain" /> : <video src={mediaUrl} onLoadedMetadata={(event) => updateOrientation(event.currentTarget.videoWidth, event.currentTarget.videoHeight)} className="h-full w-full object-contain" muted playsInline controls />}
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
                    className={`flex ${mediaFrameClass} min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-divider/60 text-text/50 transition-colors hover:border-accent/50 hover:text-text/70`}
                  >
                    <Upload className="h-7 w-7" />
                    <span className="text-sm font-medium">Upload an image or video</span>
                    <span className="text-xs">JPG, PNG, MP4, or MOV</span>
                  </button>
                )}
                {fileName && <p className="mt-1.5 truncate text-xs text-text/40">{fileName}</p>}
              </div>

              {/* Product */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text/60">Add a product <span className="font-normal text-text/40">(optional)</span></label>
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

              {/* Caption */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text/60">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={2}
                  placeholder="What did you think?"
                  className="w-full resize-none rounded-xl border border-divider/60 bg-surface/50 px-4 py-3 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              </div>
              {canScrollMore && (
                <button
                  type="button"
                  onClick={() => contentRef.current?.scrollBy({ top: 220, behavior: "smooth" })}
                  className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-divider/70 bg-bg/95 px-3 py-1.5 text-xs font-medium text-text shadow-lg backdrop-blur-sm"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-accent" />
                  More options below
                </button>
              )}
            </div>

            {publishOptionsOpen && (
              <div className="absolute inset-x-3 bottom-[4.5rem] z-20 rounded-2xl border border-divider/70 bg-bg p-4 shadow-2xl">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">Who can see this?</p>
                    <p className="mt-0.5 text-xs text-text/50">Choose an audience before publishing.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublishOptionsOpen(false)}
                    className="rounded-full px-2 py-1 text-xs font-medium text-text/50 hover:bg-surface hover:text-text"
                  >
                    Back
                  </button>
                </div>
                <div className="flex gap-2">
                  {VISIBILITY.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibility(opt.value)}
                      className={cn(
                        "flex-1 rounded-full border px-2 py-2 text-xs font-medium transition-colors",
                        visibility === opt.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-divider/60 text-text/60 hover:border-text/30",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-burgundy py-2.5 text-sm font-medium text-white transition-colors hover:bg-burgundy/90"
                >
                  <Check className="h-4 w-4" />
                  Publish moment
                </button>
              </div>
            )}

            <div className="shrink-0 border-t border-divider/60 px-3 pb-3 pt-2">
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => setPublishOptionsOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-burgundy py-2.5 text-sm font-medium text-white transition-colors hover:bg-burgundy/90 disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
                Publish
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
