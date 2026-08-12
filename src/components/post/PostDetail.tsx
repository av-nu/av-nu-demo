"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ShoppingBag } from "lucide-react";

import { PostPager } from "@/components/post/PostPager";
import { Avatar } from "@/components/social/Avatar";
import { SocialPostActions } from "@/components/social/SocialPostActions";
import { getProductById } from "@/lib/data";
import type { Post } from "@/lib/post";
import type { SocialUser } from "@/lib/social";

/**
 * A post read in full: the artwork alongside its caption, products, and
 * conversation.
 *
 * Shared by the quick view and the post page so the two cannot drift — the same
 * post opened from the feed or from a link is the same thing.
 */
export function PostDetail({
  post,
  author,
  liked,
  saved,
  onLike,
  onSave,
  onShare,
  onComment,
  onProductClick,
  /** Space for a floating close or back control in the rail's first row. */
  headerInset = false,
}: {
  post: Post;
  author: Pick<SocialUser, "name" | "initials" | "color" | "avatarUrl">;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onComment?: (text: string) => void;
  onProductClick?: (productId: string) => void;
  headerInset?: boolean;
}) {
  const [page, setPage] = useState(post.coverPageIndex);
  const [draft, setDraft] = useState("");
  const [productsOpen, setProductsOpen] = useState(false);
  const products = post.productIds.map(getProductById).filter(Boolean) as NonNullable<ReturnType<typeof getProductById>>[];

  return (
    <>
      {/* Artwork */}
      <div className="flex shrink-0 flex-col justify-center bg-surface/40 md:w-[58%] md:overflow-hidden">
        <PostPager pages={post.pages} index={page} onIndex={setPage} showPins />
      </div>

      {/* Caption, products, conversation */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-divider/50 md:border-l md:border-t-0">
        <div className={`flex items-center gap-3 px-4 py-3 ${headerInset ? "pr-14" : ""}`}>
          <Avatar user={author} size="sm" className="h-9 w-9 text-xs" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-midnight">{author.name}</p>
        </div>

        <div className="space-y-4 px-4 pb-4 md:min-h-0 md:flex-1 md:overflow-y-auto">
          {post.caption && <p className="break-words text-sm leading-relaxed text-midnight/90">{post.caption}</p>}

          {products.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setProductsOpen((open) => !open)}
                aria-expanded={productsOpen}
                className="mb-2 flex w-full items-center gap-2.5 rounded-xl border border-navy/25 bg-navy/[0.06] px-3 py-2.5 text-left transition-colors hover:border-navy/40 hover:bg-navy/10"
              >
                <ShoppingBag className="h-4 w-4 shrink-0 text-navy" />
                <span className="min-w-0 flex-1 text-sm font-semibold text-navy">Shop this post</span>
                <span className="shrink-0 rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-white">{products.length}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-navy/70 transition-transform ${productsOpen ? "rotate-180" : ""}`} />
              </button>
              <ul className={`min-w-0 space-y-2 ${productsOpen ? "" : "hidden"}`}>
                {products.map((product) => (
                  <li key={product.id} className="min-w-0">
                    <Link
                      href={`/product/${product.id}`}
                      onClick={(event) => {
                        if (!onProductClick) return;
                        event.preventDefault();
                        onProductClick(product.id);
                      }}
                      className="flex items-center gap-3 rounded-xl border border-divider/50 p-2 transition-colors hover:border-accent"
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                        <Image src={product.images[0]} alt={product.name} fill sizes="48px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-midnight">{product.name}</span>
                        <span className="block text-xs text-midnight/55">${product.price}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-midnight/40">
              {post.comments.length > 0 ? `${post.comments.length} ${post.comments.length === 1 ? "comment" : "comments"}` : "Comments"}
            </p>
            {post.comments.length === 0 ? (
              <p className="text-xs text-midnight/45">No comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {post.comments.map((comment) => (
                  <li key={comment.id} className="flex gap-2">
                    <Avatar
                      user={{ name: comment.authorName, initials: comment.authorInitials, color: comment.authorColor }}
                      size="sm"
                      className="h-7 w-7 text-[10px]"
                    />
                    <p className="min-w-0 flex-1 text-xs leading-relaxed text-midnight/80">
                      <span className="font-semibold text-midnight">{comment.authorName}</span> {comment.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-divider/50">
          <SocialPostActions liked={liked} saved={saved} onLike={onLike} onComment={() => undefined} onSave={onSave} onShare={onShare} />
          <p className="px-3 pb-2 text-sm font-semibold text-midnight">
            {post.likes.toLocaleString()} {post.likes === 1 ? "like" : "likes"}
          </p>
          {onComment && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const text = draft.trim();
                if (!text) return;
                onComment(text);
                setDraft("");
              }}
              className="flex items-center gap-2 border-t border-divider/50 p-3"
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Add a comment…"
                className="h-10 min-w-0 flex-1 rounded-full border border-divider/70 bg-surface/40 px-3 text-sm text-midnight placeholder:text-midnight/40 focus:border-accent/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="shrink-0 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Post
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
