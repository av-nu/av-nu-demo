"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Play, Star, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { getProductById } from "@/lib/data";
import { SAMPLE_REVIEW_VIDEO } from "@/data/videoReviews";
import { useListSocial } from "@/hooks/useListSocial";
import type { SocialUser, VideoReview } from "@/lib/social";
import { Avatar } from "./Avatar";

export function VideoReviewCard({
  review,
  author,
  onDelete,
}: {
  review: VideoReview;
  author: SocialUser;
  onDelete?: (id: string) => void;
}) {
  const { isLiked, toggleLike, getLocalComments } = useListSocial();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const [src, setSrc] = useState(review.videoUrl);

  const product = getProductById(review.productId);
  const liked = isLiked(review.id);
  const likeCount = review.likes + (liked ? 1 : 0);
  const commentCount = review.comments.length + getLocalComments(review.id).length;

  const togglePlay = () => {
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
            <p className="truncate text-xs text-text/50">Video review</p>
          )}
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(review.id)}
            aria-label="Delete review"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text/40 transition-colors hover:bg-surface hover:text-pink"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative aspect-[4/5] bg-surface" onClick={togglePlay}>
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
      </div>

      <div className="flex items-center gap-4 px-3 pt-3">
        <button
          type="button"
          onClick={() => toggleLike(review.id)}
          aria-label={liked ? "Unlike" : "Like"}
          className={cn("transition-colors", liked ? "text-pink" : "text-text/60 hover:text-pink")}
        >
          <Heart className={cn("h-6 w-6", liked && "fill-pink")} />
        </button>
        <span className="flex items-center gap-1 text-text/60">
          <MessageCircle className="h-6 w-6" />
        </span>
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
    </article>
  );
}
