import { describe, expect, it } from "vitest";

import { feedPromptProductCounts, shouldInsertFeedPrompt } from "./feedLayout";

describe("feed prompt insertion", () => {
  it("inserts after the sixth product and every thirty products after that", () => {
    expect(feedPromptProductCounts(6)).toEqual([6]);
    expect(feedPromptProductCounts(36)).toEqual([6, 36]);
    expect(feedPromptProductCounts(66)).toEqual([6, 36, 66]);
  });

  it("does not use vertical column positions", () => {
    expect(shouldInsertFeedPrompt(5)).toBe(false);
    expect(shouldInsertFeedPrompt(7)).toBe(false);
    expect(shouldInsertFeedPrompt(35)).toBe(false);
  });
});
