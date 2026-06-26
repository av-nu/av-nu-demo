import { beforeEach, describe, expect, it, vi } from "vitest";

// The mock service is browser-oriented (localStorage + window events). Provide
// lightweight stubs so we can exercise the relationship state machine in the
// node test environment.
const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
});

const localStorageStub = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

const windowStub = {
  localStorage: localStorageStub,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  setTimeout: (fn: () => void, ms?: number) => setTimeout(fn, ms),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).window = windowStub;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).localStorage = localStorageStub;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).CustomEvent = class {
  type: string;
  detail: unknown;
  constructor(type: string, init?: { detail?: unknown }) {
    this.type = type;
    this.detail = init?.detail;
  }
};

async function freshService() {
  vi.resetModules();
  store.clear();
  const mod = await import("./mockService");
  return mod.mockSocialService;
}

describe("MockSocialService relationship transitions", () => {
  it("seeds inner circle and followers from the contact directory", async () => {
    const svc = await freshService();
    const state = svc.getSnapshot();
    expect(state.connections["c-mara"].inner).toBe("connected");
    expect(state.connections["f-aria"].followsMe).toBe(true);
    expect(state.connections["f-aria"].inner).toBe("none");
  });

  it("follows and unfollows a suggested user", async () => {
    const svc = await freshService();
    await svc.follow("s-nina");
    expect(svc.getSnapshot().connections["s-nina"].iFollow).toBe(true);
    await svc.unfollow("s-nina");
    expect(svc.getSnapshot().connections["s-nina"].iFollow).toBe(false);
  });

  it("sends an outgoing inner-circle request", async () => {
    const svc = await freshService();
    await svc.requestInnerCircle("s-rafa");
    const conn = svc.getSnapshot().connections["s-rafa"];
    expect(conn.inner).toBe("outgoing");
    expect(conn.iFollow).toBe(true);
  });

  it("accepts an incoming invitation into the inner circle", async () => {
    const svc = await freshService();
    expect(svc.getSnapshot().connections["f-noor"].inner).toBe("incoming");
    await svc.acceptRequest("f-noor");
    const conn = svc.getSnapshot().connections["f-noor"];
    expect(conn.inner).toBe("connected");
    expect(conn.followsMe).toBe(true);
  });

  it("declines an incoming invitation", async () => {
    const svc = await freshService();
    await svc.declineRequest("f-quin");
    expect(svc.getSnapshot().connections["f-quin"].inner).toBe("none");
  });

  it("removes a follower", async () => {
    const svc = await freshService();
    await svc.removeFollower("f-aria");
    expect(svc.getSnapshot().connections["f-aria"].followsMe).toBe(false);
  });

  it("removes an inner-circle connection but keeps the follow", async () => {
    const svc = await freshService();
    await svc.removeConnection("c-mara");
    const conn = svc.getSnapshot().connections["c-mara"];
    expect(conn.inner).toBe("none");
    expect(conn.iFollow).toBe(true);
  });

  it("adds and deletes a video review", async () => {
    const svc = await freshService();
    const id = await svc.addVideoReview({
      productId: "p-1",
      videoUrl: "blob:test",
      caption: "great",
      visibility: "public",
    });
    expect(svc.getSnapshot().videoReviews).toHaveLength(1);
    await svc.deleteVideoReview(id);
    expect(svc.getSnapshot().videoReviews).toHaveLength(0);
  });

  it("marks notifications read", async () => {
    const svc = await freshService();
    const first = svc.getSnapshot().notifications[0];
    await svc.markRead(first.id);
    const updated = svc.getSnapshot().notifications.find((n) => n.id === first.id);
    expect(updated?.read).toBe(true);
    await svc.markAllRead();
    expect(svc.getSnapshot().notifications.every((n) => n.read)).toBe(true);
  });
});
