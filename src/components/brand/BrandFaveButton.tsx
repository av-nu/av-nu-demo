"use client";

import { Heart } from "lucide-react";

import { useSocialGraph } from "@/hooks/useSocialGraph";
import { useSocialStore } from "@/hooks/useSocialStore";
import { cn } from "@/lib/utils";

/**
 * Favourites a brand, wherever a brand appears.
 *
 * One component for the product page, the brand index, and a brand's own page, so
 * the state and wording cannot disagree between them.
 */
export function BrandFaveButton({
  brandId,
  brandName,
  variant = "button",
  onToast,
  className,
}: {
  brandId: string;
  brandName: string;
  /** `icon` for a tile corner, `button` where there is room for a label. */
  variant?: "button" | "icon";
  onToast?: (message: string) => void;
  className?: string;
}) {
  const { followedBrands, followBrand, unfollowBrand } = useSocialGraph();
  const { isHydrated } = useSocialStore();
  // Follow state is stored locally, so it has to wait for hydration or the label
  // disagrees with the server-rendered markup.
  const isFave = isHydrated && followedBrands.includes(brandId);

  const toggle = () => {
    if (isFave) {
      unfollowBrand(brandId);
      onToast?.(`Removed ${brandName} from your brands`);
      return;
    }
    followBrand(brandId);
    onToast?.(`Added ${brandName} to your brands`);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={(event) => {
          // Tiles are usually links; favouriting should not navigate.
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }}
        aria-pressed={isFave}
        aria-label={isFave ? `Remove ${brandName} from your brands` : `Add ${brandName} to your brands`}
        title={isFave ? "Remove from your brands" : "Add to your brands"}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-divider/60 bg-bg/90 shadow-sm backdrop-blur transition-colors",
          isFave ? "text-pink" : "text-midnight/45 hover:text-midnight",
          className,
        )}
      >
        <Heart className={cn("h-4 w-4", isFave && "fill-current")} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isFave}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        isFave ? "border-pink/40 bg-pink/10 text-pink" : "border-divider/70 text-midnight/70 hover:border-midnight/40 hover:text-midnight",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", isFave && "fill-current")} />
      {isFave ? "Saved" : "Save brand"}
    </button>
  );
}
