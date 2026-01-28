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

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  onShare?: (message: string) => void;
}

export const ProductCard = memo(function ProductCard({
  product,
  priority = false,
  onShare,
}: ProductCardProps) {
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col"
    >
      <Link
        href={`/product/${product.id}`}
        className="relative aspect-square overflow-hidden rounded-xl bg-surface"
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          onLoad={() => setImageLoaded(true)}
          className={cn(
            "object-cover transition-all duration-500 group-hover:scale-105",
            imageLoaded ? "opacity-100" : "opacity-0",
          )}
        />

        {product.isNew && (
          <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-bg">
            New
          </span>
        )}
      </Link>

      {/* Favorite button */}
      <motion.button
        type="button"
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        onClick={handleFavoriteClick}
        whileTap={{ scale: 0.85 }}
        className={cn(
          "pointer-events-auto absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
          favorite
            ? "bg-pink/20 text-pink"
            : "bg-bg/80 text-text/60 hover:bg-bg hover:text-pink",
        )}
      >
        <Heart
          className={cn("h-4 w-4 transition-all", favorite && "fill-pink")}
        />
      </motion.button>

      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wide text-text/50">
            {brand?.name ?? "Brand"}
          </div>
          <motion.button
            type="button"
            aria-label="Share product"
            onClick={handleShareClick}
            whileTap={{ scale: 0.85 }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-text/40 transition-colors hover:bg-surface hover:text-text/70"
          >
            <Share2 className="h-3.5 w-3.5" />
          </motion.button>
        </div>

        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 font-headline text-sm font-medium leading-snug text-text transition-colors hover:text-accent"
        >
          {product.name}
        </Link>

        <div className="mt-1 flex items-center justify-between">
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
      </div>
    </motion.article>
  );
});

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-square animate-pulse rounded-xl bg-surface" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-surface" />
        <div className="h-4 w-full animate-pulse rounded bg-surface" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
        <div className="mt-1 h-4 w-20 animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}
