"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Gift, ShoppingBag } from "lucide-react";

import { FaveButton } from "@/components/faves/FaveButton";
import { useToast } from "@/components/ui/Toast";
import { getBrandById, getProductById } from "@/lib/data";
import { decodeSharedFaves } from "@/lib/sharedFaves";

export default function SharedFavesPage() {
  const params = useParams<{ token: string }>();
  const { showToast, ToastContainer } = useToast();
  const payload = decodeSharedFaves(params.token);
  const products = payload?.productIds.map(getProductById).filter((product): product is NonNullable<typeof product> => Boolean(product)) ?? [];

  if (!payload) {
    return <div className="mx-auto max-w-2xl py-16 text-center"><h1 className="font-headline text-3xl">This shopping link is unavailable</h1><Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent"><ArrowLeft className="h-4 w-4" />Discover products</Link></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-6">
      <section className="overflow-hidden rounded-3xl bg-pink/10 px-5 py-8 text-center sm:px-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/75 text-burgundy"><Gift className="h-5 w-5" /></span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-burgundy/60">Shared with you</p>
        <h1 className="mt-2 font-headline text-3xl text-text sm:text-4xl">{payload.name}</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-text/60">Shop directly from this list. You do not need an av | nu account.</p>
      </section>

      {products.length === 0 ? <p className="rounded-2xl border border-divider/60 py-12 text-center text-sm text-text/50">This list does not have any available products yet.</p> : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const brand = getBrandById(product.brandId);
            return <article key={product.id} className="group overflow-hidden rounded-2xl border border-divider/50 bg-bg"><Link href={`/product/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-surface"><Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /></Link><div className="space-y-1 p-3"><p className="text-[10px] uppercase tracking-wide text-text/40">{brand?.name}</p><Link href={`/product/${product.id}`} className="line-clamp-2 font-headline text-sm">{product.name}</Link><div className="flex items-center justify-between pt-2"><span className="text-sm font-semibold">${product.price}</span><FaveButton product={product} onToast={showToast} /></div></div></article>;
          })}
        </div>
      )}

      <div className="flex justify-center"><Link href="/" className="inline-flex items-center gap-2 rounded-full bg-text px-5 py-3 text-sm font-semibold text-white"><ShoppingBag className="h-4 w-4" />Keep discovering</Link></div>
      <ToastContainer />
    </div>
  );
}
