import { describe, expect, it } from "vitest";

import { demoStorageKeys } from "./demoReset";

describe("demo reset", () => {
  it("covers every namespaced key the demo writes", () => {
    const keys = demoStorageKeys();

    // A reset that misses a key leaves the demo in a half-seeded state, which is
    // harder to reason about than either extreme.
    for (const expected of [
      "avnu-social-state",
      "avnu-saved-looks",
      "avnu-fave-lists",
      "avnu-favorites",
      "avnu-saved-post-groups",
      "avnu-saved-colors",
      "avnu-cart",
      "avnu-oms-orders",
    ]) {
      expect(keys).toContain(expected);
    }
  });

  it("lists each key once, and only namespaced keys", () => {
    const keys = demoStorageKeys();

    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key.startsWith("avnu-")).toBe(true);
  });
});
