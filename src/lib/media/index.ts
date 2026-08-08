import { createIndexedDbMediaStore, isIndexedDbAvailable } from "./indexedDbMediaStore";
import { createMemoryMediaStore } from "./memoryMediaStore";
import type { MediaStore } from "./MediaStore";

export type { MediaStore, MediaKind } from "./MediaStore";
export {
  isDirectMediaRef,
  isExpiredMediaRef,
  isManagedMediaRef,
  makeMediaKey,
  managedMediaKey,
  toManagedMediaRef,
} from "./MediaStore";
export { createMemoryMediaStore } from "./memoryMediaStore";
export { createIndexedDbMediaStore, isIndexedDbAvailable } from "./indexedDbMediaStore";

/**
 * The media backend the app talks to. Swapping in a Cloudinary/S3 store for
 * production is a one-line change here — nothing else imports the concrete
 * implementations.
 */
export const mediaStore: MediaStore = isIndexedDbAvailable()
  ? createIndexedDbMediaStore()
  : createMemoryMediaStore();
