import { describe, expect, it } from "vitest";

import {
  MISSING_MEDIA_REF,
  isDirectMediaRef,
  isExpiredMediaRef,
  isManagedMediaRef,
  isMissingMediaRef,
  makeMediaKey,
  managedMediaKey,
  toManagedMediaRef,
} from "./MediaStore";
import { createMemoryMediaStore } from "./memoryMediaStore";
import { isUnoptimizableSrc } from "./useMediaSrc";

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

describe("missing media", () => {
  it("treats the missing marker and empty refs as unavailable", () => {
    expect(isMissingMediaRef(MISSING_MEDIA_REF)).toBe(true);
    expect(isMissingMediaRef(undefined)).toBe(true);
    expect(isMissingMediaRef("idb:image-1")).toBe(false);
    expect(isMissingMediaRef("/videos/a.mp4")).toBe(false);
  });
});

describe("render-time src classification", () => {
  // A managed ref must never reach next/image — doing so throws
  // "Invalid src prop ... hostname is not configured".
  it("flags object and data URLs as unoptimizable", () => {
    expect(isUnoptimizableSrc("blob:http://localhost/abc")).toBe(true);
    expect(isUnoptimizableSrc("data:image/webp;base64,xx")).toBe(true);
  });

  it("leaves hosted and app-relative URLs optimizable", () => {
    expect(isUnoptimizableSrc("https://cdn.test/a.jpg")).toBe(false);
    expect(isUnoptimizableSrc("/products/a.jpg")).toBe(false);
  });

  it("never classifies a managed ref as directly loadable", () => {
    const ref = toManagedMediaRef(makeMediaKey("image"));
    expect(isDirectMediaRef(ref)).toBe(false);
    expect(isManagedMediaRef(ref)).toBe(true);
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
