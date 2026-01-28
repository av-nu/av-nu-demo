"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

import type { Brand } from "@/data/mockBrands";

interface BrandCardProps {
  brand: Brand;
}

export function BrandCard({ brand }: BrandCardProps) {
  const isLogoSvg = brand.logoMark.includes(".svg");

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        href={`/brand/${brand.id}`}
        className="flex items-center gap-4 rounded-xl border border-divider/50 bg-surface/50 p-4 transition-colors hover:bg-surface"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-bg">
          {isLogoSvg ? (
            <img
              src={brand.logoMark}
              alt={brand.name}
              className="h-full w-full object-contain p-1"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Image
              src={brand.logoMark}
              alt={brand.name}
              fill
              className="object-contain p-1"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-headline text-sm font-medium text-text">
            {brand.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-text/50">
            <MapPin className="h-3 w-3" />
            {brand.location}
          </div>
        </div>

        <div className="text-xs text-text/40">View brand →</div>
      </Link>
    </motion.div>
  );
}
