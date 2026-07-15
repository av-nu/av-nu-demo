"use client";

import { Heart, MessageCircle, Send } from "lucide-react";

import { LayflatPostPreview } from "@/components/looks/LayflatPostPreview";
import type { Product } from "@/data/mockProducts";
import type { EditorialPageDesign } from "@/lib/editorial";
import type { LayflatStyle, LookbookLayout, LookbookMedia } from "@/lib/lookEngine";

type LookbookSocialPostPreviewProps = {
  title: string;
  products: Product[];
  layout?: LookbookLayout;
  backgroundColor?: string;
  backgroundImage?: string;
  editorialDesign?: EditorialPageDesign;
  media?: LookbookMedia[];
  layflatStyle?: LayflatStyle;
  gridItemCount?: number;
};

export function LookbookSocialPostPreview({ title, products, layout, backgroundColor, backgroundImage, editorialDesign, media, layflatStyle, gridItemCount }: LookbookSocialPostPreviewProps) {
  return (
    <article className="overflow-hidden rounded-2xl bg-[#2f2f2d] shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3 px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-burgundy text-xs font-semibold">AV</span>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Your Lookbook</p><p className="truncate text-xs text-white/55">{title}</p></div>
        <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] font-semibold">Public</span>
      </div>
      <div className="px-3"><LayflatPostPreview products={products} title={title} layout={layout} backgroundColor={backgroundColor} backgroundImage={backgroundImage} editorialDesign={editorialDesign} media={media} layflatStyle={layflatStyle} gridItemCount={gridItemCount} /></div>
      <div className="flex items-center gap-4 px-4 py-4 text-white"><Heart className="h-5 w-5" /><MessageCircle className="h-5 w-5" /><Send className="h-5 w-5" /></div>
      <div className="px-4 pb-4 text-sm text-white/85"><p className="font-semibold">0 likes</p><p className="mt-1 text-white/60">Your public post will support likes and comments in the community feed.</p></div>
    </article>
  );
}
