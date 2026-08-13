import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Users } from "lucide-react";

import { PostCard } from "@/components/post/PostCard";
import { PostQuickView } from "@/components/post/PostQuickView";
import type { Post } from "@/lib/post";
import { ProductQuickView } from "@/components/home/ProductQuickView";
import { Avatar } from "@/components/social/Avatar";
import { SavePostDialog } from "@/components/social/SavePostDialog";
import { SharePostDialog } from "@/components/social/SharePostDialog";
import { ProductCard } from "@/components/product/ProductCard";
import { contacts } from "@/data/social";
import { mockBrands } from "@/data/mockBrands";
import { mockProducts, type Product } from "@/data/mockProducts";
import { useListSocial } from "@/hooks/useListSocial";
import { useSavedPostGroups } from "@/hooks/useSavedPostGroups";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { useSocialStore } from "@/hooks/useSocialStore";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { getProductById } from "@/lib/data";
import { socialService, toSocialUser } from "@/lib/social";

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
  // Held by id, not by value: a comment or like has to be reflected in the open
  // post, and a snapshot would go stale the moment it changed.
  const [activePostId, setActivePostId] = useState<string>();
  const [activeProduct, setActiveProduct] = useState<Product>();
  const [savePost, setSavePost] = useState<Post>();
  const [sharePost, setSharePost] = useState<Post>();
  const { isLiked, toggleLike } = useListSocial();
  const { groups, saveToDefault } = useSavedPostGroups();
  const { followedBrands, followBrand, unfollowBrand } = useSocialGraph();
  const { state, isHydrated } = useSocialStore();
  const feedPosts = useFeedPosts();
  const currentUser = toSocialUser("me", state);
  const innerIds = useMemo(() => new Set(contacts.filter((contact) => contact.circle === "inner").map((contact) => contact.id)), []);
  const activePost = activePostId ? feedPosts.find((post) => post.id === activePostId) : undefined;
  const products = useMemo(() => scope === "discover" ? mockProducts : mockProducts.slice(0, 24), [scope]);
  const mixed = useMemo(() => {
    const productItems = interleaveProducts(products).map((product, index) => ({ kind: "product" as const, id: product.id, index, data: product }));
    const postItems = feedPosts
      .filter((post) => scope === "discover" || innerIds.has(post.authorId) || post.authorId === "me")
      .map((post, index) => ({ kind: "post" as const, id: post.id, index, data: post }));
    const result: Array<(typeof productItems)[number] | (typeof postItems)[number]> = [];
    let postIndex = 0;

    // The author's own posts lead: publishing something and having to hunt for it
    // reads as though it failed.
    while (postIndex < postItems.length && postItems[postIndex].data.authorId === "me") {
      result.push(postItems[postIndex++]);
    }

    productItems.forEach((product, index) => {
      if (index > 0 && index % 4 === 0 && postIndex < postItems.length) result.push(postItems[postIndex++]);
      result.push(product);
    });

    return [...result, ...postItems.slice(postIndex)];
  }, [feedPosts, innerIds, products, scope]);
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
    <div className="mx-auto w-full min-w-0 max-w-[1500px] overflow-x-hidden pb-12">
      <header className="py-7 text-center sm:py-10">
        <p className="mx-auto max-w-none whitespace-nowrap px-0 text-xs uppercase tracking-[0.24em] text-text/70">Shop Small, Together</p>
        <h1 className="mt-2 font-headline text-4xl tracking-tight text-midnight sm:text-5xl">Discover something <span className="text-burgundy">nu</span></h1>
        <div className="mx-auto mt-5 flex w-fit rounded-full border border-divider bg-white p-1 shadow-sm">
          <button type="button" onClick={() => setScope("discover")} className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${scope === "discover" ? "bg-navy text-white" : "text-text/60"}`}>Discover</button>
          <button type="button" onClick={() => setScope("inner")} className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${scope === "inner" ? "bg-navy text-white" : "text-text/60"}`}>Inner Circle</button>
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
              {contacts.filter((contact) => contact.circle === "inner").slice(0, 6).map((contact) => <Link key={contact.id} href={`/u/${contact.id}`} className="flex shrink-0 flex-col items-center gap-2"><Avatar user={contact} size="lg" className="h-16 w-16 border-[3px] border-accent/60 p-0.5 text-xs" /><span className="max-w-16 truncate text-[10px] text-text/60">{contact.handle}</span></Link>)}
              {mockBrands.slice(0, 4).map((brand) => { const isFollowing = isHydrated && followedBrands.includes(brand.id); return <div key={brand.id} className="flex shrink-0 flex-col items-center gap-2"><Link href={`/brand/${brand.id}`} className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[3px] border-pink/60 bg-white p-2"><Image src={brand.logoMark} alt={brand.name} width={48} height={48} className="h-full w-full object-contain" /></Link><button type="button" onClick={() => isFollowing ? unfollowBrand(brand.id) : followBrand(brand.id)} className={`max-w-20 truncate text-[10px] font-semibold ${isFollowing ? "text-accent" : "text-text/60"}`}>{isFollowing ? "Following" : brand.name}</button></div>; })}
            </div>
          </section>
        )}

        {/* One way in. Guides, lists, and moments were separate creation paths;
            a post covers all three now, so offering them as choices would be
            offering shapes that no longer exist. */}
        <Link
          href="/create"
          className="group flex min-h-14 w-full max-w-full min-w-0 items-center gap-3 overflow-hidden rounded-3xl border border-accent/30 bg-accent px-4 py-3 text-white transition-colors hover:bg-accent/90"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-tight">Create a post</span>
            <span className="block truncate text-[11px] leading-snug text-white/85">
              Bring products, photos, and ideas together, and share what you love
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <p className="mb-4 mt-8 text-xs italic text-text/50">Inspiration, guides, and reviews from people and brands worth knowing.</p>
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
        {mixed.slice(0, visibleCount).map((item) => {
          if (item.kind === "product") return <div key={`product-${item.id}`} className="mb-5 w-full break-inside-avoid cursor-pointer"><ProductCard product={item.data} onShare={onToast} onProductClick={(event) => { event.preventDefault(); setActiveProduct(item.data); }} imageAspect={item.index % 3 === 0 ? "tall" : item.index % 3 === 1 ? "portrait" : "square"} /></div>;
          const post = item.data;
          const author = post.authorId === "me" ? currentUser : toSocialUser(post.authorId, state);
          const postSaved = groups.some((group) => group.postIds.includes(post.id));
          return (
            <div key={`post-${post.id}`} className="mb-5 w-full break-inside-avoid">
              <PostCard
                post={post}
                author={author}
                liked={isLiked(post.id)}
                saved={postSaved}
                onLike={() => toggleLike(post.id)}
                onComment={() => setActivePostId(post.id)}
                onSave={() => { if (saveToDefault(post.id)) setSavePost(post); else onToast("Saved to your posts"); }}
                onShare={() => setSharePost(post)}
                onOpen={() => setActivePostId(post.id)}
                onProductClick={(productId) => { const product = getProductById(productId); if (product) setActiveProduct(product); }}
                onDelete={post.authorId === "me" ? () => { void socialService.deletePost(post.id); onToast("Post deleted"); } : undefined}
              />
            </div>
          );
        })}
      </div>

      {hasMore && <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center text-xs text-text/45">Loading more inspiration…</div>}

      {activeProduct && <ProductQuickView product={activeProduct} onClose={() => setActiveProduct(undefined)} onToast={onToast} />}
      {activePost && (
        <PostQuickView
          post={activePost}
          author={activePost.authorId === "me" ? currentUser : toSocialUser(activePost.authorId, state)}
          liked={isLiked(activePost.id)}
          saved={groups.some((group) => group.postIds.includes(activePost.id))}
          onLike={() => toggleLike(activePost.id)}
          onSave={() => { if (saveToDefault(activePost.id)) setSavePost(activePost); else onToast("Saved to your posts"); }}
          onShare={() => setSharePost(activePost)}
          onComment={(text) => {
            void socialService.updatePost(activePost.id, {
              comments: [...activePost.comments, { id: `c-${Date.now()}`, authorName: currentUser.name, authorInitials: currentUser.initials, authorColor: currentUser.color, text, createdAt: Date.now() }],
            });
          }}
          onProductClick={(productId) => { const product = getProductById(productId); if (product) setActiveProduct(product); }}
          onClose={() => setActivePostId(undefined)}
        />
      )}
      {savePost && <SavePostDialog postId={savePost.id} onClose={() => setSavePost(undefined)} onToast={onToast} />}
      {sharePost && <SharePostDialog postTitle={sharePost.caption || "Post"} onClose={() => setSharePost(undefined)} onToast={onToast} />}
    </div>
  );
}
