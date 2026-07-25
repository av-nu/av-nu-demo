"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { curatedGuideLooks } from "@/data/curatedGuides";
import { useSavedLooks } from "@/hooks/useSavedLooks";
import { getProductById } from "@/lib/data";

export function SavedLooksSection() {
  const { looks, isHydrated, seedLookbook } = useSavedLooks();

  useEffect(() => {
    if (isHydrated) seedLookbook(curatedGuideLooks);
  }, [isHydrated, seedLookbook]);

  if (!isHydrated) {
    return <div className="h-36 animate-pulse rounded-2xl bg-surface/50" />;
  }

  const recentLooks = looks.slice(0, 3);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-headline text-lg tracking-tight text-text">
            <Sparkles className="h-4 w-4 text-pink" />
            Guides
          </h2>
          <p className="mt-1 text-sm text-text/50">Private styling ideas you&apos;ve saved</p>
        </div>
        <Link href="/create" className="shrink-0 text-sm font-semibold text-accent hover:underline">Create new</Link>
      </div>
      {recentLooks.length === 0 ? (
        <Link href="/create" className="flex items-center justify-between rounded-2xl border border-dashed border-divider/60 p-5 transition-colors hover:border-accent/40 hover:bg-surface/30">
          <span><span className="block text-sm font-semibold text-text">Your Guides will live here</span><span className="mt-1 block text-sm text-text/50">Start with a vibe and make it yours.</span></span>
          <Sparkles className="h-5 w-5 text-pink" />
        </Link>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {recentLooks.map((look) => {
            const cover = getProductById(look.selectedProductIds[0] ?? "")?.images[0];
            return (
              <Link key={look.id} href={`/create/${look.id}`} className="group overflow-hidden rounded-2xl border border-divider/60 bg-surface/30 transition-colors hover:border-accent/40">
                <div className="relative aspect-[16/10] bg-surface">
                  {cover ? <Image src={cover} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : null}
                </div>
                <div className="p-3"><p className="truncate font-headline text-sm text-text">{look.title}</p><p className="mt-1 text-xs text-text/45">{look.selectedProductIds.length} pieces</p></div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
