"use client";

import { memo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Send, Plus } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { Product } from "@/data/mockProducts";
import { getBrandById } from "@/lib/data";
import { StarRating } from "@/components/ui/StarRating";
import { FaveButton } from "@/components/faves/FaveButton";
import { useUserRatings } from "@/hooks/useUserRatings";
import { useCart } from "@/hooks/useCart";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  onShare?: (message: string) => void;
  /** When true, the card stretches to fill its container height with a
   *  rectangular image (used in the shoppable feed to align with videos). */
  stretch?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  priority = false,
  onShare,
  stretch = false,
}: ProductCardProps) {
  const brand = getBrandById(product.brandId);
  const { getUserRating, setUserRating } = useUserRatings();
  const { addToCart } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);

  const userRating = getUserRating(product.id);

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

  const handleQuickAdd = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addToCart(product.id, product.brandId);
      onShare?.("Added to cart");
    },
    [product.id, product.brandId, addToCart, onShare],
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn("group relative flex flex-col", stretch && "md:h-full")}
    >
      {/* Image container with Quick Add overlay */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-surface",
          stretch ? "aspect-square md:aspect-auto md:min-h-0 md:flex-1" : "aspect-square",
        )}
      >
        <Link
          href={`/product/${product.id}`}
          className="block h-full w-full"
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
            <span className="absolute left-2 top-2 z-10 rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-bg">
              New
            </span>
          )}
        </Link>

        {/* Quick Add button - appears on hover */}
        <button
          type="button"
          onClick={handleQuickAdd}
          className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-1.5 bg-text py-2.5 text-sm font-medium text-bg opacity-0 transition-all duration-200 hover:bg-text/90 group-hover:opacity-100"
        >
          <Plus className="h-4 w-4" />
          Quick Add
        </button>
      </div>

      {/* Save to list button */}
      <FaveButton
        product={product}
        onToast={onShare}
        className="pointer-events-auto absolute right-2 top-2 z-10"
      />

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
            <Send className="h-3.5 w-3.5" />
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
