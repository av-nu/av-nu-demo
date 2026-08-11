"use client";

import { useMemo } from "react";

import { communityLists } from "@/data/faves";
import { seedPosts } from "@/data/posts";
import { buildSpotlightRows } from "@/data/spotlight";
import { contacts } from "@/data/social";
import { communityListToPost, spotlightRowToPost, videoReviewToPost } from "@/lib/postMigration";
import type { Post } from "@/lib/post";
import { useSocialStore } from "./useSocialStore";
import { useVideoReviews } from "./useVideoReviews";

/**
 * Every post the feed can show, as one shape.
 *
 * Legacy seeds are converted rather than rendered by their old components, so
 * the feed has a single rendering path. Newest first.
 */
export function useFeedPosts(): Post[] {
  const { state } = useSocialStore();
  const { publishedMoments } = useVideoReviews();

  const legacy = useMemo(() => {
    const videos = buildSpotlightRows(8).map((row, index) => spotlightRowToPost(row, contacts[index % contacts.length]?.id ?? "c-mara"));
    const lists = communityLists.map((list, index) => communityListToPost(list, Date.now() - index * 5_400_000));
    return [...videos, ...lists];
  }, []);

  const moments = useMemo(() => publishedMoments.map(videoReviewToPost), [publishedMoments]);

  // The author's own posts take precedence over a seed sharing an id.
  const authored = state.posts ?? [];

  return useMemo(() => {
    const byId = new Map<string, Post>();
    for (const post of [...seedPosts, ...legacy, ...moments, ...authored]) byId.set(post.id, post);
    return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
  }, [authored, legacy, moments]);
}
