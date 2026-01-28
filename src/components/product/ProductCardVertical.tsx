"use client";

import { memo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Share2 } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { Product } from "@/data/mockProducts";
import { getBrandById } from "@/lib/data";
import { StarRating } from "@/components/ui/StarRating";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserRatings } from "@/hooks/useUserRatings";

interface ProductCardVerticalProps {
  product: Product;
  priority?: boolean;
  onShare?: (message: string) => void;
}

export const ProductCardVertical = memo(function ProductCardVertical({
  product,
  priority = false,
  onShare,
}: ProductCardVerticalProps) {
  const brand = getBrandById(product.brandId);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getUserRating, setUserRating } = useUserRatings();
  const [imageLoaded, setImageLoaded] = useState(false);

  const favorite = isFavorite(product.id);
  const userRating = getUserRating(product.id);

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(product.id);
    },
    [product.id, toggleFavorite],
  );

  const handleShareClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const url = `${window.location.origin}/product/${product.id}`;
      const shareData = {
        title: product.name,
        text: `Check out ${product.name} on av | nu`,
        url,
      };

      try {
        if (navigator.share && navigator.canShare?.(shareData)) {
          await navigator.share(shareData);
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
    [product.id, product.name, onShare],
  );

  const handleRate = useCallback(
    (rating: number) => {
      setUserRating(product.id, rating);
    },
    [product.id, setUserRating],
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      className="group relative flex gap-4 rounded-2xl border border-divider/50 bg-surface/30 p-4 transition-colors hover:bg-surface/50"
    >
      <Link
        href={`/product/${product.id}`}
        className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-surface"
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="112px"
          priority={priority}
          onLoad={() => setImageLoaded(true)}
          className={cn(
            "object-cover transition-all duration-500 group-hover:scale-105",
            imageLoaded ? "opacity-100" : "opacity-0",
          )}
        />

        {product.isNew && (
          <span className="absolute left-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-bg">
            New
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-text/50">
            {brand?.name ?? "Brand"}
          </div>

          <Link
            href={`/product/${product.id}`}
            className="mt-1 line-clamp-2 font-headline text-sm font-medium leading-snug text-text transition-colors hover:text-accent"
          >
            {product.name}
          </Link>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text/60">
            {product.description}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-text">
              ${product.price}
            </span>

            <StarRating
              rating={product.rating}
              userRating={userRating}
              onRate={handleRate}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              aria-label="Share product"
              onClick={handleShareClick}
              whileTap={{ scale: 0.85 }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text"
            >
              <Share2 className="h-4 w-4" />
            </motion.button>

            <motion.button
              type="button"
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              onClick={handleFavoriteClick}
              whileTap={{ scale: 0.85 }}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                favorite
                  ? "bg-pink/20 text-pink"
                  : "text-text/50 hover:bg-surface hover:text-pink",
              )}
            >
              <Heart
                className={cn("h-4 w-4 transition-all", favorite && "fill-pink")}
              />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
});

export function ProductCardVerticalSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-divider/50 bg-surface/30 p-4">
      <div className="h-28 w-28 flex-shrink-0 animate-pulse rounded-xl bg-surface" />
      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div className="space-y-2">
          <div className="h-2.5 w-16 animate-pulse rounded bg-surface" />
          <div className="h-4 w-full animate-pulse rounded bg-surface" />
          <div className="h-3 w-full animate-pulse rounded bg-surface" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-surface" />
        </div>
        <div className="h-4 w-20 animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}
