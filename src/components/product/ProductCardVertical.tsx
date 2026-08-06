"use client";

import { memo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Send } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { Product } from "@/data/mockProducts";
import { getBrandById } from "@/lib/data";
import { StarRating } from "@/components/ui/StarRating";
import { FaveButton } from "@/components/faves/FaveButton";
import { ShareProductDialog } from "@/components/product/ShareProductDialog";

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleShareClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  }, []);


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


          </div>

          <div className="flex items-center gap-2">
            <StarRating rating={product.rating} showUserRating={false} size="sm" />
            <motion.button
              type="button"
              aria-label="Share product"
              onClick={handleShareClick}
              whileTap={{ scale: 0.85 }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text"
            >
              <Send className="h-4 w-4" />
            </motion.button>

            <FaveButton product={product} onToast={onShare} variant="plain" />
          </div>
        </div>
      </div>
      {shareOpen && <ShareProductDialog product={product} onClose={() => setShareOpen(false)} onToast={onShare} />}
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
