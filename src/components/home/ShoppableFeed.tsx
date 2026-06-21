"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/ProductCard";
import { ShoppableVideoCard } from "@/components/home/ShoppableVideoCard";
import { FeedListPost, type FeedListPost as FeedListPostType } from "@/components/home/FeedListPost";
import { buildSpotlightRows, type SpotlightRow } from "@/data/spotlight";
import { communityLists, flattenPages } from "@/data/faves";
import { getContactById, currentUser } from "@/data/social";
import { getProductById } from "@/lib/data";
import { useFaveLists } from "@/hooks/useFaveLists";

// Drop a list post into the running order after every N video rows.
const POST_INTERVAL = 2;

type FeedItem =
  | { kind: "video"; row: SpotlightRow }
  | { kind: "post"; post: FeedListPostType };

export function ShoppableFeed({ onShare }: { onShare: (message: string) => void }) {
  const rows = useMemo(() => buildSpotlightRows(4), []);
  const { lists } = useFaveLists();

  const posts = useMemo<FeedListPostType[]>(() => {
    const ownPublic: FeedListPostType[] = lists
      .filter((l) => l.visibility === "public" && flattenPages(l.pages ?? []).length > 0)
      .map((l) => ({
        id: l.id,
        authorName: currentUser.name,
        authorInitials: currentUser.initials,
        authorColor: "bg-burgundy",
        name: l.name,
        caption: l.caption,
        pages: l.pages ?? [],
        seedLikes: 0,
        seedComments: [],
        href: `/favorites/${l.id}`,
      }));

    const community: FeedListPostType[] = communityLists.map((c) => {
      const author = getContactById(c.authorId);
      return {
        id: c.id,
        authorName: author?.name ?? "A member",
        authorInitials: author?.initials ?? "AV",
        authorColor: author?.color ?? "bg-accent",
        name: c.name,
        caption: c.caption,
        pages: c.pages,
        seedLikes: c.likes,
        seedComments: c.comments,
        savePayload: { name: c.name, productIds: flattenPages(c.pages) },
      };
    });

    return [...ownPublic, ...community];
  }, [lists]);

  // Interleave videos and posts into one ordered list — a post simply takes a
  // slot where a video could be.
  const feedItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    let pi = 0;
    rows.forEach((row, i) => {
      items.push({ kind: "video", row });
      if ((i + 1) % POST_INTERVAL === 0 && pi < posts.length) {
        items.push({ kind: "post", post: posts[pi++] });
      }
    });
    while (pi < posts.length) items.push({ kind: "post", post: posts[pi++] });
    return items;
  }, [rows, posts]);

  return (
    <section id="nu-feed" className="mt-10 scroll-mt-24 md:mt-16">
      <div className="mb-6">
        <h2 className="font-headline text-2xl tracking-tight text-text">Nu for you</h2>
        <p className="mt-1 text-sm text-text/50">
          Shoppable stories and lists from independent brands and your community
        </p>
      </div>

      <div className="space-y-12 md:space-y-16">
        {feedItems.map((item, index) => {
          const mediaFirst = index % 2 === 0;
          const isVideo = item.kind === "video";

          const sideProducts = isVideo
            ? item.row.products
            : (flattenPages(item.post.pages)
                .map((id) => getProductById(id))
                .filter(Boolean)
                .slice(0, 4) as NonNullable<ReturnType<typeof getProductById>>[]);

          const key = isVideo ? item.row.id : `post-${item.post.id}`;

          return (
            <div
              key={key}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch"
            >
              {/* Media column (video or list post) */}
              <div className={cn("md:flex md:flex-col", mediaFirst ? "md:order-1" : "md:order-2")}>
                {isVideo ? (
                  <ShoppableVideoCard
                    videoUrl={item.row.videoUrl}
                    product={item.row.featured}
                    onShare={onShare}
                  />
                ) : (
                  <FeedListPost post={item.post} onToast={onShare} />
                )}
              </div>

              {/* 2x2 product grid to the side — fills the media column height */}
              <div className={cn("md:h-full", mediaFirst ? "md:order-2" : "md:order-1")}>
                <div className="grid grid-cols-2 gap-4 md:h-full md:auto-rows-fr">
                  {sideProducts.map((product) => (
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
          );
        })}
      </div>
    </section>
  );
}
