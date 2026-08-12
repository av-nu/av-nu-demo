"use client";

import { useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";

import { ProductQuickView } from "@/components/home/ProductQuickView";
import { PostCard } from "@/components/post/PostCard";
import { PostQuickView } from "@/components/post/PostQuickView";
import type { Product } from "@/data/mockProducts";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useListSocial } from "@/hooks/useListSocial";
import { useSavedPostGroups } from "@/hooks/useSavedPostGroups";
import { useSocialStore } from "@/hooks/useSocialStore";
import { getProductById } from "@/lib/data";
import { socialService, toSocialUser, type SocialUser } from "@/lib/social";

/**
 * A user's posts, rendered by the same card as the feed.
 *
 * Previously assembled video reviews and lists into its own grid, which meant a
 * post looked different here than in Discover. Everything now comes from the one
 * post stream, filtered to this author.
 */
export function ProfilePostGrid({
  user,
  onToast,
}: {
  user: SocialUser;
  onToast?: (message: string) => void;
}) {
  const isMe = Boolean(user.isCurrentUser);
  const feedPosts = useFeedPosts();
  const { state } = useSocialStore();
  const { isLiked, toggleLike } = useListSocial();
  const { groups, saveToDefault } = useSavedPostGroups();
  const [activePostId, setActivePostId] = useState<string>();
  const [activeProduct, setActiveProduct] = useState<Product>();

  const authorId = isMe ? "me" : user.id;
  const posts = useMemo(
    () => feedPosts.filter((post) => post.authorId === authorId),
    [authorId, feedPosts],
  );
  const activePost = activePostId ? posts.find((post) => post.id === activePostId) : undefined;

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-divider/60 px-4 py-10 text-center">
        <LayoutGrid className="mx-auto h-5 w-5 text-text/30" />
        <p className="mt-2 text-sm text-text/50">
          {isMe ? "Your posts will appear here once you publish one." : `${user.name} hasn't posted yet.`}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            author={post.authorId === "me" ? toSocialUser("me", state) : user}
            liked={isLiked(post.id)}
            saved={groups.some((group) => group.postIds.includes(post.id))}
            onLike={() => toggleLike(post.id)}
            onComment={() => setActivePostId(post.id)}
            onSave={() => { saveToDefault(post.id); onToast?.("Saved to your posts"); }}
            onShare={() => onToast?.("Sharing coming soon")}
            onOpen={() => setActivePostId(post.id)}
            onProductClick={(productId) => { const product = getProductById(productId); if (product) setActiveProduct(product); }}
            onDelete={isMe ? () => { void socialService.deletePost(post.id); onToast?.("Post deleted"); } : undefined}
          />
        ))}
      </div>

      {activePost && (
        <PostQuickView
          post={activePost}
          author={activePost.authorId === "me" ? toSocialUser("me", state) : user}
          liked={isLiked(activePost.id)}
          saved={groups.some((group) => group.postIds.includes(activePost.id))}
          onLike={() => toggleLike(activePost.id)}
          onSave={() => { saveToDefault(activePost.id); onToast?.("Saved to your posts"); }}
          onShare={() => onToast?.("Sharing coming soon")}
          onComment={(text) => {
            const me = toSocialUser("me", state);
            void socialService.updatePost(activePost.id, {
              comments: [...activePost.comments, { id: `c-${Date.now()}`, authorName: me.name, authorInitials: me.initials, authorColor: me.color, text, createdAt: Date.now() }],
            });
          }}
          onProductClick={(productId) => { const product = getProductById(productId); if (product) setActiveProduct(product); }}
          onClose={() => setActivePostId(undefined)}
        />
      )}
      {activeProduct && (
        <ProductQuickView product={activeProduct} onClose={() => setActiveProduct(undefined)} onToast={onToast ?? (() => undefined)} />
      )}
    </>
  );
}
