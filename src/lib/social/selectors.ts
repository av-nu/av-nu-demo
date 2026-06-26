import { contacts, currentUser, getContactById } from "@/data/social";
import type { Connection, SocialState, SocialUser } from "./types";

// Pure read helpers that turn the raw SocialState + contact directory into the
// view models pages and components consume.

export function toSocialUser(userId: string, state: SocialState): SocialUser {
  if (userId === "me") {
    const p = state.profile;
    const name = p.name.trim() || "You";
    return {
      id: "me",
      name,
      handle: p.handle || currentUser.handle,
      initials: initialsFor(name),
      color: p.avatarColor,
      bio: p.bio,
      avatarUrl: p.avatarUrl,
      isCurrentUser: true,
    };
  }
  const c = getContactById(userId);
  return {
    id: userId,
    name: c?.name ?? "Member",
    handle: c?.handle ?? userId,
    initials: c?.initials ?? "AV",
    color: c?.color ?? "bg-accent",
    bio: c?.bio,
  };
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Y";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function connectionsList(state: SocialState): Connection[] {
  return Object.values(state.connections);
}

/** People in your inner circle (mutually connected). */
export function selectInnerCircle(state: SocialState): SocialUser[] {
  return connectionsList(state)
    .filter((c) => c.inner === "connected")
    .map((c) => toSocialUser(c.userId, state));
}

/** People who follow you. */
export function selectFollowers(state: SocialState): SocialUser[] {
  return connectionsList(state)
    .filter((c) => c.followsMe)
    .map((c) => toSocialUser(c.userId, state));
}

/** People you follow. */
export function selectFollowing(state: SocialState): SocialUser[] {
  return connectionsList(state)
    .filter((c) => c.iFollow)
    .map((c) => toSocialUser(c.userId, state));
}

/** Incoming inner-circle invitations awaiting your response. */
export function selectIncomingRequests(state: SocialState): SocialUser[] {
  return connectionsList(state)
    .filter((c) => c.inner === "incoming")
    .map((c) => toSocialUser(c.userId, state));
}

/** People you could follow but don't yet. */
export function selectSuggestions(state: SocialState): SocialUser[] {
  return contacts
    .filter((c) => {
      const conn = state.connections[c.id];
      return !conn || (!conn.iFollow && conn.inner === "none" && !conn.followsMe);
    })
    .map((c) => toSocialUser(c.id, state));
}

export function getConnection(state: SocialState, userId: string): Connection {
  return (
    state.connections[userId] ?? {
      userId,
      iFollow: false,
      followsMe: false,
      inner: "none",
    }
  );
}

export type ProfileCounts = {
  innerCircle: number;
  followers: number;
  following: number;
};

export function selectCounts(state: SocialState): ProfileCounts {
  return {
    innerCircle: selectInnerCircle(state).length,
    followers: selectFollowers(state).length,
    following: selectFollowing(state).length,
  };
}

export function unreadCount(state: SocialState): number {
  return state.notifications.filter((n) => !n.read).length;
}
