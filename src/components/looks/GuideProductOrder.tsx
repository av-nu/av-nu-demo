import Image from "next/image";
import { ChevronDown, ChevronUp, Star, Trash2 } from "lucide-react";

import type { Product } from "@/data/mockProducts";

type GuideProductOrderProps = {
  products: Product[];
  onChangeAction: (productIds: string[]) => void;
};

export function GuideProductOrder({ products, onChangeAction }: GuideProductOrderProps) {
  const productIds = products.map((product) => product.id);

  const move = (index: number, nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= productIds.length) return;
    const next = [...productIds];
    const [productId] = next.splice(index, 1);
    next.splice(nextIndex, 0, productId);
    onChangeAction(next);
  };

  const feature = (productId: string) => {
    onChangeAction([productId, ...productIds.filter((id) => id !== productId)]);
  };

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text/45">Product order</p>
          <p className="mt-1 text-[11px] text-text/45">The first product is the featured hero. Reorder the rest from left to right.</p>
        </div>
        <span className="shrink-0 rounded-full bg-surface px-2 py-1 text-[10px] font-semibold text-text/50">{products.length} products</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {products.map((product, index) => (
          <article key={product.id} className={`flex min-w-0 items-center gap-2 rounded-xl border p-2 ${index === 0 ? "border-burgundy/50 bg-burgundy/5" : "border-divider/60 bg-bg"}`}>
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
              <Image src={product.images[0]} alt={product.name} fill sizes="56px" className="object-cover" />
              <span className="absolute left-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bg/90 px-1 text-[8px] font-bold text-text shadow-sm">{index + 1}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-text">{product.name}</p>
              <button type="button" onClick={() => feature(product.id)} disabled={index === 0} className={`mt-1 inline-flex items-center gap-1 text-[9px] font-semibold ${index === 0 ? "text-burgundy" : "text-text/40 hover:text-burgundy"}`}><Star className={`h-3 w-3 ${index === 0 ? "fill-current" : ""}`} />{index === 0 ? "Featured" : "Make featured"}</button>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={`Move ${product.name} earlier`} className="flex h-6 w-6 items-center justify-center rounded-md bg-surface text-text/55 disabled:opacity-25"><ChevronUp className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => move(index, index + 1)} disabled={index === products.length - 1} aria-label={`Move ${product.name} later`} className="flex h-6 w-6 items-center justify-center rounded-md bg-surface text-text/55 disabled:opacity-25"><ChevronDown className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => onChangeAction(productIds.filter((id) => id !== product.id))} aria-label={`Remove ${product.name}`} className="flex h-6 w-6 items-center justify-center rounded-md bg-burgundy/10 text-burgundy hover:bg-burgundy hover:text-white"><Trash2 className="h-3 w-3" /></button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
