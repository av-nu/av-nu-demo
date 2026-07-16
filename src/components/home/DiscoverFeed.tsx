import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Film, Heart, ImagePlus, Plus, ShoppingBag, Users } from "lucide-react";

import { AddPostMenu } from "@/components/social/AddPostMenu";
import { ProductCard } from "@/components/product/ProductCard";
import { buildSpotlightRows } from "@/data/spotlight";
import { communityLists, flattenPages } from "@/data/faves";
import { contacts, getContactById } from "@/data/social";
import { getProductById } from "@/lib/data";

export function DiscoverFeed({ onToast }: { onToast: (message: string) => void }) {
  const [scope, setScope] = useState<"discover" | "inner">("discover");
  const [creating, setCreating] = useState(false);
  const videos = useMemo(() => buildSpotlightRows(4), []);
  const innerIds = new Set(contacts.filter((contact) => contact.circle === "inner").map((contact) => contact.id));
  const visibleLists = communityLists.filter((list) => scope === "discover" || innerIds.has(list.authorId));
  const visibleVideos = scope === "discover" ? videos : videos.slice(0, 2);
  const products = videos.flatMap((row) => row.products).slice(0, scope === "discover" ? 12 : 6);
  const mixed = [
    ...visibleVideos.map((row, index) => ({ kind: "video" as const, id: row.id, index, data: row })),
    ...visibleLists.map((list, index) => ({ kind: "list" as const, id: list.id, index, data: list })),
    ...products.map((product, index) => ({ kind: "product" as const, id: product.id, index, data: product })),
  ].sort((a, b) => (a.index * 7 + a.id.length) % 13 - (b.index * 7 + b.id.length) % 13);

  return (
    <div className="mx-auto max-w-[1500px] pb-12">
      <header className="py-7 text-center sm:py-10">
        <p className="mx-auto max-w-none whitespace-nowrap px-0 text-xs uppercase tracking-[0.24em] text-burgundy/55">Shop Small Together</p>
        <h1 className="mt-2 font-headline text-4xl tracking-tight text-text sm:text-5xl">Discover something <span className="italic text-burgundy">nu</span></h1>
        <div className="mx-auto mt-5 flex w-fit rounded-full border border-divider bg-white p-1 shadow-sm">
          <button type="button" onClick={() => setScope("discover")} className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${scope === "discover" ? "bg-burgundy text-white" : "text-text/60"}`}>Discover</button>
          <button type="button" onClick={() => setScope("inner")} className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${scope === "inner" ? "bg-burgundy text-white" : "text-text/60"}`}>Inner Circle</button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-3xl border border-divider bg-white/75 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-4 overflow-x-auto pb-1">
            <Link href="/connections" className="flex shrink-0 flex-col items-center gap-2"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-divider bg-pink/10 text-burgundy"><Users className="h-5 w-5" /></span><span className="text-[10px] font-semibold text-text/60">My Circle</span></Link>
            {contacts.filter((contact) => scope === "discover" || contact.circle === "inner").slice(0, 8).map((contact) => <Link key={contact.id} href={`/u/${contact.id}`} className="flex shrink-0 flex-col items-center gap-2"><span className={`flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-pink/30 text-xs font-semibold text-white ${contact.color}`}>{contact.initials}</span><span className="max-w-16 truncate text-[10px] text-text/60">{contact.handle}</span></Link>)}
          </div>
        </section>

        <button type="button" onClick={() => setCreating(true)} className="flex min-h-28 items-center justify-between gap-4 rounded-3xl border border-divider bg-white px-5 text-left transition-colors hover:bg-pink/10">
          <div><span className="inline-flex items-center gap-1 rounded-full bg-burgundy px-2.5 py-1 text-[10px] font-semibold text-white"><Plus className="h-3 w-3" />Create</span><p className="mt-3 text-sm text-text/60">Post a guide, review, or moment</p></div>
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-pink/20 text-burgundy"><ImagePlus className="h-7 w-7" /></span>
        </button>
      </div>

      <p className="mb-4 mt-8 text-xs italic text-text/50">Inspiration, guides, and reviews from people and brands worth knowing.</p>
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
        {mixed.map((item) => {
          if (item.kind === "product") return <div key={`product-${item.id}`} className="mb-5 w-full break-inside-avoid"><ProductCard product={item.data} onShare={onToast} imageAspect={item.index % 3 === 0 ? "tall" : item.index % 3 === 1 ? "portrait" : "square"} /></div>;
          if (item.kind === "video") {
            const author = contacts[item.index % contacts.length];
            return <Link key={`video-${item.id}`} href={`/post/video/${item.id}`} className="group relative mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-text"><div className={`relative ${item.index % 2 ? "aspect-[4/5]" : "aspect-[3/5]"}`}><video src={item.data.videoUrl} muted loop playsInline autoPlay className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" /><div className="absolute left-3 right-3 top-3 flex items-center gap-2 text-white"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold ${author.color}`}>{author.initials}</span><span className="text-[11px] font-semibold">@{author.handle}</span><Film className="ml-auto h-4 w-4" /></div><div className="absolute bottom-3 left-3 right-3 text-white"><p className="font-headline text-lg leading-tight">{item.data.featured.name}</p><p className="mt-1 text-[10px] text-white/70">Watch and shop the look</p></div></div></Link>;
          }
          const author = getContactById(item.data.authorId);
          const productIds = flattenPages(item.data.pages);
          const images = productIds.map((id) => getProductById(id)?.images[0]).filter(Boolean).slice(0, 4) as string[];
          return <Link key={`list-${item.id}`} href={`/post/list/${item.id}`} className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-divider bg-white"><div className={`grid ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>{images.map((src, index) => <div key={src} className={`relative ${item.index % 3 === 0 ? "aspect-[4/5]" : item.index % 3 === 1 ? "aspect-square" : "aspect-[3/4]"}`}><Image src={src} alt="" fill sizes="240px" className="object-cover transition-transform duration-500 group-hover:scale-105" />{index === 0 && <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[9px] font-semibold text-text"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[7px] text-white ${author?.color}`}>{author?.initials}</span>@{author?.handle}</div>}</div>)}</div><div className="p-3"><p className="font-headline text-base text-text">{item.data.name}</p><p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-text/60">{item.data.caption}</p><div className="mt-3 flex items-center gap-3 text-[10px] text-burgundy/70"><span className="flex items-center gap-1"><Heart className="h-3 w-3" />{item.data.likes}</span><span className="ml-auto flex items-center gap-1"><ShoppingBag className="h-3 w-3" />Shop</span></div></div></Link>;
        })}
      </div>

      {creating && <AddPostMenu onClose={() => setCreating(false)} onToast={onToast} />}
    </div>
  );
}
