export type SharedFavesPayload = {
  version: 1;
  name: string;
  productIds: string[];
};

export function encodeSharedFaves(payload: SharedFavesPayload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSharedFaves(token: string): SharedFavesPayload | null {
  try {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const value = JSON.parse(new TextDecoder().decode(bytes)) as SharedFavesPayload;
    if (value.version !== 1 || typeof value.name !== "string" || !Array.isArray(value.productIds)) return null;
    return { ...value, productIds: value.productIds.filter((id): id is string => typeof id === "string") };
  } catch {
    return null;
  }
}
