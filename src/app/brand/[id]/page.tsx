"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Truck, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { getBrandById } from "@/lib/data";
import { mockProducts } from "@/data/mockProducts";
import { useToast } from "@/components/ui/Toast";

const ITEMS_PER_PAGE = 8;
const HERO_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6N1qkAAAAASUVORK5CYII=";

export default function BrandPage({ params }: { params: { id: string } }) {
  const brand = getBrandById(params.id);
  if (!brand) notFound();

  const { showToast, ToastContainer } = useToast();
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const isHeroSvg = brand.heroImage.includes(".svg");
  const isLogoSvg = brand.logoMark.includes(".svg");

  const brandProducts = mockProducts.filter((p) => p.brandId === brand.id);
  const visibleProducts = brandProducts.slice(0, visibleCount);
  const hasMore = visibleCount < brandProducts.length;

  useEffect(() => {
    document.title = brand.name;
  }, [brand.name]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, brandProducts.length));
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, brandProducts.length]);

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/brands" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          All Brands
        </Link>
      </Button>

      {/* Brand Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-surface">
        <div className="relative aspect-[3/1] w-full">
          {isHeroSvg ? (
            <img
              src={brand.heroImage}
              alt={brand.name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
          ) : (
            <Image
              src={brand.heroImage}
              alt={brand.name}
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
              priority
              quality={60}
              placeholder="blur"
              blurDataURL={HERO_BLUR_DATA_URL}
              unoptimized={process.env.NODE_ENV === "development"}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-bg bg-bg shadow-lg md:h-20 md:w-20">
              {isLogoSvg ? (
                <img
                  src={brand.logoMark}
                  alt={brand.name}
                  className="h-full w-full object-contain p-2"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <Image
                  src={brand.logoMark}
                  alt={brand.name}
                  fill
                  className="object-contain p-2"
                />
              )}
            </div>

            <div className="flex-1">
              <h1 className="font-headline text-2xl text-text lg:text-3xl">
                {brand.name}
              </h1>
              <p className="mt-1 text-sm text-text/60 md:text-base">{brand.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Info Pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-full border border-divider/50 bg-surface/50 px-4 py-2">
          <MapPin className="h-4 w-4 text-text/50" />
          <span className="text-sm text-text/70">{brand.location}</span>
        </div>

        {brand.freeShippingThreshold > 0 ? (
          <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-2">
            <Truck className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">
              Free shipping over ${brand.freeShippingThreshold}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-2">
            <Truck className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Free shipping on all orders</span>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-full border border-divider/50 bg-surface/50 px-4 py-2">
          <Package className="h-4 w-4 text-text/50" />
          <span className="text-sm text-text/70">{brandProducts.length} products</span>
        </div>
      </div>

      {/* Category Tags */}
      <div className="flex flex-wrap gap-2">
        {brand.categories.map((cat) => (
          <Link
            key={cat}
            href={`/search?category=${encodeURIComponent(cat)}`}
            className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Products Section */}
      <div>
        <h2 className="mb-6 font-headline text-xl text-text">
          Shop {brand.name}
        </h2>

        {brandProducts.length === 0 ? (
          <div className="rounded-xl border border-divider/50 bg-surface/30 py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-text/20" />
            <p className="mt-4 text-text/50">No products available yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onShare={showToast}
                />
              ))}
            </div>

            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="mt-8 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            )}

            {!hasMore && brandProducts.length > ITEMS_PER_PAGE && (
              <p className="mt-8 text-center text-sm text-text/40">
                Showing all {brandProducts.length} products
              </p>
            )}
          </>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
