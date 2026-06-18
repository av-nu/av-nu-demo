"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/ProductCard";
import { ShoppableVideoCard } from "@/components/home/ShoppableVideoCard";
import { ListPostCard, type FeedListPost } from "@/components/home/ListPostCard";
import { buildSpotlightRows } from "@/data/spotlight";
import { communityLists } from "@/data/faves";
import { getContactById, currentUser } from "@/data/social";
import { useFaveLists } from "@/hooks/useFaveLists";

// Insert a shared-list post after every N video rows.
const POST_INTERVAL = 2;

export function ShoppableFeed({ onShare }: { onShare: (message: string) => void }) {
  const rows = useMemo(() => buildSpotlightRows(4), []);
  const { lists } = useFaveLists();

  // Public list posts = the current user's public lists + seeded community lists.
  const posts = useMemo<FeedListPost[]>(() => {
    const ownPublic: FeedListPost[] = lists
      .filter((l) => l.visibility === "public" && l.productIds.length > 0)
      .map((l) => ({
        id: l.id,
        authorName: currentUser.name,
        authorInitials: currentUser.initials,
        authorColor: "bg-burgundy",
        name: l.name,
        type: l.type,
        productIds: l.productIds,
        href: `/favorites/${l.id}`,
      }));

    const community: FeedListPost[] = communityLists.map((c) => {
      const author = getContactById(c.authorId);
      return {
        id: c.id,
        authorName: author?.name ?? "A member",
        authorInitials: author?.initials ?? "AV",
        authorColor: author?.color ?? "bg-accent",
        name: c.name,
        type: c.type,
        productIds: c.productIds,
      };
    });

    return [...ownPublic, ...community];
  }, [lists]);

  let postCursor = 0;

  return (
    <section id="nu-feed" className="mt-10 scroll-mt-24 md:mt-16">
      <div className="mb-6">
        <h2 className="font-headline text-2xl tracking-tight text-text">Nu for you</h2>
        <p className="mt-1 text-sm text-text/50">
          Shoppable stories and lists from independent brands and your community
        </p>
      </div>

      <div className="space-y-12 md:space-y-16">
        {rows.map((row, index) => {
          const videoFirst = index % 2 === 0;

          // Pull the next list post to insert after this row (if due).
          const showPost =
            (index + 1) % POST_INTERVAL === 0 && postCursor < posts.length;
          const post = showPost ? posts[postCursor++] : null;

          return (
            <div key={row.id} className="space-y-12 md:space-y-16">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
                {/* Video column */}
                <div className={cn(videoFirst ? "md:order-1" : "md:order-2")}>
                  <ShoppableVideoCard
                    videoUrl={row.videoUrl}
                    product={row.featured}
                    onShare={onShare}
                  />
                </div>

                {/* 2x2 product grid — fills the height of the video column */}
                <div className={cn("md:h-full", videoFirst ? "md:order-2" : "md:order-1")}>
                  <div className="grid grid-cols-2 gap-4 md:h-full md:auto-rows-fr">
                    {row.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onShare={onShare}
                        stretch
                      />
                    ))}
                  </div>
                </div>
              </div>

              {post && <ListPostCard post={post} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
