import { describe, expect, it } from "vitest";

import {
  isDirectMediaRef,
  isExpiredMediaRef,
  isManagedMediaRef,
  makeMediaKey,
  managedMediaKey,
  toManagedMediaRef,
} from "./MediaStore";
import { createMemoryMediaStore } from "./memoryMediaStore";

describe("media refs", () => {
  it("round-trips a managed ref", () => {
    const ref = toManagedMediaRef("image-123");

    expect(ref).toBe("idb:image-123");
    expect(isManagedMediaRef(ref)).toBe(true);
    expect(managedMediaKey(ref)).toBe("image-123");
  });

  it("does not treat directly loadable sources as managed", () => {
    for (const ref of ["/videos/a.mp4", "https://cdn.test/a.jpg", "data:image/webp;base64,xx", "blob:http://x/y"]) {
      expect(isManagedMediaRef(ref)).toBe(false);
      expect(managedMediaKey(ref)).toBeUndefined();
      expect(isDirectMediaRef(ref)).toBe(true);
    }
  });

  it("recognizes blob refs as expired, since their bytes are gone after a reload", () => {
    expect(isExpiredMediaRef("blob:http://localhost/abc")).toBe(true);
    expect(isExpiredMediaRef("/videos/a.mp4")).toBe(false);
    expect(isExpiredMediaRef("idb:image-1")).toBe(false);
  });

  it("generates distinct keys tagged with their kind", () => {
    const first = makeMediaKey("image");
    const second = makeMediaKey("video");

    expect(first.startsWith("image-")).toBe(true);
    expect(second.startsWith("video-")).toBe(true);
    expect(first).not.toBe(second);
  });
});

describe("memory media store", () => {
  it("stores a blob and returns a managed ref", async () => {
    const store = createMemoryMediaStore();

    const ref = await store.put(new Blob(["x"]), "image");

    expect(isManagedMediaRef(ref)).toBe(true);
    expect(store.size()).toBe(1);
  });

  it("returns undefined for refs it does not own", async () => {
    const store = createMemoryMediaStore();

    expect(await store.resolve("/videos/a.mp4")).toBeUndefined();
    expect(await store.resolve("idb:missing")).toBeUndefined();
  });

  it("removes stored media", async () => {
    const store = createMemoryMediaStore();
    const ref = await store.put(new Blob(["x"]), "image");

    await store.remove(ref);

    expect(store.size()).toBe(0);
    expect(await store.resolve(ref)).toBeUndefined();
  });
});
