// The contract every media backend must satisfy.
//
// Designs never embed binary data. They store an opaque *ref* string, and the
// renderer resolves that ref to a displayable URL at mount. That keeps large
// binaries out of the persisted JSON and means the same document works against
// any backend:
//
//   demo       -> indexedDbMediaStore  ("idb:<key>")
//   production -> a Cloudinary/S3 store that uploads and returns a CDN URL
//
// Swapping backends is a single change in ./index.ts — no component changes.

export type MediaKind = "image" | "video";

export interface MediaStore {
  /** Persist a blob and return the ref to store in the design. */
  put(blob: Blob, kind: MediaKind): Promise<string>;
  /** Resolve a ref to something an <img>/<video> can load. */
  resolve(ref: string): Promise<string | undefined>;
  /** Release any transient URL created by `resolve`. */
  release(url: string): void;
  remove(ref: string): Promise<void>;
}

const IDB_PREFIX = "idb:";

/** True for refs this app owns and must resolve before rendering. */
export function isManagedMediaRef(ref: string): boolean {
  return ref.startsWith(IDB_PREFIX);
}

export function toManagedMediaRef(key: string): string {
  return `${IDB_PREFIX}${key}`;
}

export function managedMediaKey(ref: string): string | undefined {
  return ref.startsWith(IDB_PREFIX) ? ref.slice(IDB_PREFIX.length) : undefined;
}

/**
 * Refs that are already directly loadable: hosted URLs, app-relative paths, and
 * data URLs from documents authored before the media store existed.
 */
export function isDirectMediaRef(ref: string): boolean {
  return /^(https?:|data:|blob:|\/)/.test(ref);
}

/**
 * `blob:` URLs from the pre-MediaStore uploader do not survive a reload. We
 * cannot recover the bytes, so callers should render a "media unavailable"
 * placeholder rather than a broken image.
 */
export function isExpiredMediaRef(ref: string): boolean {
  return ref.startsWith("blob:");
}

export function makeMediaKey(kind: MediaKind): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${kind}-${Date.now()}-${random}`;
}
