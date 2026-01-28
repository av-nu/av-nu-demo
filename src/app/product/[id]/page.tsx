"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Share2, ArrowLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { getBrandById, getProductById } from "@/lib/data";
import { StarRating } from "@/components/ui/StarRating";
import { BrandCard } from "@/components/product/BrandCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserRatings } from "@/hooks/useUserRatings";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = getProductById(params.id);
  if (!product) notFound();

  const brand = getBrandById(product.brandId);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getUserRating, setUserRating } = useUserRatings();
  const { addToCart, getItemQuantity } = useCart();
  const { showToast, ToastContainer } = useToast();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const favorite = isFavorite(product.id);
  const userRating = getUserRating(product.id);
  const cartQuantity = getItemQuantity(product.id);

  const handleFavoriteClick = useCallback(() => {
    toggleFavorite(product.id);
  }, [product.id, toggleFavorite]);

  const handleShareClick = useCallback(async () => {
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
        showToast("Link copied to clipboard");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard");
      }
    }
  }, [product.id, product.name, showToast]);

  const handleRate = useCallback(
    (rating: number) => {
      setUserRating(product.id, rating);
    },
    [product.id, setUserRating],
  );

  const handleAddToCart = useCallback(() => {
    addToCart(product.id, product.brandId);
    setAddedToCart(true);
    showToast("Added to cart");
    setTimeout(() => setAddedToCart(false), 2000);
  }, [product.id, product.brandId, addToCart, showToast]);

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Action buttons overlay */}
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              <motion.button
                type="button"
                aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
                onClick={handleFavoriteClick}
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors",
                  favorite
                    ? "bg-pink/20 text-pink"
                    : "bg-bg/80 text-text/60 hover:bg-bg hover:text-pink",
                )}
              >
                <Heart className={cn("h-5 w-5 transition-all", favorite && "fill-pink")} />
              </motion.button>

              <motion.button
                type="button"
                aria-label="Share product"
                onClick={handleShareClick}
                whileTap={{ scale: 0.85 }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-bg/80 text-text/60 backdrop-blur-md transition-colors hover:bg-bg hover:text-text"
              >
                <Share2 className="h-5 w-5" />
              </motion.button>
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <motion.button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative aspect-square w-20 overflow-hidden rounded-lg border-2 transition-colors",
                    selectedImageIndex === idx
                      ? "border-accent"
                      : "border-transparent hover:border-divider",
                  )}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="space-y-4">
            {/* Brand name */}
            <Link
              href={`/brand/${product.brandId}`}
              className="text-xs uppercase tracking-wide text-text/50 transition-colors hover:text-accent"
            >
              {brand?.name ?? "Brand"}
            </Link>

            {/* Product name */}
            <h1 className="font-headline text-3xl tracking-tight text-text lg:text-4xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating
                rating={product.rating}
                userRating={userRating}
                onRate={handleRate}
                size="md"
              />
              <span className="text-sm text-text/50">
                ({product.ratingCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="text-3xl font-semibold text-text">
              ${product.price}
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed text-text/60">
              {product.description}
            </p>
          </div>

          {/* Add to cart */}
          <div className="mt-8 space-y-4">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                variant="plum"
                size="lg"
                className="w-full gap-2"
                onClick={handleAddToCart}
              >
                {addedToCart ? (
                  <>
                    <Check className="h-5 w-5" />
                    Added to cart
                  </>
                ) : (
                  <>Add to cart</>
                )}
              </Button>
            </motion.div>

            {cartQuantity > 0 && !addedToCart && (
              <p className="text-center text-sm text-text/50">
                {cartQuantity} already in your cart
              </p>
            )}
          </div>

          {/* Brand card */}
          {brand && (
            <div className="mt-8 border-t border-divider/50 pt-6">
              <div className="mb-3 text-xs uppercase tracking-wide text-text/40">
                Sold by
              </div>
              <BrandCard brand={brand} />
            </div>
          )}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
