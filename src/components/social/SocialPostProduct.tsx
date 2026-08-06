import Image from "next/image";

import type { Product } from "@/data/mockProducts";

/** The "first product" tile shared by every social post format. */
export function SocialPostProduct({ product, onOpen }: { product: Product; onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpen?.();
      }}
      className="mt-2 flex w-full items-center gap-2 rounded-xl border border-divider/50 p-2 text-left transition-colors hover:border-accent/40"
    >
      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface">
        <Image src={product.images[0]} alt={product.name} fill sizes="40px" className="object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-midnight">{product.name}</span>
        <span className="block text-xs text-midnight/50">Shop the product</span>
      </span>
    </button>
  );
}
