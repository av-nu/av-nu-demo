"use client";

import { useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";

import { PostPager } from "@/components/post/PostPager";
import { Avatar } from "@/components/social/Avatar";
import { SocialPostActions } from "@/components/social/SocialPostActions";
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

      <SocialPostActions liked={liked} saved={saved} onLike={onLike} onComment={onComment} onSave={onSave} onShare={onShare} />

      <div className="space-y-1 px-3 pb-3">
        <p className="text-sm font-semibold text-midnight">{post.likes.toLocaleString()} {post.likes === 1 ? "like" : "likes"}</p>
        {post.caption && <p className="line-clamp-2 text-sm text-midnight/90">{post.caption}</p>}

        {post.productIds.length > 0 && (
          // A count rather than the products themselves: thumbnails inside a
          // masonry column fought with the artwork above them. The strip lives on
          // the opened post, where it has room.
          <button type="button" onClick={onOpen} className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-navy">
            <ShoppingBag className="h-3.5 w-3.5" />
            Shop {post.productIds.length} {post.productIds.length === 1 ? "product" : "products"}
          </button>
        )}
      </div>
    </article>
  );
}
