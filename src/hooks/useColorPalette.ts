"use client";

import { useCallback } from "react";

import { useLocalStorage } from "./useLocalStorage";

const PALETTE_KEY = "avnu-saved-colors";
const RECENT_KEY = "avnu-recent-colors";
const RECENT_LIMIT = 12;
const PALETTE_LIMIT = 24;

/** Normalizes to lowercase hex so the same colour is not saved twice. */
function normalizeColor(color: string): string | undefined {
  const value = color.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  if (/^#[0-9a-f]{3}$/.test(value)) {
    // Expand shorthand so comparisons are consistent.
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return undefined;
}

/**
 * Colours the author has saved for reuse across the composer's tools. Shared by
 * text, highlight, and drawing so a palette built once is available everywhere.
 */
export function useColorPalette() {
  const [colors, setColors, isHydrated] = useLocalStorage<string[]>(PALETTE_KEY, []);
  const [recent, setRecent] = useLocalStorage<string[]>(RECENT_KEY, []);

  const saveColor = useCallback((color: string) => {
    const value = normalizeColor(color);
    if (!value) return;
    setColors((current) => {
      if (current.includes(value)) return current;
      // Most recent first, oldest dropped once the palette is full.
      return [value, ...current].slice(0, PALETTE_LIMIT);
    });
  }, [setColors]);

  const removeColor = useCallback((color: string) => {
    const value = normalizeColor(color) ?? color;
    setColors((current) => current.filter((item) => item !== value));
  }, [setColors]);

  const hasColor = useCallback((color: string) => {
    const value = normalizeColor(color);
    return value ? colors.includes(value) : false;
  }, [colors]);

  /** Records a colour as used, so authors can reach back for it without saving. */
  const recordRecent = useCallback((color: string) => {
    const value = normalizeColor(color);
    if (!value) return;
    setRecent((current) => [value, ...current.filter((item) => item !== value)].slice(0, RECENT_LIMIT));
  }, [setRecent]);

  return { colors, recent, isHydrated, saveColor, removeColor, hasColor, recordRecent };
}

export { normalizeColor, PALETTE_LIMIT, RECENT_LIMIT };
