import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Derives a first-frame poster image from a Cloudinary video URL so the video
 * is visible immediately — even before autoplay kicks in (mobile browsers
 * often defer autoplay, leaving an empty container otherwise). Returns
 * `undefined` for non-Cloudinary or blob/object URLs, which have no poster.
 */
export function getVideoPoster(videoUrl: string | undefined): string | undefined {
  if (!videoUrl) return undefined;
  if (!videoUrl.includes("res.cloudinary.com") || !videoUrl.includes("/video/upload/")) {
    return undefined;
  }
  return videoUrl
    .replace("/video/upload/", "/video/upload/so_0/")
    .replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, ".jpg$2");
}
