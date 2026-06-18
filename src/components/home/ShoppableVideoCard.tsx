"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Send, ShoppingBag, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Product } from "@/data/mockProducts";
import { getBrandById } from "@/lib/data";
import { FaveButton } from "@/components/faves/FaveButton";
import { useCart } from "@/hooks/useCart";

interface ShoppableVideoCardProps {
  videoUrl: string;
  product: Product;
  onShare?: (message: string) => void;
}

export function ShoppableVideoCard({
  videoUrl,
  product,
  onShare,
}: ShoppableVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const brand = getBrandById(product.brandId);
  const { addToCart } = useCart();

  const productHref = `/product/${product.id}`;

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  }, []);

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const url = `${window.location.origin}${productHref}`;
      try {
        if (navigator.share && navigator.canShare?.({ url })) {
          await navigator.share({ title: product.name, url });
        } else {
          await navigator.clipboard.writeText(url);
          onShare?.("Link copied to clipboard");
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(url);
          onShare?.("Link copied to clipboard");
        }
      }
    },
    [productHref, product.name, onShare],
  );

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addToCart(product.id, product.brandId);
      onShare?.("Added to cart");
    },
    [product.id, product.brandId, addToCart, onShare],
  );

  return (
    <div className="flex flex-col">
      {/* Shoppable video */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
        <video
          ref={videoRef}
          src={videoUrl}
          className="h-full w-full cursor-pointer object-cover"
          autoPlay
          muted
          playsInline
          loop
          onClick={togglePlayback}
        />

        {product.isNew && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            New
          </span>
        )}

        {/* Paused overlay: play button + view product CTA */}
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/30"
            onClick={togglePlayback}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-text shadow-lg">
              <Play className="ml-0.5 h-7 w-7 fill-text" />
            </span>
            <Link
              href={productHref}
              onClick={(e) => e.stopPropagation()}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-text shadow-lg transition-colors hover:bg-white/90"
            >
              View product
            </Link>
          </motion.div>
        )}
      </div>

      {/* Product card features */}
      <div className="mt-4">
        <div className="flex gap-3">
          {/* Small square product photo */}
          <Link
            href={productHref}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface"
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-text/50">
                  {brand?.name ?? "Brand"}
                </p>
                <Link
                  href={productHref}
                  className="line-clamp-1 font-headline text-sm font-medium text-text transition-colors hover:text-accent"
                >
                  {product.name}
                </Link>
              </div>

              {/* Save + share */}
              <div className="flex shrink-0 items-center gap-1">
                <FaveButton product={product} onToast={onShare} variant="plain" />
                <button
                  type="button"
                  aria-label="Share product"
                  onClick={handleShare}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text/80"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Short description */}
            <p className="mt-1 line-clamp-2 text-xs text-text/60">
              {product.description}
            </p>
          </div>
        </div>

        {/* Reviews + price */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs text-text/70">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              {product.rating.toFixed(1)}
            </span>
            <span className="text-xs text-text/40">
              ({product.ratingCount} reviews)
            </span>
          </div>
          <span className="text-base font-semibold text-text">${product.price}</span>
        </div>

        {/* Add to cart — full card width */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-text py-3 text-sm font-medium text-bg transition-colors hover:bg-text/90"
        >
          <ShoppingBag className="h-4 w-4" />
          Add to cart
        </button>
      </div>
    </div>
  );
}
