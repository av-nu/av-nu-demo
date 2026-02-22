"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Truck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { getBrandById } from "@/lib/data";
import { mockProducts } from "@/data/mockProducts";
import { useToast } from "@/components/ui/Toast";

const ITEMS_PER_PAGE = 12;

export default function BrandPreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const brand = getBrandById(params.id);
  if (!brand) notFound();

  const { showToast, ToastContainer } = useToast();
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isMobileInfoExpanded, setIsMobileInfoExpanded] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setVideoEnded(false);
    }
  };

  const handleMobileReplay = () => {
    if (mobileVideoRef.current) {
      mobileVideoRef.current.currentTime = 0;
      mobileVideoRef.current.play();
      setVideoEnded(false);
    }
  };

  const brandProducts = mockProducts.filter((p) => p.brandId === brand.id);
  const visibleProducts = brandProducts.slice(0, visibleCount);
  const hasMore = visibleCount < brandProducts.length;

  const hasVideo = !!brand.reelUrl;
  const hasStory = !!brand.story;
  const mediaImage = brand.storyImage || brand.heroImage;

  useEffect(() => {
    document.title = `${brand.name} | av | nu`;
  }, [brand.name]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((prev) =>
            Math.min(prev + ITEMS_PER_PAGE, brandProducts.length)
          );
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, brandProducts.length]);

  // Build carousel items: video first (if exists), then carousel images or featured product images
  const featuredProducts = brandProducts.slice(0, 3);
  const carouselItems: { type: "video" | "image"; src: string; alt: string }[] =
    [];

  if (hasVideo) {
    carouselItems.push({
      type: "video",
      src: brand.reelUrl!,
      alt: `${brand.name} reel`,
    });
  }

  // Use brand-specific carousel images if available, otherwise fall back to product images
  if (brand.carouselImages && brand.carouselImages.length > 0) {
    brand.carouselImages.forEach((img, idx) => {
      carouselItems.push({
        type: "image",
        src: img,
        alt: `${brand.name} carousel ${idx + 1}`,
      });
    });
  } else {
    featuredProducts.forEach((product) => {
      if (product.images?.[0]) {
        carouselItems.push({
          type: "image",
          src: product.images[0],
          alt: product.name,
        });
      }
    });
  }

  // Fallback if no carousel items
  if (carouselItems.length === 0 && mediaImage) {
    carouselItems.push({
      type: "image",
      src: mediaImage,
      alt: `${brand.name} story`,
    });
  }

  const nextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCarouselIndex(
      (prev) => (prev - 1 + carouselItems.length) % carouselItems.length
    );
  };

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/brands" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          All Brands
        </Link>
      </Button>

      {/* Desktop layout */}
      <section className="hidden md:block space-y-4">
        {/* Brand info - subtle container with large logo */}
        <div className="flex items-start gap-6 rounded-xl bg-white/40 p-4 shadow-sm">
          {/* Large logo */}
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-divider/30 bg-white p-3 shadow-sm">
            <img
              src={brand.logoMark}
              alt={brand.name}
              className="h-full w-full object-contain"
            />
          </div>
          
          {/* Content on the right */}
          <div className="flex-1">
            {/* Name and tagline */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-headline text-2xl font-semibold text-text">
                {brand.name}
              </h1>
              <p className="text-sm italic text-text/50">
                {brand.tagline}
              </p>
            </div>
            
            {/* Location badge */}
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-text/60">
              <MapPin className="h-3.5 w-3.5" />
              {brand.location}
            </div>
            
            {/* Story */}
            {hasStory && (
              <p className="mt-3 text-sm leading-relaxed text-text/70">
                {brand.story}
              </p>
            )}
            
            {/* Founder info, categories, and shipping */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {brand.founderName && (
                <span className="flex items-center gap-1.5 text-sm text-text/60">
                  <User className="h-3.5 w-3.5" />
                  {brand.founderName}
                </span>
              )}
              {brand.foundedYear && (
                <span className="flex items-center gap-1.5 text-sm text-text/60">
                  <Calendar className="h-3.5 w-3.5" />
                  Since {brand.foundedYear}
                </span>
              )}
              {brand.categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/search?category=${encodeURIComponent(cat)}`}
                  className="rounded-full border border-divider/30 px-3 py-1 text-xs font-medium text-text/70 transition-colors hover:border-accent/40 hover:text-accent"
                >
                  {cat}
                </Link>
              ))}
              <div className="ml-auto flex items-center gap-1.5 text-sm text-accent">
                <Truck className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {brand.freeShippingThreshold > 0
                    ? `Free shipping over $${brand.freeShippingThreshold}`
                    : "Free shipping"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Three horizontal media containers - full width */}
        <div className="flex gap-3">
          {carouselItems.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              className="relative flex-1 aspect-[9/16] overflow-hidden rounded-xl bg-surface shadow-md"
            >
              {item.type === "video" ? (
                <>
                  <video
                    ref={idx === 0 ? videoRef : undefined}
                    src={item.src}
                    className="h-full w-full object-cover"
                    playsInline
                    autoPlay
                    muted
                    onEnded={() => setVideoEnded(true)}
                  />
                  {videoEnded && idx === 0 && (
                    <button
                      onClick={handleReplay}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                        <RotateCcw className="h-5 w-5 text-text" />
                      </div>
                    </button>
                  )}
                </>
              ) : (
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  unoptimized={process.env.NODE_ENV === "development"}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Mobile: Compact brand header with carousel */}
      <section className="md:hidden space-y-4">
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-divider/30 bg-surface shadow-sm">
            <img
              src={brand.logoMark}
              alt={brand.name}
              className="h-full w-full object-contain p-1.5"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-headline text-xl text-text truncate">
              {brand.name}
            </h1>
            <p className="text-xs text-text/60 truncate">{brand.tagline}</p>
          </div>
        </div>

        {/* Three horizontal media containers */}
        <div className="flex justify-center gap-2">
          {carouselItems.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              className="relative w-24 aspect-[9/16] overflow-hidden rounded-lg bg-surface shadow-md"
            >
              {item.type === "video" ? (
                <>
                  <video
                    ref={idx === 0 ? mobileVideoRef : undefined}
                    src={item.src}
                    className="h-full w-full object-cover"
                    playsInline
                    autoPlay
                    muted
                    onEnded={() => setVideoEnded(true)}
                  />
                  {videoEnded && idx === 0 && (
                    <button
                      onClick={handleMobileReplay}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
                        <RotateCcw className="h-4 w-4 text-text" />
                      </div>
                    </button>
                  )}
                </>
              ) : (
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  unoptimized={process.env.NODE_ENV === "development"}
                />
              )}
            </div>
          ))}
        </div>

        {/* Expandable info */}
        <button
          onClick={() => setIsMobileInfoExpanded(!isMobileInfoExpanded)}
          className="flex w-full items-center justify-between rounded-lg border border-divider/30 bg-surface/30 px-3 py-2"
        >
          <span className="text-xs font-medium text-text">
            {isMobileInfoExpanded ? "Hide details" : "About this maker"}
          </span>
          {isMobileInfoExpanded ? (
            <ChevronUp className="h-4 w-4 text-text/50" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text/50" />
          )}
        </button>

        <AnimatePresence>
          {isMobileInfoExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-1">
                {hasStory && (
                  <p className="text-sm leading-relaxed text-text/70">
                    {brand.story}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-text/50">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {brand.location}
                  </span>
                  {brand.founderName && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {brand.founderName}
                    </span>
                  )}
                  {brand.foundedYear && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Since {brand.foundedYear}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {brand.categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/search?category=${encodeURIComponent(cat)}`}
                      className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shipping badge - always visible */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5">
            <Truck className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">
              {brand.freeShippingThreshold > 0
                ? `Free over $${brand.freeShippingThreshold}`
                : "Free shipping"}
            </span>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <h2 className="font-headline text-xl text-text">Shop the Collection</h2>
        <span className="text-sm text-text/40">
          {brandProducts.length} products
        </span>
      </div>

      {brandProducts.length === 0 ? (
        <div className="rounded-xl border border-divider/50 bg-surface/30 py-12 text-center">
          <p className="text-text/50">No products available yet.</p>
        </div>
      ) : (
        <>
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
            {visibleProducts.map((product, index) => (
              <div key={product.id} className="mb-4 break-inside-avoid">
                <ProductCard
                  product={product}
                  onShare={showToast}
                  priority={index < 8}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          )}

          {!hasMore && brandProducts.length > ITEMS_PER_PAGE && (
            <p className="py-4 text-center text-sm text-text/40">
              Showing all {brandProducts.length} products
            </p>
          )}
        </>
      )}

      <ToastContainer />
    </div>
  );
}
