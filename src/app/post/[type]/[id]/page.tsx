"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProductQuickView } from "@/components/home/ProductQuickView";
import { PostDetail } from "@/components/post/PostDetail";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/data/mockProducts";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useListSocial } from "@/hooks/useListSocial";
import { useSavedPostGroups } from "@/hooks/useSavedPostGroups";
import { useSocialStore } from "@/hooks/useSocialStore";
import { getProductById } from "@/lib/data";
import { canViewPost, socialService, toSocialUser } from "@/lib/social";

/**
 * A single post, reached by link or a direct visit.
 *
 * The `type` segment is kept for existing links but no longer means anything: a
 * post is a post, and the id resolves against the same stream the feed uses.
 */
export default function PostPage() {
  const params = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  const feedPosts = useFeedPosts();
  const { state, isHydrated } = useSocialStore();
  const { isLiked, toggleLike } = useListSocial();
  const { groups, saveToDefault } = useSavedPostGroups();
  const [activeProduct, setActiveProduct] = useState<Product>();

  const post = feedPosts.find((item) => item.id === params.id);

  if (!post) {
    return (
      <div className="py-20 text-center">
        {/* Stored posts arrive after hydration, so absence is only final once hydrated. */}
        <h1 className="font-headline text-3xl">{isHydrated ? "Post not found" : "Loading post…"}</h1>
        {isHydrated && (
          <Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
            <ArrowLeft className="h-4 w-4" />
            Back to Discover
          </Link>
        )}
      </div>
    );
  }

  if (!canViewPost(post, "me", state)) {
    return <div className="py-20 text-center"><h1 className="font-headline text-3xl">This post is private</h1><Link href="/" className="mt-5 inline-flex text-sm font-semibold text-accent">Back to Discover</Link></div>;
  }

  const author = post.authorId === "me" ? toSocialUser("me", state) : toSocialUser(post.authorId, state);

  return (
    <div className="pb-10">
      {/* Sticky, so leaving is always in reach on a phone. */}
      <div className="sticky top-0 z-30 -mx-4 mb-3 flex items-center gap-2 border-b border-divider/50 bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-midnight/70 transition-colors hover:text-midnight"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col overflow-hidden rounded-2xl border border-divider/50 bg-bg md:flex-row">
        <PostDetail
          post={post}
          author={author}
          liked={isLiked(post.id)}
          saved={groups.some((group) => group.postIds.includes(post.id))}
          onLike={() => toggleLike(post.id)}
          onSave={() => { saveToDefault(post.id); showToast("Saved to your posts"); }}
          onShare={() => showToast("Sharing coming soon")}
          onComment={(text) => {
            const me = toSocialUser("me", state);
            void socialService.updatePost(post.id, {
              comments: [...post.comments, { id: `c-${Date.now()}`, authorName: me.name, authorInitials: me.initials, authorColor: me.color, text, createdAt: Date.now() }],
            });
          }}
          onProductClick={(productId) => { const product = getProductById(productId); if (product) setActiveProduct(product); }}
        />
      </div>

      {activeProduct && (
        <ProductQuickView product={activeProduct} onClose={() => setActiveProduct(undefined)} onToast={showToast} />
      )}
      <ToastContainer />
    </div>
  );
}
