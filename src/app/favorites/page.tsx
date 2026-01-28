"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/components/ui/Toast";
import { getProductById } from "@/lib/data";

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      {/* Premium illustration via CSS shapes */}
      <div className="relative mb-8">
        {/* Soft glow background */}
        <div className="absolute inset-0 -z-10 scale-150">
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-2xl" />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink/10 blur-xl" />
        </div>

        {/* Decorative rings */}
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-divider/30" />
          <div className="absolute inset-2 rounded-full border border-divider/20" />
          <div className="absolute inset-4 rounded-full border border-divider/10" />

          {/* Heart icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
            <Heart className="h-7 w-7 text-text/30" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <h2 className="font-headline text-2xl tracking-tight text-text">
        Nothing saved yet
      </h2>

      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-text/50">
        When something catches your eye, tap the heart to keep it here. Your favorites will be waiting.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">Explore products</Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/brands">Browse brands</Link>
        </Button>
      </div>
    </motion.div>
  );
}

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { showToast, ToastContainer } = useToast();

  const favoriteProducts = favorites
    .map((id) => getProductById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getProductById>>[];

  if (favoriteProducts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <p className="text-sm text-text/50">
          {favoriteProducts.length} {favoriteProducts.length === 1 ? "item" : "items"} saved
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {favoriteProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 8}
            onShare={showToast}
          />
        ))}
      </div>

      <ToastContainer />
    </div>
  );
}
