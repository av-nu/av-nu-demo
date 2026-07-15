"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock, LockOpen, Minus, Plus, Sparkles } from "lucide-react";

import type { Product } from "@/data/mockProducts";
import { getBrandById } from "@/lib/data";
import { cn } from "@/lib/utils";

type LookProductTileProps = {
  product: Product;
  selected?: boolean;
  locked?: boolean;
  onLock?: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
  onSwap?: () => void;
};

export function LookProductTile({
  product,
  selected = false,
  locked = false,
  onLock,
  onAdd,
  onRemove,
  onSwap,
}: LookProductTileProps) {
  const brand = getBrandById(product.brandId);

  return (
    <article
      className={cn(
        "group relative min-w-[172px] overflow-hidden rounded-2xl border bg-bg transition-all",
        selected ? "border-accent ring-1 ring-accent/20" : "border-divider/60 hover:border-text/20",
      )}
    >
      <Link href={`/product/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-surface">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 46vw, 190px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {selected && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-bg/90 px-2 py-1 text-[10px] font-semibold text-accent shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3" />
            In your look
          </span>
        )}
      </Link>

      <div className="space-y-1.5 p-3">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-text/45">
          {brand?.name ?? "Independent brand"}
        </p>
        <Link href={`/product/${product.id}`} className="line-clamp-2 min-h-10 font-headline text-sm leading-snug text-text hover:text-accent">
          {product.name}
        </Link>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-semibold text-text">${product.price}</span>
          <div className="flex items-center gap-1">
            {onLock && (
              <button
                type="button"
                onClick={onLock}
                aria-label={locked ? `Unlock ${product.name}` : `Lock ${product.name}`}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                  locked ? "bg-accent/15 text-accent" : "bg-surface text-text/50 hover:text-text",
                )}
              >
                {locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
              </button>
            )}
            {onRemove && (
              <button type="button" onClick={onRemove} aria-label={`Remove ${product.name} from this look`} className="flex h-7 w-7 items-center justify-center rounded-full bg-pink/10 text-pink transition-colors hover:bg-pink hover:text-white">
                <Minus className="h-3.5 w-3.5" />
              </button>
            )}
            {onAdd && (
              <button type="button" onClick={onAdd} aria-label={`Add ${product.name} to this look`} className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors hover:bg-accent hover:text-white">
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            {onSwap && (
              <button type="button" onClick={onSwap} className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-text/70 transition-colors hover:bg-accent/15 hover:text-accent">Swap in</button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
