"use client";

import { useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";

import { PostPager } from "@/components/post/PostPager";
import { Avatar } from "@/components/social/Avatar";
import { SocialPostActions } from "@/components/social/SocialPostActions";
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
  /** Tags crowd a feed-sized card; they are meant for the opened post. */
  showPins?: boolean;
  /** Provided only for the author's own posts. */
  onDelete?: () => void;
}) {
  const [page, setPage] = useState(post.coverPageIndex);

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

      <PostPager
        pages={post.pages}
        index={page}
        onIndex={setPage}
        onTap={onOpen}
        showPins={showPins}
        staticMedia
      />

      {post.productIds.length > 0 && (
        <div className="pt-3">
          <button type="button" onClick={onOpen} className="flex w-full items-center justify-center gap-2 bg-[#561F59] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#561F59]/90">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Shop the post</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{post.productIds.length}</span>
          </button>
        </div>
      )}

      <SocialPostActions
        compact
        liked={liked}
        saved={saved}
        likeCount={post.likes + (liked ? 1 : 0)}
        commentCount={post.comments.length}
        onLike={onLike}
        onComment={onComment}
        onSave={onSave}
        onShare={onShare}
      />

      <div className="space-y-1 px-3 pb-3">
        {post.caption && <p className="line-clamp-2 text-sm text-midnight/90">{post.caption}</p>}
      </div>
    </article>
  );
}
