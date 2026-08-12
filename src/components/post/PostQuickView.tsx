"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ShoppingBag, X } from "lucide-react";

import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import { PostPins } from "@/components/post/PostPins";
import { Avatar } from "@/components/social/Avatar";
import { SocialPostActions } from "@/components/social/SocialPostActions";
import { Portal } from "@/components/ui/Portal";
import { getProductById } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/post";
import type { SocialUser } from "@/lib/social";

/**
 * A post opened from the feed: the artwork alongside a rail carrying the caption,
 * the products, and the conversation. The feed card stays deliberately quiet, so
 * this is where a post is actually read and shopped.
 */
export function PostQuickView({
  post,
  author,
  liked,
  saved,
  onLike,
  onSave,
  onShare,
  onComment,
  onProductClick,
  onClose,
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
  onClose: () => void;
}) {
  const [page, setPage] = useState(post.coverPageIndex);
  const [draft, setDraft] = useState("");
  const [productsOpen, setProductsOpen] = useState(false);
  const current = post.pages[Math.min(page, post.pages.length - 1)];
  const products = post.productIds.map(getProductById).filter(Boolean) as NonNullable<ReturnType<typeof getProductById>>[];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-5"
        >
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            // Stacks on a phone, two panes from `md` where there is width for a rail.
            className="relative flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-3xl bg-bg md:max-h-[86dvh] md:max-w-4xl md:flex-row md:overflow-hidden md:rounded-3xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close post"
              className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-divider/70 bg-bg/95 text-midnight/70 shadow-sm backdrop-blur hover:bg-surface"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Artwork */}
            <div className="flex shrink-0 flex-col justify-center bg-surface/40 md:w-[58%] md:overflow-hidden">
              <div className="relative">
                <EditorialRenderer design={current.design} />
                <PostPins pins={current.pins} />
              </div>
              {post.pages.length > 1 && (
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
            </div>

            {/* Caption, products, conversation */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-divider/50 md:border-l md:border-t-0">
              <div className="flex items-center gap-3 px-4 py-3 pr-14">
                <Avatar user={author} size="sm" className="h-9 w-9 text-xs" />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-midnight">{author.name}</p>
              </div>

              <div className="space-y-4 px-4 pb-4 md:min-h-0 md:flex-1 md:overflow-y-auto">
                {post.caption && <p className="break-words text-sm leading-relaxed text-midnight/90">{post.caption}</p>}

                {products.length > 0 && (
                  <div>
                    {/* Reads as the post's main call to action rather than a
                        section label, since shopping is the point of the post. */}
                    <button
                      type="button"
                      onClick={() => setProductsOpen((open) => !open)}
                      aria-expanded={productsOpen}
                      className="mb-2 flex w-full items-center gap-2.5 rounded-xl border border-navy/25 bg-navy/[0.06] px-3 py-2.5 text-left transition-colors hover:border-navy/40 hover:bg-navy/10"
                    >
                      <ShoppingBag className="h-4 w-4 shrink-0 text-navy" />
                      <span className="min-w-0 flex-1 text-sm font-semibold text-navy">
                        Shop this post
                      </span>
                      <span className="shrink-0 rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-white">
                        {products.length}
                      </span>
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
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
