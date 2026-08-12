"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";

import { PostCard } from "@/components/post/PostCard";
import { PostQuickView } from "@/components/post/PostQuickView";
import { ProductQuickView } from "@/components/home/ProductQuickView";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/data/mockProducts";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useListSocial } from "@/hooks/useListSocial";
import { useSocialStore } from "@/hooks/useSocialStore";
import { getProductById } from "@/lib/data";
import { isMediaPage } from "@/lib/post";
import { socialService, toSocialUser } from "@/lib/social";

export default function MomentsPage() {
  const { state, isHydrated } = useSocialStore();
  const { showToast, ToastContainer } = useToast();
  const { isLiked, toggleLike } = useListSocial();
  const [activePostId, setActivePostId] = useState<string>();
  const [activeProduct, setActiveProduct] = useState<Product>();
  const feedPosts = useFeedPosts();
  // Moments are posts whose page is a single photo or video, which is what the
  // old moment format was; nothing else distinguished them.
  const publishedMoments = useMemo(
    () => feedPosts.filter((post) => post.pages.length === 1 && isMediaPage(post.pages[0])),
    [feedPosts],
  );
  const activePost = activePostId ? publishedMoments.find((post) => post.id === activePostId) : undefined;

  if (!isHydrated) {
    return <div className="grid gap-6 sm:grid-cols-2"><div className="h-[28rem] animate-pulse rounded-2xl bg-surface/50" /><div className="h-[28rem] animate-pulse rounded-2xl bg-surface/50" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4 py-8 sm:py-12">
        <div>
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-text/55 hover:text-text"><ArrowLeft className="h-4 w-4" />Back to Discover</Link>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ember/15 text-ember"><Camera className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember/80">Community</p>
              <h1 className="font-headline text-4xl tracking-tight text-text sm:text-5xl">Published moments</h1>
            </div>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text/60">Images, videos, and small points of view from the av | nu community.</p>
        </div>
        <Link href="/create" className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ember/90">Create a post</Link>
      </header>

      {publishedMoments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {publishedMoments.map((moment) => (
            <PostCard
              key={moment.id}
              post={moment}
              author={toSocialUser(moment.authorId, state)}
              liked={isLiked(moment.id)}
              saved={false}
              onLike={() => toggleLike(moment.id)}
              onComment={() => setActivePostId(moment.id)}
              onSave={() => showToast("Saved to your posts")}
              onShare={() => showToast("Sharing coming soon")}
              onOpen={() => setActivePostId(moment.id)}
              onProductClick={(productId) => { const product = getProductById(productId); if (product) setActiveProduct(product); }}
              onDelete={moment.authorId === "me" ? () => { void socialService.deletePost(moment.id); showToast("Post deleted"); } : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-divider/70 bg-surface/30 px-6 py-20 text-center">
          <Camera className="mx-auto h-8 w-8 text-text/30" />
          <h2 className="mt-4 font-headline text-2xl text-text">No published moments yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text/55">Share an image, video, or thought and it will appear here.</p>
          <Link href="/create" className="mt-5 inline-flex rounded-full bg-text px-5 py-3 text-sm font-semibold text-bg">Create a post</Link>
        </div>
      )}

      {activePost && (
        <PostQuickView
          post={activePost}
          author={toSocialUser(activePost.authorId, state)}
          liked={isLiked(activePost.id)}
          saved={false}
          onLike={() => toggleLike(activePost.id)}
          onSave={() => showToast("Saved to your posts")}
          onShare={() => showToast("Sharing coming soon")}
          onProductClick={(productId) => { const product = getProductById(productId); if (product) setActiveProduct(product); }}
          onClose={() => setActivePostId(undefined)}
        />
      )}
      {activeProduct && (
        <ProductQuickView product={activeProduct} onClose={() => setActiveProduct(undefined)} onToast={showToast} />
      )}
      <ToastContainer />
    </div>
  );
}
