"use client";

import { useEffect, useState } from "react";

import { isExpiredMediaRef, isManagedMediaRef, isMissingMediaRef } from "./MediaStore";
import { mediaStore } from "./store";

export type MediaSrcStatus = "ready" | "loading" | "missing";

/**
 * Resolves a design's media ref into something the DOM can load.
 *
 * Designs persist an opaque ref (see MediaStore) rather than raw bytes, so every
 * renderer has to resolve it. Direct refs (hosted URLs, app paths, data URLs)
 * pass straight through; managed refs are read from the media store and their
 * object URL is revoked on unmount.
 */
export function useMediaSrc(ref: string | undefined): { src?: string; status: MediaSrcStatus } {
  const passthrough = ref && !isManagedMediaRef(ref) && !isMissingMediaRef(ref) && !isExpiredMediaRef(ref) ? ref : undefined;
  const [src, setSrc] = useState<string | undefined>(passthrough);
  const [status, setStatus] = useState<MediaSrcStatus>(() => {
    if (!ref || isMissingMediaRef(ref) || isExpiredMediaRef(ref)) return "missing";
    return isManagedMediaRef(ref) ? "loading" : "ready";
  });

  useEffect(() => {
    if (!ref || isMissingMediaRef(ref) || isExpiredMediaRef(ref)) {
      setSrc(undefined);
      setStatus("missing");
      return;
    }

    if (!isManagedMediaRef(ref)) {
      setSrc(ref);
      setStatus("ready");
      return;
    }

    let cancelled = false;
    let objectUrl: string | undefined;
    setStatus("loading");

    mediaStore.resolve(ref).then((value) => {
      objectUrl = value;
      if (cancelled) {
        if (value) mediaStore.release(value);
        return;
      }
      setSrc(value);
      setStatus(value ? "ready" : "missing");
    }).catch(() => {
      if (!cancelled) {
        setSrc(undefined);
        setStatus("missing");
      }
    });

    return () => {
      cancelled = true;
      if (objectUrl) mediaStore.release(objectUrl);
    };
  }, [ref]);

  return { src, status };
}

/** True when a resolved URL cannot be handed to next/image. */
export function isUnoptimizableSrc(src: string): boolean {
  return src.startsWith("blob:") || src.startsWith("data:");
}
