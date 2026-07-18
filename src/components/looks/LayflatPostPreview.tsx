"use client";

import Image from "next/image";
import Link from "next/link";

import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import type { Product } from "@/data/mockProducts";
import type { EditorialPageDesign } from "@/lib/editorial";
import type { LayflatStyle, LookbookLayout, LookbookMedia } from "@/lib/lookEngine";

const layflatPositions: Record<LayflatStyle, string[]> = {
  classic: ["left-[3%] top-[5%] h-[73%] w-[47%] -rotate-2", "right-[2%] top-[6%] h-[74%] w-[46%] rotate-2", "left-[4%] bottom-[3%] h-[29%] w-[30%] -rotate-5", "left-[32%] bottom-[2%] h-[27%] w-[28%] rotate-4", "right-[3%] bottom-[4%] h-[25%] w-[27%] -rotate-3", "left-[40%] top-[37%] h-[20%] w-[20%] rotate-6", "right-[31%] top-[2%] h-[19%] w-[18%] -rotate-4", "left-[2%] top-[35%] h-[18%] w-[18%] rotate-3"],
  diagonal: ["left-[3%] top-[8%] h-[58%] w-[54%] -rotate-3", "right-[3%] top-[8%] h-[57%] w-[41%] rotate-2", "left-[9%] bottom-[3%] h-[38%] w-[35%] rotate-5", "right-[24%] bottom-[3%] h-[36%] w-[34%] -rotate-5", "right-[3%] bottom-[7%] h-[26%] w-[22%] rotate-3", "left-[44%] top-[39%] h-[22%] w-[20%] -rotate-7", "left-[1%] bottom-[24%] h-[19%] w-[19%] rotate-7", "right-[1%] top-[34%] h-[18%] w-[17%] -rotate-2"],
  stacked: ["left-[1%] top-[3%] h-[76%] w-[61%] -rotate-1", "right-[1%] top-[4%] h-[78%] w-[49%] rotate-1", "left-[2%] bottom-[1%] h-[31%] w-[35%] -rotate-5", "left-[30%] bottom-[1%] h-[31%] w-[34%] rotate-6", "right-[1%] bottom-[2%] h-[30%] w-[29%] -rotate-3", "left-[18%] top-[27%] h-[22%] w-[22%] rotate-5", "right-[35%] top-[1%] h-[18%] w-[18%] -rotate-5", "right-[2%] top-[42%] h-[17%] w-[17%] rotate-4"],
  orbit: ["left-[25%] top-[18%] h-[58%] w-[50%] -rotate-2", "left-[2%] top-[3%] h-[42%] w-[37%] rotate-3", "right-[2%] top-[2%] h-[40%] w-[36%] -rotate-3", "left-[1%] bottom-[2%] h-[38%] w-[37%] -rotate-4", "right-[1%] bottom-[1%] h-[39%] w-[38%] rotate-4", "left-[39%] bottom-[1%] h-[25%] w-[24%] -rotate-5", "left-[4%] top-[41%] h-[21%] w-[20%] rotate-6", "right-[4%] top-[40%] h-[20%] w-[19%] -rotate-6"],
};

const gridPositions: Record<number, string[]> = {
  1: ["col-start-1 col-span-12 row-start-1 row-span-12"],
  2: ["col-start-1 col-span-6 row-start-1 row-span-12", "col-start-7 col-span-6 row-start-1 row-span-12"],
  3: ["col-start-1 col-span-7 row-start-1 row-span-12", "col-start-8 col-span-5 row-start-1 row-span-6", "col-start-8 col-span-5 row-start-7 row-span-6"],
  4: ["col-start-1 col-span-6 row-start-1 row-span-6", "col-start-7 col-span-6 row-start-1 row-span-6", "col-start-1 col-span-6 row-start-7 row-span-6", "col-start-7 col-span-6 row-start-7 row-span-6"],
  5: ["col-start-1 col-span-8 row-start-1 row-span-8", "col-start-9 col-span-4 row-start-1 row-span-4", "col-start-9 col-span-4 row-start-5 row-span-4", "col-start-1 col-span-6 row-start-9 row-span-4", "col-start-7 col-span-6 row-start-9 row-span-4"],
  6: ["col-start-1 col-span-4 row-start-1 row-span-6", "col-start-5 col-span-4 row-start-1 row-span-6", "col-start-9 col-span-4 row-start-1 row-span-6", "col-start-1 col-span-4 row-start-7 row-span-6", "col-start-5 col-span-4 row-start-7 row-span-6", "col-start-9 col-span-4 row-start-7 row-span-6"],
  7: ["col-start-1 col-span-6 row-start-1 row-span-8", "col-start-7 col-span-6 row-start-1 row-span-4", "col-start-7 col-span-6 row-start-5 row-span-4", "col-start-1 col-span-3 row-start-9 row-span-4", "col-start-4 col-span-3 row-start-9 row-span-4", "col-start-7 col-span-3 row-start-9 row-span-4", "col-start-10 col-span-3 row-start-9 row-span-4"],
  8: ["col-start-1 col-span-3 row-start-1 row-span-6", "col-start-4 col-span-3 row-start-1 row-span-6", "col-start-7 col-span-3 row-start-1 row-span-6", "col-start-10 col-span-3 row-start-1 row-span-6", "col-start-1 col-span-3 row-start-7 row-span-6", "col-start-4 col-span-3 row-start-7 row-span-6", "col-start-7 col-span-3 row-start-7 row-span-6", "col-start-10 col-span-3 row-start-7 row-span-6"],
};

type LayflatPostPreviewProps = {
  products: Product[];
  title: string;
  description?: string;
  layout?: LookbookLayout;
  backgroundColor?: string;
  backgroundImage?: string;
  editorialDesign?: EditorialPageDesign;
  media?: LookbookMedia[];
  layflatStyle?: LayflatStyle;
  gridItemCount?: number;
};

export function LayflatPostPreview({ products, title, description, layout = "layflat", backgroundColor = "#fffaf0", backgroundImage, editorialDesign, media = [], layflatStyle = "classic", gridItemCount = 4 }: LayflatPostPreviewProps) {
  const label = layout === "grid" ? "Grid post preview" : layout === "featured" ? "Featured guide preview" : layout === "editorial" ? "Editorial post preview" : "Styled layflat preview";
  const itemLimit = layout === "grid" ? Math.min(8, Math.max(1, gridItemCount)) : 8;
  const items = [...products.map((product) => ({ id: product.id, type: "product" as const, src: product.images[0], name: product.name })), ...media].slice(0, itemLimit);
  const featuredHero = media[0] ?? (products[0] ? { id: products[0].id, type: "product" as const, src: products[0].images[0], name: products[0].name } : undefined);
  const renderItem = (item: (typeof items)[number], className: string) => {
    const content = item.type === "video"
      ? <video src={item.src} className="h-full w-full object-cover" controls playsInline />
      : <Image src={item.src} alt={item.name} fill sizes="(max-width: 640px) 42vw, 220px" className={item.type === "product" && layout === "layflat" ? "object-contain drop-shadow-[0_14px_12px_rgba(40,32,28,0.2)] mix-blend-multiply" : "object-cover"} unoptimized={item.src.startsWith("data:")} />;
    return item.type === "product"
      ? <Link key={item.id} href={`/product/${item.id}`} className={className} aria-label={`Shop ${item.name}`}>{content}</Link>
      : <div key={item.id} className={className}>{content}</div>;
  };

  return (
    <div className="max-w-full overflow-hidden rounded-2xl border border-divider/60 bg-sky/25 p-3 shadow-sm">
      <div className="flex items-center justify-between px-1 pb-3">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text/55">{label}</span>
        <span className="rounded-full bg-bg/75 px-2 py-1 text-[10px] font-semibold text-text/55">Shoppable</span>
      </div>
      {layout === "editorial" && editorialDesign ? (
        <div className="overflow-hidden rounded-xl"><EditorialRenderer design={editorialDesign} /></div>
      ) : layout === "featured" ? (
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-text">
          {featuredHero?.type === "video" ? <video src={featuredHero.src} className="h-full w-full object-cover" controls playsInline /> : featuredHero ? <Image src={featuredHero.src} alt={featuredHero.name} fill sizes="(max-width: 640px) 78vw, 460px" className="object-cover" unoptimized={featuredHero.src.startsWith("data:")} /> : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/5 to-black/60" />
          <div className="absolute inset-x-0 top-0 z-10 p-5 text-white sm:p-7">
            <span className="inline-flex rounded-md bg-pink px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-burgundy">Guide</span>
            <h3 className="mt-3 max-w-[78%] font-headline text-3xl leading-[0.95] drop-shadow-sm sm:text-4xl">{title}</h3>
            {description && <p className="mt-4 max-w-[72%] text-[11px] leading-relaxed text-white/90 drop-shadow-sm sm:text-xs">{description}</p>}
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end gap-2 p-4 sm:p-5">
            <div className="flex min-w-0 flex-1 gap-2">
              {products.slice(0, 3).map((product) => <Link key={product.id} href={`/product/${product.id}`} aria-label={`Shop ${product.name}`} className="relative aspect-square w-[24%] min-w-12 overflow-hidden rounded-lg border-2 border-white bg-white shadow-md"><Image src={product.images[0]} alt={product.name} fill sizes="100px" className="object-cover" /></Link>)}
            </div>
            {products.length > 0 && <span className="shrink-0 text-[10px] font-semibold text-white drop-shadow-sm">See the edit</span>}
          </div>
        </div>
      ) : <div className="relative aspect-square overflow-hidden rounded-xl" style={{ backgroundColor }}>
        {backgroundImage && <Image src={backgroundImage} alt="" fill sizes="(max-width: 640px) 78vw, 360px" className="object-cover opacity-35" unoptimized />}
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.55),transparent_42%),radial-gradient(circle_at_78%_72%,rgba(239,155,111,0.18),transparent_34%)]" />
        {layout === "grid" ? (
          <div className="absolute inset-4 grid grid-cols-12 grid-rows-12 gap-2 pt-10">
            {items.map((item, index) => renderItem(item, `relative min-h-0 overflow-hidden rounded-lg bg-bg shadow-sm ${gridPositions[itemLimit][index]}`))}
          </div>
        ) : (
          items.map((item, index) => renderItem(item, `absolute overflow-hidden ${item.type === "product" ? "bg-transparent" : "rounded-sm bg-bg/70 shadow-sm"} ${layflatPositions[layflatStyle][index]}`))
        )}
        <p className="absolute left-4 top-4 z-10 max-w-[55%] rounded-full bg-white/75 px-3 py-1.5 font-headline text-sm leading-tight text-burgundy backdrop-blur-sm">{title}</p>
        {products.length > 0 && <span className="absolute bottom-4 right-4 z-10 rounded-full bg-burgundy/90 px-3 py-1.5 text-[10px] font-semibold text-white">Tap to shop</span>}
      </div>}
    </div>
  );
}
