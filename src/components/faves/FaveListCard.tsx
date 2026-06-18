"use client";

import Link from "next/link";
import Image from "next/image";
import { Lock, Users, Globe2, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FaveList } from "@/data/faves";
import { LIST_TYPE_META } from "@/data/faves";
import { getProductById } from "@/lib/data";

const VISIBILITY_META = {
  private: { icon: Lock, label: "Private" },
  "inner-circle": { icon: Users, label: "Inner circle" },
  public: { icon: Globe2, label: "Public" },
} as const;

export function FaveListCard({ list }: { list: FaveList }) {
  const images = list.productIds
    .map((id) => getProductById(id)?.images[0])
    .filter(Boolean)
    .slice(0, 4) as string[];

  const typeMeta = LIST_TYPE_META[list.type];
  const vis = VISIBILITY_META[list.visibility];
  const VisIcon = vis.icon;

  return (
    <Link
      href={`/favorites/${list.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-divider/50 bg-surface/30 transition-colors hover:border-text/20"
    >
      {/* Cover collage */}
      <div className="relative aspect-[4/3] bg-surface">
        {images.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-text/30">
            <ImageIcon className="h-8 w-8" strokeWidth={1.5} />
          </div>
        ) : (
          <div
            className={cn(
              "grid h-full w-full gap-0.5",
              images.length === 1 ? "grid-cols-1" : "grid-cols-2",
              images.length > 2 ? "grid-rows-2" : "grid-rows-1",
            )}
          >
            {images.map((src, i) => (
              <div
                key={i}
                className={cn(
                  "relative overflow-hidden bg-surface",
                  images.length === 3 && i === 0 && "row-span-2",
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}

        {/* Visibility badge */}
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-bg/85 px-2 py-1 text-[10px] font-medium text-text/70 backdrop-blur-sm">
          <VisIcon className="h-3 w-3" />
          {vis.label}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <span className={cn("text-[11px] font-medium uppercase tracking-wide", typeMeta.accent)}>
          {list.type}
        </span>
        <span className="line-clamp-1 font-headline text-sm font-medium text-text">
          {list.name}
        </span>
        <span className="text-xs text-text/50">
          {list.productIds.length} {list.productIds.length === 1 ? "item" : "items"}
        </span>
      </div>
    </Link>
  );
}
