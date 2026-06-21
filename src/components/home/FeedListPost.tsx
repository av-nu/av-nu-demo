"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Bookmark, ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { flattenPages, type ListComment, type ListPage } from "@/data/faves";
import { ListTileGrid } from "@/components/faves/ListTileGrid";
import { Portal } from "@/components/ui/Portal";
import { getProductById } from "@/lib/data";
import { useListSocial } from "@/hooks/useListSocial";
import { useFaveLists } from "@/hooks/useFaveLists";

export type FeedListPost = {
  id: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  name: string;
  caption?: string;
  pages: ListPage[];
  seedLikes: number;
  seedComments: ListComment[];
  href?: string;
  savePayload?: { name: string; productIds: string[] };
};

type LinkedProduct = NonNullable<ReturnType<typeof getProductById>>;

export function FeedListPost({
  post,
  onToast,
}: {
  post: FeedListPost;
  onToast?: (message: string) => void;
}) {
  const { isLiked, toggleLike, isSaved, markSaved, getLocalComments, addComment } =
    useListSocial();
  const { createListWithProducts } = useFaveLists();

  const [page, setPage] = useState(0);
  const [inlineOpen, setInlineOpen] = useState(false); // mobile inline expansion
  const [modalOpen, setModalOpen] = useState(false); // desktop pop-forward
  const [draft, setDraft] = useState("");

  const allProductIds = flattenPages(post.pages);
  if (allProductIds.length === 0) return null;

  const liked = isLiked(post.id);
  const saved = isSaved(post.id);
  const likeCount = post.seedLikes + (liked ? 1 : 0);
  const comments: ListComment[] = [...post.seedComments, ...getLocalComments(post.id)];

  const linkedProducts = allProductIds
    .map((id) => getProductById(id))
    .filter(Boolean) as LinkedProduct[];

  const pageCount = post.pages.length;
  const current = post.pages[Math.min(page, pageCount - 1)];

  // Desktop → modal, mobile → inline expand.
  const openEngagement = () => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      setModalOpen(true);
    } else {
      setInlineOpen((v) => !v);
    }
  };

  const handleSave = () => {
    if (!post.savePayload || saved) return;
    createListWithProducts(post.savePayload.name, post.savePayload.productIds, current.template);
    markSaved(post.id);
    onToast?.(`Saved "${post.name}" to your faves`);
  };

  const handleComment = () => {
    if (!draft.trim()) return;
    addComment(post.id, draft);
    setDraft("");
  };

  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#2f2f2d] shadow-sm ring-1 ring-black/5">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white", post.authorColor)}>
          {post.authorInitials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{post.authorName}</p>
          <p className="truncate text-xs text-white/55">{post.name}</p>
        </div>
        {post.href && (
          <Link href={post.href} className="flex items-center gap-1 text-xs font-medium text-white/80 transition-colors hover:text-white">
            View
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Carousel */}
      <div className="relative">
        <ListTileGrid productIds={current.productIds} template={current.template} className="rounded-none" />
        {pageCount > 1 && (
          <>
            {page > 0 && (
              <button type="button" onClick={() => setPage((p) => p - 1)} aria-label="Previous" className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-bg/80 text-text shadow backdrop-blur-sm">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {page < pageCount - 1 && (
              <button type="button" onClick={() => setPage((p) => p + 1)} aria-label="Next" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-bg/80 text-text shadow backdrop-blur-sm">
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
            <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
              {page + 1}/{pageCount}
            </span>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {post.pages.map((p, i) => (
                <span key={p.id} className={cn("h-1.5 w-1.5 rounded-full transition-colors", i === page ? "bg-white" : "bg-white/50")} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 px-3 pt-3">
        <button type="button" onClick={() => toggleLike(post.id)} aria-label={liked ? "Unlike" : "Like"} className={cn("transition-colors", liked ? "text-pink" : "text-white/70 hover:text-pink")}>
          <Heart className={cn("h-6 w-6", liked && "fill-pink")} />
        </button>
        <button type="button" onClick={openEngagement} aria-label="Comments" className="text-white/70 transition-colors hover:text-white">
          <MessageCircle className="h-6 w-6" />
        </button>
        <div className="flex-1" />
        {post.savePayload && (
          <button type="button" onClick={handleSave} aria-label={saved ? "Saved" : "Save list"} className={cn("transition-colors", saved ? "text-accent" : "text-white/70 hover:text-accent")}>
            <Bookmark className={cn("h-6 w-6", saved && "fill-accent")} />
          </button>
        )}
      </div>

      {/* Collapsed summary: likes + 1-line caption + comments trigger */}
      <div className="space-y-1 px-3 pb-3 pt-2">
        <p className="text-sm font-semibold text-white">
          {likeCount.toLocaleString()} {likeCount === 1 ? "like" : "likes"}
        </p>

        {post.caption && (
          <p className="text-sm text-white/90">
            <span className="font-semibold text-white">{post.authorName}</span>{" "}
            <span className="line-clamp-1 align-top">{post.caption}</span>
          </p>
        )}

        <button type="button" onClick={openEngagement} className="block text-sm text-white/50 transition-colors hover:text-white/75">
          {comments.length > 0
            ? `View ${post.caption ? "caption & " : ""}all ${comments.length} ${comments.length === 1 ? "comment" : "comments"}`
            : "View details & comment"}
        </button>

        {/* Mobile inline expansion */}
        {inlineOpen && (
          <div className="mt-3 rounded-2xl bg-bg p-3 md:hidden">
            <Engagement
              post={post}
              comments={comments}
              linkedProducts={linkedProducts}
              draft={draft}
              setDraft={setDraft}
              onComment={handleComment}
            />
            <button type="button" onClick={() => setInlineOpen(false)} className="mt-2 text-sm text-text/40">
              Show less
            </button>
          </div>
        )}
      </div>

      {/* Desktop pop-forward modal */}
      {modalOpen && (
        <Portal>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 z-[100] hidden items-center justify-center bg-black/50 p-4 md:flex"
            >
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
                onClick={(e) => e.stopPropagation()}
                className="grid max-h-[85vh] w-full max-w-4xl grid-cols-2 overflow-hidden rounded-3xl bg-bg shadow-xl"
              >
                {/* Media */}
                <div className="bg-surface">
                  <ListTileGrid productIds={current.productIds} template={current.template} className="rounded-none" />
                </div>
                {/* Engagement */}
                <div className="flex max-h-[85vh] flex-col">
                  <div className="flex items-center justify-between border-b border-divider/60 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white", post.authorColor)}>
                        {post.authorInitials}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-text">{post.authorName}</p>
                        <p className="text-xs text-text/50">{post.name}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setModalOpen(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 transition-colors hover:bg-surface hover:text-text">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    <Engagement
                      post={post}
                      comments={comments}
                      linkedProducts={linkedProducts}
                      draft={draft}
                      setDraft={setDraft}
                      onComment={handleComment}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </Portal>
      )}
    </article>
  );
}

function Engagement({
  post,
  comments,
  linkedProducts,
  draft,
  setDraft,
  onComment,
}: {
  post: FeedListPost;
  comments: ListComment[];
  linkedProducts: LinkedProduct[];
  draft: string;
  setDraft: (v: string) => void;
  onComment: () => void;
}) {
  return (
    <div className="space-y-3 pt-2">
      {/* Full caption */}
      {post.caption && (
        <p className="text-sm text-text">
          <span className="font-semibold">{post.authorName}</span> {post.caption}
        </p>
      )}

      {/* Auto first comment — product links */}
      <p className="text-sm leading-relaxed text-text">
        <span className="font-semibold">{post.authorName}</span>{" "}
        <span className="text-text/60">Shop this list: </span>
        {linkedProducts.map((product, i) => (
          <span key={product.id}>
            <Link href={`/product/${product.id}`} className="text-accent hover:underline">
              {product.name}
            </Link>
            {i < linkedProducts.length - 1 && <span className="text-text/40"> · </span>}
          </span>
        ))}
      </p>

      {/* Comments */}
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2">
          <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white", c.authorColor)}>
            {c.authorInitials}
          </span>
          <p className="text-sm text-text">
            <span className="font-semibold">{c.authorName}</span>{" "}
            <span className="text-text/80">{c.text}</span>
          </p>
        </div>
      ))}

      {/* Add comment */}
      <div className="flex items-center gap-2 pt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onComment()}
          placeholder="Add a comment..."
          className="h-9 flex-1 rounded-full border border-divider/60 bg-surface/50 px-4 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <button type="button" onClick={onComment} disabled={!draft.trim()} className="text-sm font-semibold text-accent disabled:opacity-40">
          Post
        </button>
      </div>
    </div>
  );
}
