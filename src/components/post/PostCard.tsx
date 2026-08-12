"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";

import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import { PostPins } from "@/components/post/PostPins";
import { Avatar } from "@/components/social/Avatar";
import { SocialPostActions } from "@/components/social/SocialPostActions";
import { getProductById } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/post";
import type { SocialUser } from "@/lib/social";

/**
 * One post in the feed, whatever it contains.
 *
 * Replaces the separate moment, video, and list cards: a post is pages of canvas
 * plus tagged products, so a single renderer covers every kind. No type pill —
 * the content says what it is.
 */
export function PostCard({
  post,
  author,
  liked,
  saved,
  onLike,
  onComment,
  onSave,
  onShare,
  onOpen,
  onProductClick,
  showPins = false,
  onDelete,
}: {
  post: Post;
  author: Pick<SocialUser, "name" | "initials" | "color" | "avatarUrl">;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
  onShare: () => void;
  onOpen: () => void;
  onProductClick?: (productId: string) => void;
  /** Tags crowd a feed-sized card; they are meant for the opened post. */
  showPins?: boolean;
  /** Provided only for the author's own posts. */
  onDelete?: () => void;
}) {
  const [page, setPage] = useState(post.coverPageIndex);
  const current = post.pages[Math.min(page, post.pages.length - 1)];
  const products = post.productIds.map(getProductById).filter(Boolean).slice(0, 6) as NonNullable<ReturnType<typeof getProductById>>[];

  return (
    <article className="overflow-hidden rounded-2xl border border-divider/50 bg-bg">
      <div className="flex items-center gap-3 px-3 py-3">
        <Avatar user={author} size="sm" className="h-10 w-10 text-xs" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-midnight">{author.name}</p>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete post"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-midnight/45 transition-colors hover:bg-surface hover:text-pink"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <button type="button" onClick={onOpen} className="relative block w-full" aria-label="Open post">
        <EditorialRenderer design={current.design} />
        {showPins && <PostPins pins={current.pins} />}
        {post.pages.length > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
            {Math.min(page, post.pages.length - 1) + 1}/{post.pages.length}
          </span>
        )}
      </button>

      {post.pages.length > 1 && (
        // Dots double as the carousel control, so a multi-page post can be read
        // without opening it.
        <div className="flex items-center justify-center gap-1.5 py-2">
          {post.pages.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(index)}
              aria-label={`Page ${index + 1}`}
              aria-current={index === page}
              className={cn("h-1.5 rounded-full transition-all", index === page ? "w-4 bg-midnight" : "w-1.5 bg-midnight/25")}
            />
          ))}
        </div>
      )}

      <SocialPostActions liked={liked} saved={saved} onLike={onLike} onComment={onComment} onSave={onSave} onShare={onShare} />

      <div className="space-y-1 px-3 pb-3">
        <p className="text-sm font-semibold text-midnight">{post.likes.toLocaleString()} {post.likes === 1 ? "like" : "likes"}</p>
        {post.caption && <p className="line-clamp-2 text-sm text-midnight/90">{post.caption}</p>}

        {products.length > 0 && (
          // The shoppable strip: every product in the post, however it was added.
          <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {products.map((product) => (
              <li key={product.id} className="shrink-0">
                <Link
                  href={`/product/${product.id}`}
                  onClick={(event) => {
                    if (!onProductClick) return;
                    event.preventDefault();
                    onProductClick(product.id);
                  }}
                  className="block w-16"
                  title={product.name}
                >
                  <span className="relative block aspect-square overflow-hidden rounded-lg border border-divider/50 bg-surface">
                    <Image src={product.images[0]} alt={product.name} fill sizes="64px" className="object-cover" />
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-midnight/60">${product.price}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
