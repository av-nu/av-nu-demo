"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";
import { useToast } from "@/components/ui/Toast";
import { mockProducts } from "@/data/mockProducts";
import { mockBrands } from "@/data/mockBrands";

function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  // Get featured new products for the cards (skip first 6 to avoid overlap with horizontal scroll)
  const featuredProducts = mockProducts.filter(p => p.isNew).slice(6, 8);
  const featuredBrand = mockBrands.find(b => b.id === "ashwood-atelier");

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setVideoEnded(false);
    }
  };

  return (
    <section className="relative -mx-4 overflow-hidden px-4 pt-20 pb-1 md:-mx-8 md:px-8 md:pt-24 md:pb-2">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-accent/[0.06] blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-pink/[0.04] blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-6 md:grid-cols-5 md:gap-10 lg:gap-16">
          {/* Left side - Text content + Product Cards (3 columns) */}
          <div className="md:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              <h1 className="font-headline text-4xl tracking-tight text-text md:text-5xl lg:text-6xl">
                Discover something <span className="text-accent">nu.</span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                className="mx-auto mt-4 max-w-md text-base leading-relaxed text-text/60 md:text-lg"
              >
                Fresh finds from independent makers, curated for people who appreciate the difference.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
                className="mt-6 flex flex-wrap items-center justify-center gap-3"
              >
                <Button asChild size="lg">
                  <Link href="/search">Start exploring</Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="/brands">Meet the makers</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Product Cards Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
              className="mt-8 grid grid-cols-2 gap-4"
            >
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="aspect-square overflow-hidden">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-text/50">
                      {mockBrands.find(b => b.id === product.brandId)?.name}
                    </p>
                    <p className="truncate text-sm font-medium text-text">{product.name}</p>
                    <p className="mt-0.5 text-sm font-semibold text-text">${product.price}</p>
                  </div>
                </Link>
              ))}
            </motion.div>
          </div>

          {/* Right side - Product Spotlight (2 columns) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="md:col-span-2"
          >
            <div className="relative">
              {/* Spotlight Label */}
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium uppercase tracking-wider text-accent">
                  Nu Product Spotlight
                </span>
              </div>

              {/* Video/Image Container */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-text/5">
                <video
                  ref={videoRef}
                  src="/videos/ashwood-atelier-reel.MOV"
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  onEnded={() => setVideoEnded(true)}
                />
                
                {videoEnded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/30"
                  >
                    <button
                      onClick={handleReplay}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-text shadow-lg transition-transform hover:scale-105"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Product Info Card */}
              <div className="mt-3 rounded-xl bg-white/80 p-3 shadow-sm backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text/50">{featuredBrand?.name}</p>
                    <p className="truncate font-medium text-text">Garden Bloom Journal</p>
                    <p className="mt-0.5 text-sm font-semibold text-text">$52</p>
                  </div>
                  <Link 
                    href="/search"
                    className="shrink-0 rounded-full bg-text px-4 py-2 text-xs font-medium text-bg transition-colors hover:bg-text/80"
                  >
                    Shop now
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ExploreWhatsNuSection() {
  // Category cards with images from products
  const categoryCards = [
    {
      id: "home-living",
      name: "Home & Living",
      tagline: "Elevate your space",
      image: "/products/_pool/curated-lifestyle-4_-N5jH7WPM-unsplash1.jpg",
    },
    {
      id: "accessories",
      name: "Accessories",
      tagline: "Finishing touches",
      image: "/products/_pool/daiga-ellaby-eKBG7QgDQq0-unsplash.jpg",
    },
    {
      id: "beauty",
      name: "Beauty",
      tagline: "Natural radiance",
      image: "/products/_pool/polina-kuzovkova-K38VKmY_T0o-unsplash.jpg",
    },
  ];

  return (
    <section className="mt-10">
      <div className="mb-6">
        <h2 className="font-headline text-2xl tracking-tight text-text">
          Explore What's Nu
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {categoryCards.map((category) => (
          <Link
            key={category.id}
            href={`/search?category=${category.id}`}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl"
          >
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Grey overlay */}
            <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
            {/* Text content */}
            <div className="absolute inset-x-0 bottom-0 p-5 text-center">
              <p className="text-sm text-white/80">{category.tagline}</p>
              <p className="mt-1 text-xl font-semibold text-white md:text-2xl">{category.name}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/search"
          className="rounded-full border border-text/20 bg-white px-6 py-2.5 text-sm font-medium text-text transition-colors hover:bg-text/5"
        >
          See more
        </Link>
      </div>
    </section>
  );
}

function DiscoveryGridSection({ onShare }: { onShare: (msg: string) => void }) {
  const { products, isLoading, isInitialLoad, hasMore, loadMore } =
    useInfiniteProducts({ pageSize: 12 });

  const observerRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
    [hasMore, isLoading, loadMore],
  );

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "300px",
      threshold: 0,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <section className="mt-16">
      <div className="mb-6">
        <h2 className="font-headline text-2xl tracking-tight text-text">
          Nu For You
        </h2>
        <p className="mt-1 text-sm text-text/50">
          Fresh picks curated just for you
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 8}
            onShare={onShare}
          />
        ))}

        {(isLoading || isInitialLoad) &&
          Array.from({ length: isInitialLoad ? 8 : 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
      </div>

      <div ref={observerRef} className="h-4" />

      {!hasMore && products.length > 0 && (
        <p className="mt-8 text-center text-sm text-text/40">
          You have seen all {products.length} products
        </p>
      )}
    </section>
  );
}

export default function Home() {
  const { showToast, ToastContainer } = useToast();

  return (
    <div>
      <HeroSection />
      <ExploreWhatsNuSection />
      <DiscoveryGridSection onShare={showToast} />
      <ToastContainer />
    </div>
  );
}
