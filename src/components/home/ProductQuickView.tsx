"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, ShoppingBag, X } from "lucide-react";

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
            <button type="button" onClick={onClose} aria-label="Close product" className="sticky top-3 z-[80] ml-auto mr-3 -mb-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-divider/70 bg-bg/95 text-midnight/70 shadow-sm backdrop-blur hover:bg-surface hover:text-midnight"><X className="h-5 w-5" /></button>
            <div className="sticky top-0 z-10 flex items-center border-b border-divider/60 bg-bg/95 px-5 py-3 backdrop-blur-md lg:hidden">
              <span className="text-sm font-semibold text-text">Product</span>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 bg-surface p-4 sm:p-6 lg:w-[56%] lg:flex-row">
              <div className="relative h-[42dvh] min-h-[240px] max-h-[420px] w-full overflow-hidden rounded-2xl bg-surface p-3 lg:aspect-square lg:h-auto lg:min-h-0 lg:flex-1 lg:p-5">
                <Image src={images[activeImage]} alt={product.name} fill sizes="(max-width: 1024px) 90vw, 48vw" className="object-contain" priority />
                {images.length > 1 && (
                  <>
                    <button type="button" onClick={() => setActiveImage((current) => (current - 1 + images.length) % images.length)} aria-label="Previous product image" className="absolute left-5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-bg/90 text-midnight shadow-sm backdrop-blur transition-colors hover:bg-bg"><ArrowLeft className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setActiveImage((current) => (current + 1) % images.length)} aria-label="Next product image" className="absolute right-5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-bg/90 text-midnight shadow-sm backdrop-blur transition-colors hover:bg-bg"><ArrowRight className="h-4 w-4" /></button>
                    <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white">{activeImage + 1} / {images.length}</span>
                  </>
                )}
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

            <div className="flex min-w-0 flex-1 flex-col lg:overflow-y-auto">
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
