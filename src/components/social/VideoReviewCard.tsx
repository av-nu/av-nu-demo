"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, Heart, MessageCircle, Play, Send, Star, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { getProductById } from "@/lib/data";
import { SAMPLE_REVIEW_VIDEO } from "@/data/videoReviews";
import { useListSocial } from "@/hooks/useListSocial";
import type { SocialUser, VideoReview } from "@/lib/social";
import { Avatar } from "./Avatar";
import { SavePostDialog } from "@/components/social/SavePostDialog";
import { SharePostDialog } from "@/components/social/SharePostDialog";

export function VideoReviewCard({
  review,
  author,
  onDelete,
}: {
  review: VideoReview;
  author: SocialUser;
  onDelete?: (id: string) => void;
}) {
  const { isLiked, toggleLike, isSaved, markSaved, getLocalComments, addComment } = useListSocial();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const mediaType = review.mediaType ?? "video";
  const [src, setSrc] = useState(review.mediaUrl ?? review.videoUrl ?? "");
  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");

  const product = review.productId ? getProductById(review.productId) : undefined;
  const liked = isLiked(review.id);
  const saved = isSaved(review.id);
  const likeCount = review.likes + (liked ? 1 : 0);
  const commentCount = review.comments.length + getLocalComments(review.id).length;

  const togglePlay = () => {
    if (mediaType === "image") return;
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-divider/50 bg-bg">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar user={author} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{author.name}</p>
          {review.rating ? (
            <span className="flex items-center gap-0.5 text-xs text-text/50">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-pink text-pink" />
              ))}
            </span>
          ) : (
            <p className="truncate text-xs text-text/50">Moment</p>
          )}
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(review.id)}
            aria-label="Delete moment"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text/40 transition-colors hover:bg-surface hover:text-pink"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative aspect-[4/5] bg-surface" onClick={togglePlay}>
        {mediaType === "image" ? (
          <Image src={src} alt={`${author.name}'s moment`} fill unoptimized className="object-cover" />
        ) : (
          <>
            <video
              ref={videoRef}
              src={src}
              className="h-full w-full object-cover"
              playsInline
              loop
              muted
              onError={() => {
                if (src !== SAMPLE_REVIEW_VIDEO) setSrc(SAMPLE_REVIEW_VIDEO);
              }}
            />
            {paused && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-burgundy">
                  <Play className="ml-0.5 h-5 w-5 fill-burgundy" />
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-7 px-3 pt-4">
        <button
          type="button"
          onClick={() => toggleLike(review.id)}
          aria-label={liked ? "Unlike" : "Like"}
          className={cn("transition-colors", liked ? "text-pink" : "text-text/60 hover:text-pink")}
        >
          <Heart className={cn("h-6 w-6", liked && "fill-pink")} />
        </button>
        <button type="button" onClick={() => setShareOpen(true)} aria-label="Share moment" className="text-text/60 transition-colors hover:text-text"><Send className="h-6 w-6" /></button>
        <button type="button" onClick={() => setSaveOpen(true)} aria-label={saved ? "Saved" : "Save moment"} className={cn("ml-auto transition-colors", saved ? "text-accent" : "text-text/60 hover:text-accent")}><Bookmark className={cn("h-6 w-6", saved && "fill-current")} /></button>
        <button type="button" onClick={() => setCommentOpen((current) => !current)} aria-label="Comment on moment" className="flex items-center gap-1 text-text/60 transition-colors hover:text-text"><MessageCircle className="h-6 w-6" /></button>
      </div>

      <div className="space-y-1 px-3 pb-3 pt-2">
        <p className="text-sm font-semibold text-text">
          {likeCount.toLocaleString()} {likeCount === 1 ? "like" : "likes"}
        </p>
        {review.caption && (
          <p className="text-sm text-text/90">
            <span className="font-semibold">{author.name}</span>{" "}
            <span className="line-clamp-2 align-top">{review.caption}</span>
          </p>
        )}
        {commentCount > 0 && (
          <p className="text-sm text-text/50">
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </p>
        )}
        {commentOpen && <form onSubmit={(event) => { event.preventDefault(); if (!commentDraft.trim()) return; addComment(review.id, commentDraft.trim()); setCommentDraft(""); }} className="mt-2 flex gap-2"><input autoFocus value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Add a comment…" className="h-9 min-w-0 flex-1 rounded-full border border-divider bg-surface/50 px-3 text-xs focus:border-accent/50 focus:outline-none" /><button type="submit" disabled={!commentDraft.trim()} className="rounded-full bg-text px-3 text-xs font-semibold text-bg disabled:opacity-40">Post</button></form>}
        {product && (
          <Link
            href={`/product/${product.id}`}
            className="mt-2 flex items-center gap-2 rounded-xl border border-divider/50 p-2 transition-colors hover:border-accent/40"
          >
            <span className="relative h-10 w-10 overflow-hidden rounded-lg bg-surface">
              <Image src={product.images[0]} alt={product.name} fill sizes="40px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-text">{product.name}</span>
              <span className="block text-xs text-text/50">Shop the product</span>
            </span>
          </Link>
        )}
      </div>
      {saveOpen && <SavePostDialog postId={review.id} onClose={() => setSaveOpen(false)} onSaved={() => markSaved(review.id)} />}
      {shareOpen && <SharePostDialog postTitle={product?.name ?? "Moment"} onClose={() => setShareOpen(false)} />}
    </article>
  );
}
