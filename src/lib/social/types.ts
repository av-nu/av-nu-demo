// Shared types for the social layer. These describe the serializable shape the
// SocialService persists. The mock implementation stores this in localStorage;
// a real backend would expose the same shapes over an API.

import type { FaveVisibility, ListComment } from "@/data/faves";

/** Inner-circle relationship state between the current user and another user. */
export type InnerState = "none" | "outgoing" | "incoming" | "connected";

/** A connection record, always stored from the *current user's* perspective. */
export type Connection = {
  userId: string;
  /** The current user follows this person (public follow). */
  iFollow: boolean;
  /** This person follows the current user. */
  followsMe: boolean;
  /** Inner-circle invitation/connection state. */
  inner: InnerState;
  /** When the inner-circle connection was established. */
  innerSince?: number;
};

export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "inner-request"
  | "inner-accepted";

export type Notification = {
  id: string;
  type: NotificationType;
  /** The user who triggered the notification. */
  actorId: string;
  /** Comment text (for "comment") or a short message. */
  text?: string;
  /** The post / list / video review the action targeted. */
  targetId?: string;
  targetLabel?: string;
  createdAt: number;
  read: boolean;
};

/** A user-authored video review tied to a product. */
export type VideoReview = {
  id: string;
  authorId: string;
  productId: string;
  /** Object URL (ephemeral) or a hosted/sample clip. */
  videoUrl: string;
  caption: string;
  rating?: number;
  visibility: FaveVisibility;
  likes: number;
  comments: ListComment[];
  createdAt: number;
};

export type NewVideoReview = {
  productId: string;
  videoUrl: string;
  caption: string;
  rating?: number;
  visibility: FaveVisibility;
};

/** The current user's editable profile. */
export type MyProfile = {
  name: string;
  handle: string;
  bio: string;
  /** Tailwind background class for the fallback avatar chip. */
  avatarColor: string;
  /** Uploaded avatar (object URL, ephemeral in the demo). */
  avatarUrl?: string;
  /** Who can see the profile page. */
  visibility: "public" | "inner-circle";
};

/** The full persisted social state. */
export type SocialState = {
  profile: MyProfile;
  /** Keyed by userId. */
  connections: Record<string, Connection>;
  notifications: Notification[];
  /** The current user's authored video reviews. */
  videoReviews: VideoReview[];
};

/** A read model for any user's public-facing profile (current user or other). */
export type SocialUser = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  /** Tailwind background class for the avatar chip. */
  color: string;
  bio?: string;
  avatarUrl?: string;
  /** True when this is the signed-in user. */
  isCurrentUser?: boolean;
};
