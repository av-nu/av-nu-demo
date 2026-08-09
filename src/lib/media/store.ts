import { createIndexedDbMediaStore, isIndexedDbAvailable } from "./indexedDbMediaStore";
import { createMemoryMediaStore } from "./memoryMediaStore";
import type { MediaStore } from "./MediaStore";

/**
 * The media backend the app talks to.
 *
 * Swapping in a Cloudinary/S3 store for production is a one-line change here —
 * nothing else imports the concrete implementations. Lives in its own module so
 * consumers (including the resolver hook) avoid a circular import through the
 * package index.
 */
export const mediaStore: MediaStore = isIndexedDbAvailable()
  ? createIndexedDbMediaStore()
  : createMemoryMediaStore();
