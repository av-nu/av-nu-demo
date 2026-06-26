"use client";

import { useCallback, useMemo } from "react";

import {
  getConnection,
  selectCounts,
  selectFollowers,
  selectFollowing,
  selectIncomingRequests,
  selectInnerCircle,
  selectSuggestions,
  socialService,
  toSocialUser,
} from "@/lib/social";
import { useSocialStore } from "./useSocialStore";

/**
 * Relationship graph: follow / inner-circle invitations, accept / decline, and
 * removals. All mutations route through the SocialService so the demo logic
 * stays swappable for a real backend.
 */
export function useSocialGraph() {
  const { state, isHydrated } = useSocialStore();

  const innerCircle = useMemo(() => selectInnerCircle(state), [state]);
  const followers = useMemo(() => selectFollowers(state), [state]);
  const following = useMemo(() => selectFollowing(state), [state]);
  const incomingRequests = useMemo(() => selectIncomingRequests(state), [state]);
  const suggestions = useMemo(() => selectSuggestions(state), [state]);
  const counts = useMemo(() => selectCounts(state), [state]);

  const getRelationship = useCallback(
    (userId: string) => getConnection(state, userId),
    [state],
  );

  const getUser = useCallback(
    (userId: string) => toSocialUser(userId, state),
    [state],
  );

  const follow = useCallback((userId: string) => socialService.follow(userId), []);
  const unfollow = useCallback((userId: string) => socialService.unfollow(userId), []);
  const requestInnerCircle = useCallback(
    (userId: string) => socialService.requestInnerCircle(userId),
    [],
  );
  const cancelInnerRequest = useCallback(
    (userId: string) => socialService.cancelInnerRequest(userId),
    [],
  );
  const acceptRequest = useCallback(
    (userId: string) => socialService.acceptRequest(userId),
    [],
  );
  const declineRequest = useCallback(
    (userId: string) => socialService.declineRequest(userId),
    [],
  );
  const removeFollower = useCallback(
    (userId: string) => socialService.removeFollower(userId),
    [],
  );
  const removeConnection = useCallback(
    (userId: string) => socialService.removeConnection(userId),
    [],
  );

  return {
    isHydrated,
    innerCircle,
    followers,
    following,
    incomingRequests,
    suggestions,
    counts,
    getRelationship,
    getUser,
    follow,
    unfollow,
    requestInnerCircle,
    cancelInnerRequest,
    acceptRequest,
    declineRequest,
    removeFollower,
    removeConnection,
  };
}
