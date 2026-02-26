"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import type { Brand } from "@/data/mockBrands";

interface BrandCardProps {
  brand: Brand;
  priority?: boolean;
}

export function BrandCard({ brand, priority = false }: BrandCardProps) {
  const isHeroSvg = brand.heroImage.includes(".svg");
  const isLogoSvg = brand.logoMark.includes(".svg");

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group"
    >
      <Link
        href={`/brand/${brand.id}`}
        className="block overflow-hidden rounded-2xl border border-divider/50 bg-surface/30 transition-all hover:border-divider hover:bg-surface/50 hover:shadow-lg"
      >
        {/* Hero Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-bg">
          {isHeroSvg ? (
            <img
              src={brand.heroImage}
              alt={brand.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <Image
              src={brand.heroImage}
              alt={brand.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
            />
          )}
                    
          {/* Logo overlay */}
          <div className="absolute bottom-3 left-3 h-10 w-10 overflow-hidden rounded-lg border border-bg/50 bg-bg/90 shadow-md backdrop-blur-sm">
            {isLogoSvg ? (
              <img
                src={brand.logoMark}
                alt=""
                className="h-full w-full object-contain p-1.5"
                loading={priority ? "eager" : "lazy"}
                decoding="async"
              />
            ) : (
              <Image
                src={brand.logoMark}
                alt=""
                fill
                className="object-contain p-1.5"
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-headline text-base font-medium text-text group-hover:text-accent transition-colors">
                {brand.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-text/60">
                {brand.tagline}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-text/50">
            <MapPin className="h-3.5 w-3.5" />
            <span>{brand.location}</span>
          </div>

          {/* Category chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {brand.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
            <span>View brand</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
