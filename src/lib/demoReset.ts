/**
 * Returning the demo to its seeded state.
 *
 * Every browser-held key is listed in one place: scattered across the hooks that
 * own them, a reset would quietly stop covering whatever was added last.
 */

const DEMO_STORAGE_KEYS = [
  "avnu-social-state",
  "avnu-saved-looks",
  "avnu-fave-lists",
  "avnu-favorites",
  "avnu-saved-posts",
  "avnu-saved-post-groups",
  "avnu-list-social",
  "avnu-saved-colors",
  "avnu-recent-colors",
  "avnu-interests",
  "avnu-cart",
  "avnu-last-order",
  "avnu-oms-orders",
  "avnu-oms-role",
  "avnu-oms-seed-version",
  "avnu-user-ratings",
  "avnu-auth",
] as const;

/** IndexedDB database holding uploaded media (see MediaStore). */
const MEDIA_DB_NAME = "avnu-media";

export function demoStorageKeys(): readonly string[] {
  return DEMO_STORAGE_KEYS;
}

/**
 * Clears everything the demo has stored in this browser: local storage and any
 * uploaded media. Resolves once the media database is gone, so a caller can
 * reload knowing the reset finished.
 */
export async function resetDemoData(): Promise<void> {
  if (typeof window === "undefined") return;

  for (const key of DEMO_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // A single unreadable key should not abort the rest of the reset.
    }
  }

  await deleteMediaDatabase();
}

function deleteMediaDatabase(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    try {
      const request = indexedDB.deleteDatabase(MEDIA_DB_NAME);
      request.onsuccess = finish;
      request.onerror = finish;
      // Another tab holding the database open would block this indefinitely;
      // the local storage reset has already happened, so do not hang on it.
      request.onblocked = finish;
      window.setTimeout(finish, 1500);
    } catch {
      finish();
    }
  });
}
