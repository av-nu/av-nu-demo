import { afterEach, describe, expect, it } from "vitest";

import { isDevAuthBypassEnabled } from "./useAuth";

const env = process.env as Record<string, string | undefined>;
const originalNodeEnv = env.NODE_ENV;
const originalBypass = env.NEXT_PUBLIC_DEV_AUTH_BYPASS;

afterEach(() => {
  env.NODE_ENV = originalNodeEnv;
  env.NEXT_PUBLIC_DEV_AUTH_BYPASS = originalBypass;
});

describe("development auth bypass", () => {
  it("requires the explicit flag outside production", () => {
    env.NODE_ENV = "development";
    env.NEXT_PUBLIC_DEV_AUTH_BYPASS = "true";
    expect(isDevAuthBypassEnabled()).toBe(true);
  });

  it("never enables the bypass in production", () => {
    env.NODE_ENV = "production";
    env.NEXT_PUBLIC_DEV_AUTH_BYPASS = "true";
    expect(isDevAuthBypassEnabled()).toBe(false);
  });
});
