import type {
  MyProfile,
  NewVideoReview,
  SocialState,
  VideoReview,
} from "./types";

// The contract every social backend must satisfy. The demo ships a
// localStorage-backed mock (see mockService.ts); swapping to a real backend
// means providing another implementation of this interface and exporting it
// from ./index.ts — no hook or component changes required.
export interface SocialService {
  // --- reactive store plumbing (for useSyncExternalStore) ------------------
  getSnapshot(): SocialState;
  getServerSnapshot(): SocialState;
  subscribe(listener: () => void): () => void;

  // --- profile -------------------------------------------------------------
  updateProfile(patch: Partial<MyProfile>): Promise<void>;

  // --- relationships -------------------------------------------------------
  follow(userId: string): Promise<void>;
  unfollow(userId: string): Promise<void>;
  requestInnerCircle(userId: string): Promise<void>;
  cancelInnerRequest(userId: string): Promise<void>;
  /** Accept an incoming inner-circle invitation. */
  acceptRequest(userId: string): Promise<void>;
  /** Decline an incoming inner-circle invitation. */
  declineRequest(userId: string): Promise<void>;
  /** Remove someone who follows you. */
  removeFollower(userId: string): Promise<void>;
  /** Remove an inner-circle connection. */
  removeConnection(userId: string): Promise<void>;

  // --- notifications -------------------------------------------------------
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;

  // --- video reviews -------------------------------------------------------
  addVideoReview(input: NewVideoReview): Promise<string>;
  updateVideoReview(id: string, patch: Partial<VideoReview>): Promise<void>;
  deleteVideoReview(id: string): Promise<void>;

  // --- demo helpers --------------------------------------------------------
  /**
   * Simulate other members liking/commenting on one of your posts over the next
   * few seconds, generating notifications. No-op for a real backend.
   */
  simulateEngagement(target: { id: string; label: string }): void;
}
