import Image from "next/image";

import type { CommunityList } from "@/data/faves";
import type { Contact } from "@/data/social";
import { getProductById } from "@/lib/data";

type FeaturedGuideArtworkProps = {
  guide: CommunityList;
  productIds: string[];
  author?: Contact;
  className?: string;
};

export function FeaturedGuideArtwork({ guide, productIds, author, className }: FeaturedGuideArtworkProps) {
  const products = productIds.map(getProductById).filter((product): product is NonNullable<ReturnType<typeof getProductById>> => Boolean(product));
  const hero = products[0];

  return (
    <div className={`relative aspect-[4/5] overflow-hidden bg-text ${className ?? ""}`}>
      {hero && <Image src={hero.images[0]} alt={guide.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/5 to-black/65" />
      <div className="absolute inset-x-0 top-0 z-10 p-4 text-white">
        <span className="inline-flex rounded-md bg-pink px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-burgundy">Guide</span>
        <h3 className="mt-2 max-w-[82%] font-headline text-2xl leading-[0.95] drop-shadow-sm">{guide.name}</h3>
        <p className="mt-3 line-clamp-3 max-w-[78%] text-[9px] leading-relaxed text-white/90 drop-shadow-sm">{guide.caption}</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end gap-2 p-3">
        <div className="flex min-w-0 flex-1 gap-1.5">
          {products.slice(0, 3).map((product) => <span key={product.id} className="relative aspect-square w-[27%] min-w-10 overflow-hidden rounded-lg border-2 border-white bg-white shadow-md"><Image src={product.images[0]} alt={product.name} fill sizes="72px" className="object-cover" /></span>)}
        </div>
        <span className="shrink-0 text-[8px] font-semibold text-white drop-shadow-sm">See the edit</span>
      </div>
      {author && <span className="sr-only">Featured Guide by {author.name}</span>}
    </div>
  );
}
