"use client";

import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/ProductCard";
import { ShoppableVideoCard } from "@/components/home/ShoppableVideoCard";
import { buildSpotlightRows } from "@/data/spotlight";

export function ShoppableFeed({ onShare }: { onShare: (message: string) => void }) {
  const rows = buildSpotlightRows(4);

  return (
    <section id="nu-feed" className="mt-10 scroll-mt-24 md:mt-16">
      <div className="mb-6">
        <h2 className="font-headline text-2xl tracking-tight text-text">Nu for you</h2>
        <p className="mt-1 text-sm text-text/50">
          Shoppable stories from independent brands
        </p>
      </div>

      <div className="space-y-12 md:space-y-16">
        {rows.map((row, index) => {
          const videoFirst = index % 2 === 0;

          return (
            <div
              key={row.id}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch"
            >
              {/* Video column */}
              <div className={cn(videoFirst ? "md:order-1" : "md:order-2")}>
                <ShoppableVideoCard
                  videoUrl={row.videoUrl}
                  product={row.featured}
                  onShare={onShare}
                />
              </div>

              {/* 2x2 product grid — fills the height of the video column */}
              <div className={cn("md:h-full", videoFirst ? "md:order-2" : "md:order-1")}>
                <div className="grid grid-cols-2 gap-4 md:h-full md:auto-rows-fr">
                  {row.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onShare={onShare}
                      stretch
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
