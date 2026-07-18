"use client";

import { useMemo } from "react";
import { LayoutGrid } from "lucide-react";

import { FeedListPost, type FeedListPost as FeedListPostType } from "@/components/home/FeedListPost";
import { VideoReviewCard } from "@/components/social/VideoReviewCard";
import { communityLists, flattenPages } from "@/data/faves";
import type { SocialUser, VideoReview } from "@/lib/social";
import { useFaveLists } from "@/hooks/useFaveLists";
import { useVideoReviews } from "@/hooks/useVideoReviews";

export type ProfilePostFilter = "all" | "moment" | "guide" | "list";

type Item =
  | { kind: "list" | "guide"; createdAt: number; post: FeedListPostType }
  | { kind: "review"; createdAt: number; review: VideoReview };

/**
 * Instagram-style grid of a user's shared content: video reviews and lists.
 * For the current user it reflects their own lists + reviews; for others it
 * surfaces the seeded community content authored by them.
 */
export function ProfilePostGrid({
  user,
  onToast,
  filter = "all",
}: {
  user: SocialUser;
  onToast?: (m: string) => void;
  filter?: ProfilePostFilter;
}) {
  const isMe = Boolean(user.isCurrentUser);
  const { lists } = useFaveLists();
  const { myReviews, reviewsByAuthor, deleteVideoReview } = useVideoReviews();

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];

    if (isMe) {
      lists
        .filter((l) => l.visibility !== "private" && flattenPages(l.pages ?? []).length > 0)
        .forEach((l) =>
          out.push({
            kind: l.lookbookId ? "guide" : "list",
            createdAt: l.createdAt,
            post: {
              id: l.id,
              authorName: user.name,
              authorInitials: user.initials,
              authorColor: user.color,
              name: l.name,
              caption: l.caption,
              pages: l.pages ?? [],
              seedLikes: 0,
              seedComments: [],
              href: `/favorites/${l.id}`,
            },
          }),
        );
      myReviews.forEach((review) =>
        out.push({ kind: "review", createdAt: review.createdAt, review }),
      );
    } else {
      communityLists
        .filter((c) => c.authorId === user.id)
        .forEach((c) =>
          out.push({
            kind: "list",
            createdAt: Date.now(),
            post: {
              id: c.id,
              authorId: user.id,
              authorName: user.name,
              authorInitials: user.initials,
              authorColor: user.color,
              name: c.name,
              caption: c.caption,
              pages: c.pages,
              seedLikes: c.likes,
              seedComments: c.comments,
              savePayload: { name: c.name, productIds: flattenPages(c.pages) },
            },
          }),
        );
      reviewsByAuthor(user.id).forEach((review) =>
        out.push({ kind: "review", createdAt: review.createdAt, review }),
      );
    }

    return out.sort((a, b) => b.createdAt - a.createdAt);
  }, [isMe, lists, myReviews, reviewsByAuthor, user]);

  const filteredItems = filter === "all" ? items : items.filter((item) => filter === "moment" ? item.kind === "review" : item.kind === filter);

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-divider/60 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface">
          <LayoutGrid className="h-6 w-6 text-text/30" />
        </span>
        <p className="text-sm text-text/50">
          {isMe ? "No posts in this view yet — create a Moment, Guide, or List to get started." : "No posts to show."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {filteredItems.map((item) =>
        item.kind === "review" ? (
          <VideoReviewCard
            key={`r-${item.review.id}`}
            review={item.review}
            author={user}
            onDelete={
              isMe
                ? (id) => {
                    deleteVideoReview(id);
                    onToast?.("Video review deleted");
                  }
                : undefined
            }
          />
        ) : (
          <div key={`l-${item.post.id}`} className="flex">
            <FeedListPost post={item.post} onToast={onToast} />
          </div>
        ),
      )}
    </div>
  );
}
