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
  const { state, isHydrated } = useSocialStore();
  const { publishedMoments } = useVideoReviews();

  const legacy = useMemo(() => {
    // The timestamp must be passed, not defaulted: the migrator falls back to
    // Date.now(), which differs between the server and the client, reorders the
    // feed, and lands a different author in the same slot.
    const videos = buildSpotlightRows(8).map((row, index) => spotlightRowToPost(
      row,
      contacts[index % contacts.length]?.id ?? "c-mara",
      LEGACY_EPOCH - (index + 1) * 3_600_000,
    ));
    // A fixed epoch, not Date.now(): computing timestamps during render gives the
    // server and the client different values, which reorders the feed and trips
    // a hydration mismatch.
    const lists = communityLists.map((list, index) => communityListToPost(list, LEGACY_EPOCH - index * 5_400_000));
    return [...videos, ...lists];
  }, []);

  // Anything read from local storage is withheld until after hydration. The
  // server renders the seed state, so including stored posts in the first paint
  // makes the markup disagree with the server's and React reports a mismatch.
  const moments = useMemo(
    () => (isHydrated ? publishedMoments.map(videoReviewToPost) : []),
    [isHydrated, publishedMoments],
  );

  // The author's own posts take precedence over a seed sharing an id.
  const authored = isHydrated ? state.posts ?? [] : [];

  return useMemo(() => {
    const byId = new Map<string, Post>();
    for (const post of [...seedPosts, ...legacy, ...moments, ...authored]) byId.set(post.id, post);
    return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
  }, [authored, legacy, moments]);
}
