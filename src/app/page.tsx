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
    <section className="relative -mx-4 overflow-hidden px-4 pt-2 pb-1 md:-mx-8 md:px-0 md:pt-0 md:pb-0">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-accent/[0.06] blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-pink/[0.04] blur-3xl" />
      </div>

      {/* MOBILE: Airbnb-style branded header + video */}
      <div className="md:hidden">
        {/* Branded header - Airbnb style */}
        <div className="mb-4 flex flex-col items-center pt-1">
          <img
            src="/logo.svg"
            alt="av | nu"
            className="h-7 w-auto"
          />
          <p className="mt-1 text-sm text-text/60">
            Fresh finds from independent brands
          </p>
        </div>

        {/* Featured brand section header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium uppercase tracking-wider text-text/70">
              Featured brand
            </span>
          </div>
          <Link href="/brands" className="text-xs font-medium text-accent hover:underline">
            See all brands
          </Link>
        </div>

        {/* Featured brand video card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative aspect-[4/5] overflow-hidden rounded-2xl"
        >
          <video
            ref={videoRef}
            src="/videos/ashwood-atelier-reel-compressed.mp4"
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            loop
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Text overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h2 className="font-headline text-xl text-white">
              Ashwood Atelier
            </h2>
            <p className="mt-0.5 text-xs text-white/80">
              Quiet forms for everyday rituals
            </p>
            <Button asChild size="sm" className="mt-3 bg-white text-text hover:bg-white/90">
              <Link href="/brand/ashwood-atelier">Shop now</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* DESKTOP: Stacked layout - branded header → video → products */}
      <div className="hidden md:block">
        {/* Branded header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-6xl px-8 pb-8 pt-20 text-center"
        >
          <h1 className="font-headline text-5xl tracking-tight text-text lg:text-6xl">
            Discover something <span className="text-accent">nu</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-lg text-text/60">
            Fresh finds from independent brands.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/search">Start exploring</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/brands">Meet the brands</Link>
            </Button>
          </div>
        </motion.div>

        {/* Featured brand video section */}
        <div className="mx-auto max-w-5xl px-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-text/70">Featured brand</span>
            </div>
            <Link href="/brands" className="text-sm font-medium text-accent hover:underline">
              See all brands
            </Link>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="relative aspect-[21/9] overflow-hidden rounded-2xl"
          >
            <video
              ref={videoRef}
              src="/videos/ashwood-atelier-reel-compressed.mp4"
              className="h-full w-full object-cover"
              autoPlay
              muted
              playsInline
              loop
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            
            {/* Brand info overlay */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6">
              <div>
                <h2 className="font-headline text-2xl text-white">Ashwood Atelier</h2>
                <p className="mt-1 text-sm text-white/80">Quiet forms for everyday rituals</p>
              </div>
              <Button asChild size="sm" className="bg-white text-text hover:bg-white/90">
                <Link href="/brand/ashwood-atelier">Shop now</Link>
              </Button>
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
    <section className="mt-6 hidden md:mt-10 md:block">
      <div className="mb-6">
        <h2 className="font-headline text-2xl tracking-tight text-text">
          Explore what's nu
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
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
    <section className="mt-6 md:mt-16">
      <div className="mb-6">
        <h2 className="font-headline text-2xl tracking-tight text-text">
          Nu for you
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
