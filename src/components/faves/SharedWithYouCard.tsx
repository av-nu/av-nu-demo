"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SharedList } from "@/data/faves";
import { getContactById } from "@/data/social";
import { getProductById } from "@/lib/data";
import { useFaveLists } from "@/hooks/useFaveLists";
import { DEFAULT_TEMPLATE } from "@/data/listTemplates";
import { useRequireAuth } from "@/components/auth/AccountInvitationDialog";

export function SharedWithYouCard({
  shared,
  onToast,
}: {
  shared: SharedList;
  onToast?: (message: string) => void;
}) {
  const { createListWithProducts } = useFaveLists();
  const { requireAuth, invitation } = useRequireAuth();
  const [savedLocally, setSavedLocally] = useState(false);

  const author = getContactById(shared.authorId);
  const images = shared.productIds
    .map((id) => getProductById(id)?.images[0])
    .filter(Boolean)
    .slice(0, 4) as string[];

  const handleSave = () => {
    if (savedLocally) return;
    requireAuth("save this shared list", () => {
      createListWithProducts(shared.name, shared.productIds, DEFAULT_TEMPLATE);
      setSavedLocally(true);
      onToast?.(`Saved "${shared.name}" to Favorites`);
    });
  };

  const itemCount = shared.productIds.length;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-divider/50 bg-surface/30">
      <Link href={`/favorites/shared/${shared.id}`} className="group block">
        <div className="relative aspect-[4/3] bg-surface">
          {images.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-text/30">
              <ImageIcon className="h-8 w-8" strokeWidth={1.5} />
            </div>
          ) : (
            <div
              className={cn(
                "grid h-full w-full gap-0.5",
                images.length === 1 ? "grid-cols-1" : "grid-cols-2",
                images.length > 2 ? "grid-rows-2" : "grid-rows-1",
              )}
            >
              {images.map((src, i) => (
                <div key={i} className="relative overflow-hidden bg-surface">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width:768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 p-3 pb-0">
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
              author?.color ?? "bg-accent",
            )}
          >
            {author?.initials ?? "AV"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-text/60">{author?.name ?? "A friend"} shared</p>
            <p className="line-clamp-1 text-sm font-medium text-text">{shared.name}</p>
            <p className="mt-0.5 text-xs text-text/50">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
      </Link>

      <div className="p-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={savedLocally}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
            savedLocally
              ? "bg-surface text-text/50"
              : "bg-text text-bg hover:bg-text/90",
          )}
        >
          <Bookmark className={cn("h-4 w-4", savedLocally && "fill-current")} />
          {savedLocally ? "Saved" : "Save to Favorites"}
        </button>
      </div>
      {invitation}
    </div>
  );
}
