"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { buildWhatsNuProducts } from "@/data/spotlight";

// Each circle is revealed at a wider breakpoint, so the count grows with the
// viewport: 4 on mobile up to 8 on extra-large screens.
const VISIBILITY = [
  "flex", // 0
  "flex", // 1
  "flex", // 2
  "flex", // 3
  "hidden sm:flex", // 4
  "hidden md:flex", // 5
  "hidden lg:flex", // 6
  "hidden xl:flex", // 7
];

export function WhatsNuCircles() {
  const products = buildWhatsNuProducts(VISIBILITY.length);

  return (
    <section className="mt-8 md:mt-12">
      <h2 className="mb-5 font-headline text-xl tracking-tight text-text md:text-2xl">
        What&apos;s Nu
      </h2>

      <div className="flex items-start justify-between gap-3 sm:gap-4">
        {products.map((product, index) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className={cn(
              "group flex-col items-center gap-2",
              VISIBILITY[index],
            )}
          >
            <span className="rounded-full bg-gradient-to-tr from-accent via-pink to-burgundy p-[3px] transition-transform duration-200 group-hover:scale-105">
              <span className="block rounded-full bg-bg p-[3px]">
                <span className="relative block h-[72px] w-[72px] overflow-hidden rounded-full sm:h-24 sm:w-24 lg:h-28 lg:w-28">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </span>
              </span>
            </span>
            <span className="line-clamp-1 max-w-[88px] text-center text-xs text-text/70 sm:max-w-[104px] lg:max-w-[120px]">
              {product.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
