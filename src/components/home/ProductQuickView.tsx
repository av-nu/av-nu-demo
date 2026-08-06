"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ShoppingBag, X } from "lucide-react";

import { FaveButton } from "@/components/faves/FaveButton";
import { StarRating } from "@/components/ui/StarRating";
import { Portal } from "@/components/ui/Portal";
import { getBrandById } from "@/lib/data";
import type { Product } from "@/data/mockProducts";
import { useCart } from "@/hooks/useCart";

export function ProductQuickView({
  product,
  onClose,
  onToast,
}: {
  product: Product;
  onClose: () => void;
  onToast?: (message: string) => void;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const { addToCart } = useCart();
  const brand = getBrandById(product.brandId);
  const images = product.images.length > 0 ? product.images : ["/products/_pool/curated-lifestyle-gLmmY_kGIdU-unsplash2.jpg"];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleAddToCart = () => {
    addToCart(product.id, product.brandId);
    onToast?.("Added to cart");
  };

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm lg:items-center lg:p-5"
        >
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-y-auto rounded-none bg-bg shadow-2xl lg:h-[720px] lg:max-h-[94vh] lg:max-w-5xl lg:flex-row lg:overflow-hidden lg:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-divider/60 bg-bg/95 px-5 py-3 backdrop-blur-md lg:hidden">
              <span className="text-sm font-semibold text-text">Product</span>
              <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-full border border-divider/70 px-3 py-1.5 text-xs font-semibold text-text/70" aria-label="Close product"><X className="h-3.5 w-3.5" />Close</button>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 bg-surface p-4 sm:p-6 lg:w-[56%] lg:flex-row">
              <div className="relative aspect-square min-h-0 flex-1 overflow-hidden rounded-2xl bg-bg">
                <Image src={images[activeImage]} alt={product.name} fill sizes="(max-width: 1024px) 90vw, 48vw" className="object-cover" priority />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto lg:w-20 lg:flex-col">
                  {images.map((image, index) => (
                    <button key={image} type="button" onClick={() => setActiveImage(index)} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 lg:h-16 lg:w-16 ${activeImage === index ? "border-navy" : "border-transparent"}`} aria-label={`View image ${index + 1}`}>
                      <Image src={image} alt="" fill sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
              <div className="hidden items-center justify-end px-5 pt-5 lg:flex">
                <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-text/50 hover:bg-surface hover:text-text" aria-label="Close product"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-1 flex-col px-5 pb-6 pt-4 sm:px-7 lg:pt-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    {brand && <Link href={`/brand/${brand.id}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-burgundy hover:underline">{brand.name}</Link>}
                    <h2 className="mt-2 font-headline text-3xl tracking-tight text-text">{product.name}</h2>
                  </div>
                  <FaveButton product={product} onToast={onToast} className="shrink-0 border border-divider/60" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-text">${product.price}</p>
                <div className="mt-4 flex items-center gap-3">
                  <StarRating rating={product.rating} showUserRating={false} />
                  <span className="text-xs text-text/50">{product.ratingCount > 0 ? `${product.ratingCount} reviews` : "No reviews yet"}</span>
                </div>
                <p className="mt-6 text-sm leading-relaxed text-text/65">{product.description}</p>
                {product.colors && product.colors.length > 0 && <div className="mt-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-text/45">Color</p><p className="mt-1 text-sm text-text/70">{product.colors.join(", ")}</p></div>}
                <div className="mt-auto flex flex-col gap-3 pt-8">
                  <button type="button" onClick={handleAddToCart} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy/90"><ShoppingBag className="h-4 w-4" />Add to cart</button>
                  <Link href={`/product/${product.id}`} onClick={onClose} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-divider/70 px-4 py-3 text-sm font-semibold text-text/70 transition-colors hover:bg-surface hover:text-text">View full product <ArrowUpRight className="h-4 w-4" /></Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
