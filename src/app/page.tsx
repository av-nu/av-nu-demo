"use client";

import Link from "next/link";
import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import {
  ProductCardVertical,
  ProductCardVerticalSkeleton,
} from "@/components/product/ProductCardVertical";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";
import { useToast } from "@/components/ui/Toast";

function HeroSection() {
  return (
    <section className="relative -mx-4 overflow-hidden px-4 py-12 md:-mx-8 md:px-8 md:py-20">
      {/* Subtle background texture */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-accent/[0.06] blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-pink/[0.04] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto max-w-2xl text-center"
      >
        <h1 className="font-headline text-4xl tracking-tight text-text md:text-5xl lg:text-6xl">
          Discover products
          <br />
          <span className="text-accent">worth keeping.</span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="mx-auto mt-5 max-w-md text-base leading-relaxed text-text/60 md:text-lg"
        >
          A curated marketplace of thoughtfully made goods from independent brands.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild size="lg">
            <Link href="/search">Start discovering</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/brands">Explore brands</Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}

function NuForYouSection({ onShare }: { onShare: (msg: string) => void }) {
  const { products, isInitialLoad } = useInfiniteProducts({
    pageSize: 6,
    filters: { isNew: true },
  });

  const displayProducts = products.slice(0, 6);

  return (
    <section className="mt-12">
      <div className="mb-6">
        <h2 className="font-headline text-2xl tracking-tight text-text">
          Nu For You
        </h2>
        <p className="mt-1 text-sm text-text/50">
          Fresh arrivals from brands you'll love
        </p>
      </div>

      {/* Horizontal scroll container */}
      <div className="-mx-4 px-4 md:-mx-8 md:px-8">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {isInitialLoad
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="w-[280px] flex-shrink-0 snap-start md:w-[320px]"
                >
                  <ProductCardSkeleton />
                </div>
              ))
            : displayProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="w-[280px] flex-shrink-0 snap-start md:w-[320px]"
                >
                  <ProductCard
                    product={product}
                    priority={index < 3}
                    onShare={onShare}
                  />
                </div>
              ))}
        </div>
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
          Discover More
        </h2>
        <p className="mt-1 text-sm text-text/50">
          Explore our full collection
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
            <ProductCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {/* Intersection observer trigger */}
      <div ref={observerRef} className="h-4" />

      {!hasMore && products.length > 0 && (
        <p className="mt-8 text-center text-sm text-text/40">
          You've seen all {products.length} products
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
      <NuForYouSection onShare={showToast} />
      <DiscoveryGridSection onShare={showToast} />
      <ToastContainer />
    </div>
  );
}
