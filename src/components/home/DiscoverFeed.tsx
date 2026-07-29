import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Film, Heart, ImagePlus, Plus, ShoppingBag, Users } from "lucide-react";

import { AddPostMenu } from "@/components/social/AddPostMenu";
import { FeaturedGuideArtwork } from "@/components/home/FeaturedGuideArtwork";
import { PostQuickView, type DiscoverPost } from "@/components/home/PostQuickView";
import { SavePostDialog } from "@/components/social/SavePostDialog";
import { ProductCard } from "@/components/product/ProductCard";
import { VideoReviewCard } from "@/components/social/VideoReviewCard";
import { buildSpotlightRows } from "@/data/spotlight";
import { discoverGuidePosts } from "@/data/curatedGuides";
import { communityLists, flattenPages } from "@/data/faves";
import { contacts, getContactById } from "@/data/social";
import { mockBrands } from "@/data/mockBrands";
import { mockProducts, type Product } from "@/data/mockProducts";
import { useListSocial } from "@/hooks/useListSocial";
import { useSavedPostGroups } from "@/hooks/useSavedPostGroups";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { useSocialStore } from "@/hooks/useSocialStore";
import { useVideoReviews } from "@/hooks/useVideoReviews";
import { getProductById } from "@/lib/data";
import { getVideoPoster } from "@/lib/utils";
import { toSocialUser } from "@/lib/social";

const DISCOVERY_CATEGORY_ORDER = ["Apparel", "Accessories", "Home & Living", "Beauty", "Wellness", "Outdoors", "Food & Drink", "Pet", "Kids"];

function interleaveProducts(products: Product[]) {
  const buckets = new Map(DISCOVERY_CATEGORY_ORDER.map((category) => [category, products.filter((product) => product.category === category)]));
  const remainingCategories = products
    .map((product) => product.category)
    .filter((category, index, all) => all.indexOf(category) === index && !DISCOVERY_CATEGORY_ORDER.includes(category));
  const orderedCategories = [...DISCOVERY_CATEGORY_ORDER, ...remainingCategories];
  const mixedProducts: Product[] = [];
  let remaining = products.length;

  while (remaining > 0) {
    for (const category of orderedCategories) {
      const bucket = buckets.get(category);
      const product = bucket?.shift();
      if (!product) continue;
      mixedProducts.push(product);
      remaining -= 1;
    }
  }

  return mixedProducts;
}

export function DiscoverFeed({ onToast }: { onToast: (message: string) => void }) {
  const [scope, setScope] = useState<"discover" | "inner">("discover");
  const [creating, setCreating] = useState(false);
  const [activePost, setActivePost] = useState<DiscoverPost>();
  const [savePost, setSavePost] = useState<DiscoverPost>();
  const { isLiked, toggleLike } = useListSocial();
  const { groups, saveToDefault } = useSavedPostGroups();
  const { followedBrands, followBrand, unfollowBrand } = useSocialGraph();
  const { state } = useSocialStore();
  const { publishedMoments } = useVideoReviews();
  const currentUser = toSocialUser("me", state);
  const videos = useMemo(() => buildSpotlightRows(16), []);
  const innerIds = new Set(contacts.filter((contact) => contact.circle === "inner").map((contact) => contact.id));
  const visibleLists = discoverGuidePosts(communityLists).filter((list) => scope === "discover" || innerIds.has(list.authorId));
  const visibleVideos = scope === "discover" ? videos : videos.slice(0, 2);
  const products = useMemo(() => scope === "discover" ? mockProducts : mockProducts.slice(0, 24), [scope]);
  const mixed = useMemo(() => {
    const productItems = interleaveProducts(products).map((product, index) => ({ kind: "product" as const, id: product.id, index, data: product }));
    const postItems = [
      ...publishedMoments.map((moment, index) => ({ kind: "moment" as const, id: moment.id, index, data: moment })),
      ...visibleVideos.map((row, index) => ({ kind: "video" as const, id: row.id, index, data: row })),
      ...visibleLists.map((list, index) => ({ kind: "list" as const, id: list.id, index, data: list })),
    ];
    const result: Array<(typeof productItems)[number] | (typeof postItems)[number]> = [];
    let postIndex = 0;

    productItems.forEach((product, index) => {
      if (index > 0 && index % 4 === 0 && postIndex < postItems.length) result.push(postItems[postIndex++]);
      result.push(product);
    });

    return [...result, ...postItems.slice(postIndex)];
  }, [products, publishedMoments, visibleLists, visibleVideos]);
  const [visibleCount, setVisibleCount] = useState(24);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < mixed.length;

  useEffect(() => {
    setVisibleCount(24);
  }, [scope]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount((count) => Math.min(count + 24, mixed.length));
      }
    }, { rootMargin: "600px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, mixed.length, visibleCount]);

  return (
    <div className="mx-auto max-w-[1500px] pb-12">
      <header className="py-7 text-center sm:py-10">
        <p className="mx-auto max-w-none whitespace-nowrap px-0 text-xs uppercase tracking-[0.24em] text-burgundy/55">Shop Small, Together</p>
        <h1 className="mt-2 font-headline text-4xl tracking-tight text-text sm:text-5xl">Discover something <span className="italic text-burgundy">nu</span></h1>
        <div className="mx-auto mt-5 flex w-fit rounded-full border border-divider bg-white p-1 shadow-sm">
          <button type="button" onClick={() => setScope("discover")} className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${scope === "discover" ? "bg-burgundy text-white" : "text-text/60"}`}>Discover</button>
          <button type="button" onClick={() => setScope("inner")} className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${scope === "inner" ? "bg-burgundy text-white" : "text-text/60"}`}>Inner Circle</button>
        </div>
      </header>

      <div className={scope === "inner" ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]" : ""}>
        {scope === "inner" && (
          <section className="overflow-hidden rounded-3xl border border-divider bg-white/75 px-4 py-5 sm:px-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text/45">Recent from your circle</p><p className="mt-1 text-[11px] text-text/45">Follow people and brands worth knowing.</p></div>
              <Link href="/connections" className="shrink-0 text-xs font-semibold text-burgundy hover:underline">See all</Link>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto pb-1">
              <Link href="/connections" className="flex shrink-0 flex-col items-center gap-2"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-divider bg-pink/10 text-burgundy"><Users className="h-5 w-5" /></span><span className="text-[10px] font-semibold text-text/60">My Circle</span></Link>
              {contacts.filter((contact) => contact.circle === "inner").slice(0, 6).map((contact) => <Link key={contact.id} href={`/u/${contact.id}`} className="flex shrink-0 flex-col items-center gap-2"><span className={`flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-accent/60 p-0.5 text-xs font-semibold text-white ${contact.color}`}><span className="flex h-full w-full items-center justify-center rounded-full">{contact.initials}</span></span><span className="max-w-16 truncate text-[10px] text-text/60">{contact.handle}</span></Link>)}
              {mockBrands.slice(0, 4).map((brand) => { const isFollowing = followedBrands.includes(brand.id); return <div key={brand.id} className="flex shrink-0 flex-col items-center gap-2"><Link href={`/brand/${brand.id}`} className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[3px] border-pink/60 bg-white p-2"><Image src={brand.logoMark} alt={brand.name} width={48} height={48} className="h-full w-full object-contain" /></Link><button type="button" onClick={() => isFollowing ? unfollowBrand(brand.id) : followBrand(brand.id)} className={`max-w-20 truncate text-[10px] font-semibold ${isFollowing ? "text-accent" : "text-text/60"}`}>{isFollowing ? "Following" : brand.name}</button></div>; })}
            </div>
          </section>
        )}

        <button type="button" onClick={() => setCreating(true)} className={`flex min-h-28 items-center justify-between gap-4 rounded-3xl border border-divider bg-white px-5 text-left transition-colors hover:bg-pink/10 ${scope === "discover" ? "w-full" : ""}`}>
          <div><span className="inline-flex items-center gap-1 rounded-full bg-burgundy px-2.5 py-1 text-[10px] font-semibold text-white"><Plus className="h-3 w-3" />Create</span><p className="mt-3 text-sm text-text/60">Post a guide, review, or moment</p></div>
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-pink/20 text-burgundy"><ImagePlus className="h-7 w-7" /></span>
        </button>
      </div>

      <p className="mb-4 mt-8 text-xs italic text-text/50">Inspiration, guides, and reviews from people and brands worth knowing.</p>
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
        {mixed.slice(0, visibleCount).map((item) => {
          if (item.kind === "product") return <div key={`product-${item.id}`} className="mb-5 w-full break-inside-avoid"><ProductCard product={item.data} onShare={onToast} imageAspect={item.index % 3 === 0 ? "tall" : item.index % 3 === 1 ? "portrait" : "square"} /></div>;
          if (item.kind === "moment") {
            const author = item.data.authorId === "me" ? currentUser : toSocialUser(item.data.authorId, state);
            return <div key={`moment-${item.id}`} className="mb-5 w-full break-inside-avoid"><VideoReviewCard review={item.data} author={author} /></div>;
          }
          if (item.kind === "video") {
            const author = contacts[item.index % contacts.length];
            const videoPost: DiscoverPost = { kind: "video", id: item.id, data: item.data, author };
            const videoSaved = groups.some((group) => group.postIds.includes(item.id));
            return <Link key={`video-${item.id}`} href={`/post/video/${item.id}`} onClick={(event) => { event.preventDefault(); setActivePost(videoPost); }} className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-divider bg-white"><div className={`relative bg-text ${item.index % 2 ? "aspect-[4/5]" : "aspect-[3/5]"}`}><video src={item.data.videoUrl} poster={getVideoPoster(item.data.videoUrl)} preload="metadata" muted loop playsInline autoPlay className="h-full w-full object-cover" /></div><div className="flex flex-col p-3"><div className="order-1 mt-4 flex items-center gap-3"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white ${author.color}`}>{author.initials}</span><span className="truncate text-[11px] font-semibold text-text/70">@{author.handle}</span><Film className="ml-auto h-4 w-4 shrink-0 text-burgundy/60" /></div><p className="order-3 mt-3 font-headline text-base leading-tight text-text">{item.data.title}</p><p className="order-3 mt-1 text-[10px] text-text/50">Watch and shop the look</p><div className="order-first mt-3 flex items-center gap-8 border-t border-divider/60 pt-2"><button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleLike(item.id); }} aria-label={isLiked(item.id) ? "Unlike moment" : "Like moment"} className={`flex items-center gap-3 text-xs font-semibold ${isLiked(item.id) ? "text-pink" : "text-text/45 hover:text-pink"}`}><Heart className={`h-4 w-4 ${isLiked(item.id) ? "fill-current" : ""}`} />{isLiked(item.id) ? "Liked" : "Like"}</button><button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); if (saveToDefault(item.id)) setSavePost(videoPost); else onToast("Saved moment to Saved Posts"); }} aria-label={videoSaved ? "Edit saved collections" : "Save moment"} className={`ml-auto flex items-center gap-1 text-xs font-semibold ${videoSaved ? "text-accent" : "text-text/45 hover:text-accent"}`}><Bookmark className={`h-4 w-4 ${videoSaved ? "fill-current" : ""}`} />{videoSaved ? "Saved" : "Save"}</button></div></div></Link>;
          }
          const author = getContactById(item.data.authorId);
          const productIds = flattenPages(item.data.pages);
          const images = productIds.map((id) => getProductById(id)?.images[0]).filter(Boolean).slice(0, 4) as string[];
          const listPost: DiscoverPost = { kind: "list", id: item.id, data: item.data, author };
          const listSaved = groups.some((group) => group.postIds.includes(item.id));
          return <Link key={`list-${item.id}`} href={`/post/list/${item.id}`} onClick={(event) => { event.preventDefault(); setActivePost(listPost); }} className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-divider bg-white">{item.data.format === "featured" ? <FeaturedGuideArtwork guide={item.data} productIds={productIds} author={author} /> : <div className={`grid ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>{images.map((src, index) => <div key={src} className={`relative ${item.index % 3 === 0 ? "aspect-[4/5]" : item.index % 3 === 1 ? "aspect-square" : "aspect-[3/4]"}`}><Image src={src} alt="" fill sizes="240px" className="object-cover transition-transform duration-500 group-hover:scale-105" />{index === 0 && <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[9px] font-semibold text-text"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[7px] text-white ${author?.color}`}>{author?.initials}</span>@{author?.handle}</div>}</div>)}</div>}<div className="flex flex-col p-3">{item.data.format !== "featured" && <><p className="order-3 font-headline text-base text-text">{item.data.name}</p><p className="order-3 mt-1 line-clamp-2 text-[11px] leading-relaxed text-text/60">{item.data.caption}</p></>}<div className="order-first mt-3 flex items-center gap-8 text-[10px] text-burgundy/70"><button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleLike(item.id); }} aria-label={isLiked(item.id) ? "Unlike list" : "Like list"} className={`flex items-center gap-3 font-semibold ${isLiked(item.id) ? "text-pink" : "text-text/45 hover:text-pink"}`}><Heart className={`h-3.5 w-3.5 ${isLiked(item.id) ? "fill-current" : ""}`} />{isLiked(item.id) ? "Liked" : item.data.likes}</button><button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); if (saveToDefault(item.id)) setSavePost(listPost); else onToast("Saved list to Saved Posts"); }} aria-label={listSaved ? "Edit saved collections" : "Save list"} className={`ml-auto flex items-center gap-1 font-semibold ${listSaved ? "text-accent" : "text-text/45 hover:text-accent"}`}><Bookmark className={`h-3.5 w-3.5 ${listSaved ? "fill-current" : ""}`} />{listSaved ? "Saved" : "Save"}</button><span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />Shop</span></div></div></Link>;
        })}
      </div>

      {hasMore && <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center text-xs text-text/45">Loading more inspiration…</div>}

      {creating && <AddPostMenu onClose={() => setCreating(false)} onToast={onToast} />}
      {activePost && <PostQuickView post={activePost} onClose={() => setActivePost(undefined)} />}
      {savePost && <SavePostDialog postId={savePost.id} onClose={() => setSavePost(undefined)} onToast={onToast} />}
    </div>
  );
}
