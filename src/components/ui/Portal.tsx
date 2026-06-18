"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children into document.body so overlays (modals/sheets) escape any
 * transformed ancestor. A `position: fixed` element inside a CSS transform is
 * positioned relative to that ancestor, not the viewport — which causes
 * jumping/flashing when parents animate. Portaling avoids that entirely.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
