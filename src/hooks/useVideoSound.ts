"use client";

import { useCallback } from "react";

import { useLocalStorage } from "./useLocalStorage";

const SOUND_KEY = "avnu-video-muted";

/**
 * Whether video plays with sound, shared across every clip.
 *
 * Muted to begin with, because autoplaying audio is hostile, but the choice
 * carries: someone who unmutes one clip means it for the next one too, and having
 * to unmute every video individually is the actual annoyance.
 */
export function useVideoSound() {
  const [muted, setMuted, isHydrated] = useLocalStorage<boolean>(SOUND_KEY, true);

  const toggleMuted = useCallback(() => setMuted((current) => !current), [setMuted]);

  return { muted, setMuted, toggleMuted, isHydrated };
}
