"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { socialService } from "@/lib/social";
import type { SocialState } from "@/lib/social";

/**
 * Reactive subscription to the social store. Returns the current state plus an
 * `isHydrated` flag (false during SSR / first paint) so callers can render
 * skeletons, matching the pattern used by useLocalStorage.
 */
export function useSocialStore(): { state: SocialState; isHydrated: boolean } {
  const state = useSyncExternalStore(
    socialService.subscribe.bind(socialService),
    socialService.getSnapshot.bind(socialService),
    socialService.getServerSnapshot.bind(socialService),
  );

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => setIsHydrated(true), []);

  return { state, isHydrated };
}
