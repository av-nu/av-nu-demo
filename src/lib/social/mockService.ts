import { contacts } from "@/data/social";
import type { ListComment } from "@/data/faves";
import { normalizePost, type NewPost, type Post } from "@/lib/post";
import type { SocialService } from "./SocialService";
import { buildSeedState } from "./seed";
import {
  POSTS_VERSION,
  type Connection,
  type MyProfile,
  type NewVideoReview,
  type Notification,
  type SocialState,
  type VideoReview,
} from "./types";

const STORAGE_KEY = "avnu-social-state";
const SYNC_EVENT = "avnu-storage-sync"; // shared with useLocalStorage

function randomId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function defaultConnection(userId: string): Connection {
  return { userId, iFollow: false, followsMe: false, inner: "none" };
}

/** Thrown when the browser refuses to persist because storage is full. */
export class MediaQuotaError extends Error {
  constructor() {
    super("This device is out of storage for the demo. Remove a post and try again.");
    this.name = "MediaQuotaError";
  }
}

function isQuotaExceeded(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name;
  return name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED";
}

/**
 * localStorage-backed implementation of {@link SocialService}. All business
 * logic for the demo's social graph lives here; a real backend would replace
 * this module wholesale.
 */
class MockSocialService implements SocialService {
  private serverSnapshot: SocialState = buildSeedState();
  private cacheRaw: string | null = null;
  private cacheParsed: SocialState = this.serverSnapshot;
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY) this.emit();
      });
      window.addEventListener(SYNC_EVENT, (e) => {
        const detail = (e as CustomEvent<{ key: string }>).detail;
        if (detail?.key === STORAGE_KEY) this.emit();
      });
    }
  }

  // --- store plumbing -------------------------------------------------------

  getServerSnapshot(): SocialState {
    return this.serverSnapshot;
  }

  getSnapshot(): SocialState {
    if (typeof window === "undefined") return this.serverSnapshot;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return this.cacheParsed;
    }
    if (raw === this.cacheRaw) return this.cacheParsed;
    this.cacheRaw = raw;
    this.cacheParsed = raw === null ? buildSeedState() : this.merge(raw);
    return this.cacheParsed;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  /** Merge persisted JSON with the seed so new fields get sane defaults. */
  private merge(raw: string): SocialState {
    try {
      const seed = buildSeedState();
      const parsed = JSON.parse(raw) as Partial<SocialState>;
      return {
        profile: { ...seed.profile, ...(parsed.profile ?? {}) },
        connections: { ...seed.connections, ...(parsed.connections ?? {}) },
        followedBrands: parsed.followedBrands ?? seed.followedBrands,
        notifications: parsed.notifications ?? seed.notifications,
        videoReviews: parsed.videoReviews ?? seed.videoReviews,
        // Re-normalize persisted posts so invariants hold even if the shape was
        // written by an older build.
        posts: (parsed.posts ?? seed.posts).map(normalizePost),
        postsVersion: parsed.postsVersion ?? POSTS_VERSION,
      };
    } catch {
      return buildSeedState();
    }
  }

  private read(): SocialState {
    return this.getSnapshot();
  }

  /**
   * Persists state. Quota failures are surfaced rather than swallowed: losing a
   * post the user just built is worse than an explicit error, and the composer
   * needs to be able to tell them.
   */
  private write(next: SocialState) {
    if (typeof window === "undefined") return;
    try {
      const raw = JSON.stringify(next);
      window.localStorage.setItem(STORAGE_KEY, raw);
      this.cacheRaw = raw;
      this.cacheParsed = next;
    } catch (error) {
      if (isQuotaExceeded(error)) {
        throw new MediaQuotaError();
      }
      throw error;
    }
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key: STORAGE_KEY } }));
    this.emit();
  }

  private patchConnection(userId: string, patch: Partial<Connection>) {
    const state = this.read();
    const current = state.connections[userId] ?? defaultConnection(userId);
    this.write({
      ...state,
      connections: {
        ...state.connections,
        [userId]: { ...current, ...patch },
      },
    });
  }

  private pushNotification(n: Omit<Notification, "id" | "createdAt" | "read">) {
    const state = this.read();
    const notification: Notification = {
      ...n,
      id: randomId("n"),
      createdAt: Date.now(),
      read: false,
    };
    this.write({ ...state, notifications: [notification, ...state.notifications] });
  }

  // --- profile --------------------------------------------------------------

  async updateProfile(patch: Partial<MyProfile>): Promise<void> {
    const state = this.read();
    this.write({ ...state, profile: { ...state.profile, ...patch } });
  }

  // --- relationships --------------------------------------------------------

  async follow(userId: string): Promise<void> {
    this.patchConnection(userId, { iFollow: true });
  }

  async unfollow(userId: string): Promise<void> {
    this.patchConnection(userId, { iFollow: false });
  }

  async followBrand(brandId: string): Promise<void> {
    const state = this.read();
    if (state.followedBrands.includes(brandId)) return;
    this.write({ ...state, followedBrands: [...state.followedBrands, brandId] });
  }

  async unfollowBrand(brandId: string): Promise<void> {
    const state = this.read();
    this.write({ ...state, followedBrands: state.followedBrands.filter((id) => id !== brandId) });
  }

  async requestInnerCircle(userId: string): Promise<void> {
    this.patchConnection(userId, { iFollow: true, inner: "outgoing" });
    // Simulate the other person accepting after a short delay.
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        const state = this.read();
        const conn = state.connections[userId];
        if (!conn || conn.inner !== "outgoing") return;
        this.patchConnection(userId, {
          inner: "connected",
          followsMe: true,
          innerSince: Date.now(),
        });
        this.pushNotification({
          type: "inner-accepted",
          actorId: userId,
          text: "accepted your inner-circle invitation",
        });
      }, 2600);
    }
  }

  async cancelInnerRequest(userId: string): Promise<void> {
    this.patchConnection(userId, { inner: "none" });
  }

  async acceptRequest(userId: string): Promise<void> {
    this.patchConnection(userId, {
      inner: "connected",
      followsMe: true,
      innerSince: Date.now(),
    });
  }

  async declineRequest(userId: string): Promise<void> {
    this.patchConnection(userId, { inner: "none" });
  }

  async removeFollower(userId: string): Promise<void> {
    this.patchConnection(userId, { followsMe: false, inner: "none" });
  }

  async removeConnection(userId: string): Promise<void> {
    // Drop the inner-circle connection but keep any public follow intact.
    this.patchConnection(userId, { inner: "none", innerSince: undefined });
  }

  // --- notifications --------------------------------------------------------

  async markRead(id: string): Promise<void> {
    const state = this.read();
    this.write({
      ...state,
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    });
  }

  async markAllRead(): Promise<void> {
    const state = this.read();
    this.write({
      ...state,
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    });
  }

  // --- video reviews --------------------------------------------------------

  async addVideoReview(input: NewVideoReview): Promise<string> {
    const state = this.read();
    const review: VideoReview = {
      id: randomId("vr"),
      authorId: "me",
      productId: input.productId,
      videoUrl: input.videoUrl,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      caption: input.caption,
      rating: input.rating,
      visibility: input.visibility,
      likes: 0,
      comments: [],
      createdAt: Date.now(),
    };
    this.write({ ...state, videoReviews: [review, ...state.videoReviews] });
    return review.id;
  }

  async updateVideoReview(id: string, patch: Partial<VideoReview>): Promise<void> {
    const state = this.read();
    this.write({
      ...state,
      videoReviews: state.videoReviews.map((v) =>
        v.id === id ? { ...v, ...patch } : v,
      ),
    });
  }

  async deleteVideoReview(id: string): Promise<void> {
    const state = this.read();
    this.write({
      ...state,
      videoReviews: state.videoReviews.filter((v) => v.id !== id),
    });
  }

  // --- posts ----------------------------------------------------------------

  async addPost(input: NewPost): Promise<string> {
    const state = this.read();
    const post = normalizePost({
      id: randomId("post"),
      authorId: "me",
      pages: input.pages,
      format: input.format,
      coverPageIndex: input.coverPageIndex ?? 0,
      productIds: [],
      caption: input.caption,
      visibility: input.visibility,
      likes: 0,
      comments: [],
      createdAt: Date.now(),
    });
    this.write({ ...state, posts: [post, ...state.posts] });
    return post.id;
  }

  async updatePost(id: string, patch: Partial<Post>): Promise<void> {
    const state = this.read();
    this.write({
      ...state,
      posts: state.posts.map((post) => (post.id === id ? normalizePost({ ...post, ...patch }) : post)),
    });
  }

  async deletePost(id: string): Promise<void> {
    const state = this.read();
    this.write({ ...state, posts: state.posts.filter((post) => post.id !== id) });
  }

  // --- demo helpers ---------------------------------------------------------

  simulateEngagement(target: { id: string; label: string }): void {
    if (typeof window === "undefined") return;
    // Pick a few inner-circle / followers to react over the next few seconds.
    const state = this.read();
    const candidates = contacts.filter((c) => {
      const conn = state.connections[c.id];
      return conn && (conn.inner === "connected" || conn.followsMe);
    });
    if (candidates.length === 0) return;

    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const sampleComments = [
      "Love this 😍",
      "Need it!",
      "Where is this from?",
      "Adding to my cart now",
      "Such a good find",
    ];

    const likers = shuffled.slice(0, Math.min(3, shuffled.length));
    likers.forEach((actor, i) => {
      window.setTimeout(() => {
        this.pushNotification({
          type: "like",
          actorId: actor.id,
          targetId: target.id,
          targetLabel: target.label,
          text: "liked your post",
        });
      }, 1500 + i * 1800);
    });

    const commenter = shuffled[shuffled.length - 1];
    if (commenter) {
      window.setTimeout(() => {
        const text = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        this.pushNotification({
          type: "comment",
          actorId: commenter.id,
          targetId: target.id,
          targetLabel: target.label,
          text,
        });
      }, 4200);
    }
  }
}

export const mockSocialService = new MockSocialService();

/** Re-exported for tests. */
export const _internal = { STORAGE_KEY };
export type { ListComment };
