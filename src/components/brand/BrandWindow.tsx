"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Star,
  Leaf,
  Flag,
  Hammer,
  Flower2,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Brand } from "@/data/mockBrands";
import type { BrandAttribute, WindowProductPhoto } from "@/lib/data";

const ATTRIBUTE_META: Record<
  BrandAttribute,
  { label: string; Icon: LucideIcon }
> = {
  sustainable: { label: "Sustainable", Icon: Leaf },
  made_in_us: { label: "Made in USA", Icon: Flag },
  artisan: { label: "Artisan made", Icon: Hammer },
  women_owned: { label: "Women owned", Icon: Flower2 },
  minority_owned: { label: "Minority owned", Icon: Users },
};

interface BrandWindowProps {
  brand: Brand;
  averageRating: number;
  productCount: number;
  heroImage: string;
  products: WindowProductPhoto[];
  attributes: BrandAttribute[];
  priority?: boolean;
}

// Read-only star row on the light page background.
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, rating - i));
          return (
            <span key={i} className="relative">
              <Star className="h-3.5 w-3.5 text-text/20" strokeWidth={1.5} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className="h-3.5 w-3.5 fill-accent text-accent"
                  strokeWidth={1.5}
                />
              </span>
            </span>
          );
        })}
      </span>
      <span className="tabular-nums text-xs text-text/50">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

function AttributeBadges({ attributes }: { attributes: BrandAttribute[] }) {
  // Tooltip shows on hover (desktop) and on tap (mobile, via openKey).
  const [openKey, setOpenKey] = useState<BrandAttribute | null>(null);

  useEffect(() => {
    if (!openKey) return;
    const close = () => setOpenKey(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openKey]);

  if (attributes.length === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {attributes.map((a) => {
        const { label, Icon } = ATTRIBUTE_META[a];
        const open = openKey === a;
        return (
          <button
            key={a}
            type="button"
            aria-label={label}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpenKey(open ? null : a);
            }}
            className="group relative flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text/55 transition-colors hover:text-text"
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span
              role="tooltip"
              className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-text px-2 py-1 text-[11px] font-medium text-bg shadow-md transition-opacity duration-150 group-hover:opacity-100 ${
                open ? "opacity-100" : "opacity-0"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PhotoCell({
  href,
  src,
  alt,
  className = "",
  rounded = "rounded-lg",
  priority,
}: {
  href: string;
  src: string;
  alt: string;
  className?: string;
  rounded?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden bg-bg ${rounded} ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 640px) 25vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
        />
      ) : null}
    </Link>
  );
}

// Fills a fixed-dimension box with whatever product photos exist. Product
// photos link to their product page; the central brand hero (5+ layout) links
// to the brand page.
function WindowGallery({
  brand,
  heroImage,
  products,
  priority,
}: {
  brand: Brand;
  heroImage: string;
  products: WindowProductPhoto[];
  priority?: boolean;
}) {
  const alt = `${brand.name} product`;
  const brandHref = `/brand/${brand.id}`;
  const n = products.length;
  const pcell = (p: WindowProductPhoto, key: string, className = "") => (
    <PhotoCell
      key={key}
      href={`/product/${p.id}`}
      src={p.image}
      alt={alt}
      className={className}
      priority={priority}
    />
  );

  let content: React.ReactNode;

  if (n >= 5) {
    // Standard: 2 stacked left · brand-hero 4:5 center · 2 stacked right.
    content = (
      <div className="grid h-full grid-cols-4 grid-rows-2 gap-2">
        {pcell(products[0], "l0", "col-start-1 row-start-1")}
        {pcell(products[1], "l1", "col-start-1 row-start-2")}
        <PhotoCell
          href={brandHref}
          src={heroImage}
          alt={brand.name}
          rounded="rounded-xl"
          className="col-start-2 col-span-2 row-start-1 row-span-2"
          priority={priority}
        />
        {pcell(products[2], "r0", "col-start-4 row-start-1")}
        {pcell(products[3], "r1", "col-start-4 row-start-2")}
      </div>
    );
  } else if (n === 4) {
    // 2x2 grid.
    content = (
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-2">
        {products.slice(0, 4).map((p, i) => pcell(p, `g${i}`))}
      </div>
    );
  } else if (n === 3) {
    // One large left + two stacked right.
    content = (
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-2">
        {pcell(products[0], "b", "col-start-1 row-start-1 row-span-2")}
        {pcell(products[1], "s0", "col-start-2 row-start-1")}
        {pcell(products[2], "s1", "col-start-2 row-start-2")}
      </div>
    );
  } else if (n === 2) {
    // Split in two.
    content = (
      <div className="grid h-full grid-cols-2 gap-2">
        {pcell(products[0], "h0")}
        {pcell(products[1], "h1")}
      </div>
    );
  } else if (n === 1) {
    // Single product photo fills the box.
    content = (
      <div className="grid h-full grid-cols-1 gap-2">{pcell(products[0], "solo")}</div>
    );
  } else {
    // No product photos — brand hero fills the box, links to the brand page.
    content = (
      <div className="grid h-full grid-cols-1 gap-2">
        <PhotoCell href={brandHref} src={heroImage} alt={brand.name} priority={priority} />
      </div>
    );
  }

  return <div className="aspect-[16/10] w-full">{content}</div>;
}

export function BrandWindow({
  brand,
  averageRating,
  productCount,
  heroImage,
  products,
  attributes,
  priority = false,
}: BrandWindowProps) {
  const isLogoSvg = brand.logoMark.includes(".svg");
  const brandHref = `/brand/${brand.id}`;

  return (
    <div>
      {/* Brand info — sits above the window, on the page background */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={brandHref}
            className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-divider/50 bg-bg"
          >
            {isLogoSvg ? (
              // eslint-disable-next-line @next/next/no-img-element
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
          </Link>

          <div className="min-w-0">
            <Link
              href={brandHref}
              className="font-headline text-base font-medium text-text transition-colors hover:text-accent"
            >
              {brand.name}
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text/50">
              {productCount > 0 && <Stars rating={averageRating} />}
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {brand.location}
              </span>
            </div>
          </div>
        </div>

        <AttributeBadges attributes={attributes} />
      </div>

      <p className="mb-3 text-sm text-text/70">{brand.tagline}</p>

      {/* The window */}
      <div className="rounded-2xl border border-divider/50 bg-surface/40 p-3 sm:p-4">
        <WindowGallery
          brand={brand}
          heroImage={heroImage}
          products={products}
          priority={priority}
        />
      </div>
    </div>
  );
}
