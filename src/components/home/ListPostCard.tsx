"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { getProductById } from "@/lib/data";
import { LIST_TYPE_META, type FaveListType } from "@/data/faves";

export type FeedListPost = {
  id: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  name: string;
  type: FaveListType;
  productIds: string[];
  /** Internal link for the user's own lists; community lists have none. */
  href?: string;
};

export function ListPostCard({ post }: { post: FeedListPost }) {
  const products = post.productIds
    .map((id) => getProductById(id))
    .filter(Boolean)
    .slice(0, 4) as NonNullable<ReturnType<typeof getProductById>>[];

  if (products.length === 0) return null;

  const typeMeta = LIST_TYPE_META[post.type];

  return (
    <div className="overflow-hidden rounded-2xl border border-divider/50 bg-surface/30">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white",
            post.authorColor,
          )}
        >
          {post.authorInitials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text">
            <span className="font-semibold">{post.authorName}</span>
            <span className="text-text/50"> shared a {post.type.toLowerCase()}</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs">
            <span className={cn("font-medium", typeMeta.accent)}>{post.name}</span>
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-text/40">
          <Heart className="h-4 w-4" />
        </span>
      </div>

      {/* Product thumbnails */}
      <div className="grid grid-cols-4 gap-1 px-1">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group relative aspect-square overflow-hidden rounded-lg bg-surface"
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 25vw, 12vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4">
        <span className="text-xs text-text/50">
          {post.productIds.length} {post.productIds.length === 1 ? "item" : "items"}
        </span>
        {post.href ? (
          <Link
            href={post.href}
            className="group flex items-center gap-1.5 text-sm font-medium text-accent"
          >
            View list
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <Link
            href={`/product/${products[0].id}`}
            className="group flex items-center gap-1.5 text-sm font-medium text-accent"
          >
            Shop the list
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
