"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ShoppingBag } from "lucide-react";

import { PostPager } from "@/components/post/PostPager";
import { Avatar } from "@/components/social/Avatar";
import { SocialPostActions } from "@/components/social/SocialPostActions";
import { useRequireAuth } from "@/components/auth/AccountInvitationDialog";
import { getProductById } from "@/lib/data";
import type { Post } from "@/lib/post";
import type { SocialUser } from "@/lib/social";

type ShopProduct = NonNullable<ReturnType<typeof getProductById>>;

function PostShopSection({
  products,
  productsOpen,
  onToggle,
  onProductClick,
  className,
}: {
  products: ShopProduct[];
  productsOpen: boolean;
  onToggle: () => void;
  onProductClick?: (productId: string) => void;
  className: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className={className}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={productsOpen}
        className="flex w-full items-center gap-2.5 rounded-xl bg-[#561F59] px-3 py-2.5 text-left text-white transition-colors hover:bg-[#561F59]/90"
      >
        <ShoppingBag className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 text-sm font-semibold">Shop the post</span>
        <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{products.length}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${productsOpen ? "rotate-180" : ""}`} />
      </button>
      <ul className={`mt-2 min-w-0 space-y-2 ${productsOpen ? "" : "hidden"}`}>
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
    </section>
  );
}

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
  headerInset = false,
}: {
  post: Post;
  author: Pick<SocialUser, "id" | "name" | "handle" | "initials" | "color" | "avatarUrl" | "isCurrentUser">;
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
  const { requireAuth, invitation } = useRequireAuth();
  const products = post.productIds.map(getProductById).filter(Boolean) as NonNullable<ReturnType<typeof getProductById>>[];
  const authorHref = author.isCurrentUser ? "/profile" : `/u/${author.id}`;

  const submitComment = (text: string) => {
    if (!onComment) return;
    if (requireAuth("comment on this post", () => onComment(text))) setDraft("");
  };

  const authorRow = (
    <div className={`flex items-center gap-3 px-4 py-3 ${headerInset ? "pr-14" : ""}`}>
      <Link href={authorHref} className="flex min-w-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
        <Avatar user={author} size="sm" className="h-9 w-9 text-xs" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-midnight">{author.name}</span>
          <span className="block truncate text-[11px] text-midnight/45">@{author.handle}</span>
        </span>
      </Link>
    </div>
  );

  return (
    <>
      <div className="flex w-full flex-col bg-white md:min-h-0 md:flex-row">
        <div className="md:hidden shrink-0 border-b border-divider/50">{authorRow}</div>

        <div className="flex shrink-0 flex-col justify-center bg-white md:w-[58%] md:overflow-hidden">
          <PostPager pages={post.pages} index={page} onIndex={setPage} showPins />
          <div className="md:hidden">
            <PostShopSection
              products={products}
              productsOpen={productsOpen}
              onToggle={() => setProductsOpen((open) => !open)}
              onProductClick={onProductClick}
              className="pb-4 pt-3"
            />
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-divider/50 bg-white md:border-l md:border-t-0">
          <div className="hidden md:block">{authorRow}</div>
          <div className="hidden md:block">
            <PostShopSection
              products={products}
              productsOpen={productsOpen}
              onToggle={() => setProductsOpen((open) => !open)}
              onProductClick={onProductClick}
              className="px-4 pb-4 pt-1"
            />
          </div>

          <div className="px-4 pb-4 md:min-h-0 md:flex-1 md:overflow-y-auto">
            <SocialPostActions
              className="-mx-3"
              liked={liked}
              saved={saved}
              likeCount={post.likes + (liked ? 1 : 0)}
              commentCount={post.comments.length}
              onLike={onLike}
              onComment={() => undefined}
              onSave={onSave}
              onShare={onShare}
            />

            {post.caption && <p className="break-words text-sm leading-relaxed text-midnight/90">{post.caption}</p>}

            <div className="mt-6">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-midnight/40">Conversation</p>
              {post.comments.length === 0 ? (
                <p className="text-xs text-midnight/45">No comments yet.</p>
              ) : (
                <ul className="space-y-3">
                  {post.comments.map((comment) => (
                    <li key={comment.id} className="flex gap-2">
                      <Avatar user={{ name: comment.authorName, initials: comment.authorInitials, color: comment.authorColor }} size="sm" className="h-7 w-7 text-[10px]" />
                      <p className="min-w-0 flex-1 text-xs leading-relaxed text-midnight/80">
                        <span className="font-semibold text-midnight">{comment.authorName}</span> {comment.text}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {onComment && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const text = draft.trim();
                if (text) submitComment(text);
              }}
              className="flex items-center gap-2 border-t border-divider/50 p-3"
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Add a comment…"
                className="h-10 min-w-0 flex-1 rounded-full border border-divider/70 bg-surface/40 px-3 text-sm text-midnight placeholder:text-midnight/40 focus:border-accent/50 focus:outline-none"
              />
              <button type="submit" disabled={!draft.trim()} className="shrink-0 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Post</button>
            </form>
          )}
        </div>
      </div>
      {invitation}
    </>
  );
}
