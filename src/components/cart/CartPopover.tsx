"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Truck, X, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { getProductById, getBrandById } from "@/lib/data";
import { cn } from "@/lib/utils";

export function CartPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { items, updateQuantity, removeFromCart, totalItems } = useCart();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

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

  const cartTotal = items.reduce((sum, item) => {
    const product = getProductById(item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  return (
    <div className="relative" ref={popoverRef}>
      {/* Cart trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface/50 text-text/60 transition-colors hover:bg-surface hover:text-text"
        aria-label={`Cart with ${totalItems} items`}
      >
        <ShoppingBag className="h-5 w-5" />
        {isMounted && totalItems > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-text text-[10px] font-semibold text-bg"
          >
            {totalItems > 99 ? "99+" : totalItems}
          </motion.span>
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-2xl border border-divider/50 bg-bg shadow-xl sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-divider/50 px-4 py-3">
              <h3 className="font-headline text-sm font-medium text-text">
                Your Cart ({totalItems})
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-text/40 transition-colors hover:bg-surface hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShoppingBag className="mb-3 h-10 w-10 text-text/20" />
                  <p className="text-sm text-text/50">Your cart is empty</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link
                      href="/"
                      onClick={() => {
                        window.scrollTo(0, 0);
                        setIsOpen(false);
                      }}
                    >
                      Start shopping
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-divider/30">
                  {Object.entries(brandGroups).map(([brandId, { brand, items: brandItems, subtotal }]) => {
                    const threshold = brand?.freeShippingThreshold ?? 0;
                    const alwaysFree = threshold <= 0;
                    const remaining = alwaysFree ? 0 : threshold - subtotal;
                    const isUnlocked = remaining <= 0;

                    return (
                      <div key={brandId} className="p-4">
                        {/* Brand header */}
                        <div className="mb-3 flex items-center justify-between">
                          <Link
                            href={`/brand/${brandId}`}
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-medium text-text transition-colors hover:text-accent"
                          >
                            {brand?.name ?? "Unknown Brand"}
                          </Link>
                          <span className="text-xs text-text/50">
                            ${subtotal.toFixed(2)}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="space-y-3">
                          {brandItems.map((item) => {
                            const product = getProductById(item.productId);
                            if (!product) return null;

                            return (
                              <div key={item.productId} className="flex gap-3">
                                <Link
                                  href={`/product/${product.id}`}
                                  onClick={() => setIsOpen(false)}
                                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface"
                                >
                                  <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                </Link>
                                <div className="flex-1 min-w-0">
                                  <Link
                                    href={`/product/${product.id}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block truncate text-xs font-medium text-text transition-colors hover:text-accent"
                                  >
                                    {product.name}
                                  </Link>
                                  <div className="mt-0.5 text-xs text-text/50">
                                    ${product.price.toFixed(2)}
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <div className="flex items-center rounded border border-divider/50 bg-surface/50">
                                      <button
                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                        className="flex h-6 w-6 items-center justify-center text-text/50 transition-colors hover:text-text"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <span className="w-6 text-center text-xs font-medium text-text">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                        className="flex h-6 w-6 items-center justify-center text-text/50 transition-colors hover:text-text"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => removeFromCart(item.productId)}
                                      className="text-xs text-text/40 transition-colors hover:text-pink"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Shipping status */}
                        <div className="mt-3 flex items-center gap-1.5 text-[10px]">
                          <Truck className={cn("h-3 w-3", isUnlocked ? "text-green-600" : "text-text/40")} />
                          {alwaysFree ? (
                            <span className="text-green-600">Always free shipping</span>
                          ) : isUnlocked ? (
                            <span className="text-green-600">Free shipping!</span>
                          ) : (
                            <span className="text-text/50">
                              ${remaining.toFixed(2)} away from free shipping
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-divider/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-text">Total</span>
                  <span className="text-sm font-semibold text-text">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                  >
                    <Link
                      href="/cart"
                      onClick={() => {
                        window.scrollTo(0, 0);
                        setIsOpen(false);
                      }}
                    >
                      View cart
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1">
                    Checkout
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
