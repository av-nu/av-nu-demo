"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Truck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { getProductById, getBrandById } from "@/lib/data";
import { cn } from "@/lib/utils";

function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      {/* Premium illustration */}
      <div className="relative mb-8">
        <div className="absolute inset-0 -z-10 scale-150">
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-2xl" />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink/10 blur-xl" />
        </div>

        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-divider/30" />
          <div className="absolute inset-2 rounded-full border border-divider/20" />
          <div className="absolute inset-4 rounded-full border border-divider/10" />

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
            <ShoppingBag className="h-7 w-7 text-text/30" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <h2 className="font-headline text-2xl tracking-tight text-text">
        Your cart is empty
      </h2>

      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-text/50">
        When you find something you love, add it here. We'll keep it safe until you're ready.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">Start discovering</Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/brands">Browse brands</Link>
        </Button>
      </div>
    </motion.div>
  );
}

function FreeShippingProgress({
  threshold,
  currentTotal,
  brandId,
}: {
  threshold: number;
  currentTotal: number;
  brandId: string;
}) {
  // Threshold of 0 means always free shipping
  const alwaysFree = threshold <= 0;
  const remaining = alwaysFree ? 0 : threshold - currentTotal;
  const progress = alwaysFree ? 100 : Math.min((currentTotal / threshold) * 100, 100);
  const isUnlocked = remaining <= 0;

  return (
    <div className="mt-4 rounded-xl border border-divider/30 bg-bg/50 p-3">
      <div className="flex items-center gap-2 text-xs">
        <Truck className={cn("h-4 w-4", isUnlocked ? "text-green-600" : "text-text/50")} />
        {alwaysFree ? (
          <span className="font-medium text-green-600">Always free shipping!</span>
        ) : isUnlocked ? (
          <span className="font-medium text-green-600">Free shipping unlocked!</span>
        ) : (
          <span className="text-text/60">
            <span className="font-medium text-text">${remaining.toFixed(2)}</span> away from free shipping
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-divider/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            isUnlocked ? "bg-green-500" : "bg-accent"
          )}
        />
      </div>

      {!isUnlocked && !alwaysFree && (
        <Link
          href={`/brand/${brandId}#products`}
          className="mt-2 inline-flex items-center gap-1 text-xs text-accent transition-colors hover:text-accent/80"
        >
          Shop the brand to earn free shipping
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, isHydrated } =
    useCart();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTop();
    const raf = window.requestAnimationFrame(scrollToTop);
    const t1 = window.setTimeout(scrollToTop, 0);
    const t2 = window.setTimeout(scrollToTop, 50);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("avnu-storage-sync", { detail: { key: "avnu-cart" } }),
    );
  }, []);

  if (!isHydrated) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-surface/60" />
        <div className="h-48 rounded-2xl bg-surface/40" />
        <div className="h-48 rounded-2xl bg-surface/40" />
      </div>
    );
  }

  // Group items by brand with subtotals
  const brandGroups = items.reduce(
    (acc, item) => {
      const brand = getBrandById(item.brandId);
      const brandId = brand?.id ?? "unknown";
      if (!acc[brandId]) {
        acc[brandId] = { brand, items: [], subtotal: 0 };
      }
      const product = getProductById(item.productId);
      const lineTotal = (product?.price ?? 0) * item.quantity;
      acc[brandId].items.push(item);
      acc[brandId].subtotal += lineTotal;
      return acc;
    },
    {} as Record<string, { brand: ReturnType<typeof getBrandById>; items: typeof items; subtotal: number }>,
  );

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const product = getProductById(item.productId);
      return sum + (product?.price ?? 0) * item.quantity;
    }, 0);
  };

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl text-text">
          Your Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
        </h1>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-text/50">
          Clear cart
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="space-y-6 lg:col-span-2">
          {Object.entries(brandGroups).map(([brandId, { brand, items: brandItems, subtotal }]) => {
            const isLogoSvg = brand?.logoMark?.includes(".svg") ?? false;

            return (
              <motion.div
                key={brandId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-divider/50 bg-surface/30 p-5"
              >
                {/* Brand header with logo */}
                <div className="mb-4 flex items-center gap-3 border-b border-divider/50 pb-3">
                  {brand && (
                    <Link
                      href={`/brand/${brand.id}`}
                      className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-bg"
                    >
                      {isLogoSvg ? (
                        <img
                          src={brand.logoMark}
                          alt={brand.name}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <Image
                          src={brand.logoMark}
                          alt={brand.name}
                          fill
                          className="object-contain p-1"
                        />
                      )}
                    </Link>
                  )}
                  <div className="flex-1">
                    <Link
                      href={`/brand/${brand?.id ?? ""}`}
                      className="font-headline text-sm font-medium text-text transition-colors hover:text-accent"
                    >
                      {brand?.name ?? "Unknown Brand"}
                    </Link>
                    <div className="text-xs text-text/50">
                      Subtotal: ${subtotal.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Brand items */}
                <div className="space-y-4">
                  {brandItems.map((item) => {
                    const product = getProductById(item.productId);
                    if (!product) return null;

                    return (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex gap-4"
                      >
                        {/* Product image */}
                        <Link
                          href={`/product/${product.id}`}
                          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-bg"
                        >
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </Link>

                        {/* Product info */}
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <Link
                              href={`/product/${product.id}`}
                              className="text-sm font-medium text-text transition-colors hover:text-accent"
                            >
                              {product.name}
                            </Link>
                            <div className="mt-0.5 text-sm text-text/50">
                              ${product.price.toFixed(2)}
                            </div>
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center rounded-lg border border-divider/50 bg-bg">
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="flex h-8 w-8 items-center justify-center text-text/60 transition-colors hover:text-text"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </motion.button>
                              <span className="w-8 text-center text-sm font-medium text-text">
                                {item.quantity}
                              </span>
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center text-text/60 transition-colors hover:text-text"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </motion.button>
                            </div>

                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeFromCart(item.productId)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-text/40 transition-colors hover:bg-pink/10 hover:text-pink"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Line total */}
                        <div className="text-right text-sm font-medium text-text">
                          ${(product.price * item.quantity).toFixed(2)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Free shipping progress */}
                {brand && (
                  <FreeShippingProgress
                    threshold={brand.freeShippingThreshold}
                    currentTotal={subtotal}
                    brandId={brand.id}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-divider/50 bg-surface/30 p-5">
            <h2 className="font-headline text-lg text-text">Order Summary</h2>

            <div className="mt-4 space-y-3 border-b border-divider/50 pb-4">
              <div className="flex justify-between text-sm">
                <span className="text-text/60">Subtotal</span>
                <span className="text-text">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text/60">Shipping</span>
                <span className="text-text/60">Calculated at checkout</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="font-medium text-text">Total</span>
              <span className="font-semibold text-text">${calculateSubtotal().toFixed(2)}</span>
            </div>

            <Button variant="plum" size="lg" className="mt-6 w-full">
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
