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

const LEGACY_EPOCH = 1_735_600_000_000;

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
    // A fixed epoch, not Date.now(): computing timestamps during render gives the
    // server and the client different values, which reorders the feed and trips
    // a hydration mismatch.
    const lists = communityLists.map((list, index) => communityListToPost(list, LEGACY_EPOCH - index * 5_400_000));
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
