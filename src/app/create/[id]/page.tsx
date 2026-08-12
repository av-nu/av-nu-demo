"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PostComposer } from "@/components/post/PostComposer";
import { useSavedLooks } from "@/hooks/useSavedLooks";
import { useSocialStore } from "@/hooks/useSocialStore";
import { savedLookToPost } from "@/lib/postMigration";

/**
 * Canonical edit route. Resolves a published post first, then falls back to a
 * saved look, which is migrated on read — the stored looks are left untouched, so
 * a bad conversion costs nothing.
 */
export default function EditPostPage({ params }: { params: { id: string } }) {
  const { state, isHydrated } = useSocialStore();
  const { looks, isHydrated: looksHydrated } = useSavedLooks();

  if (!isHydrated || !looksHydrated) {
    return <p className="py-20 text-center text-sm text-text/50">Loading your post…</p>;
  }

  const existing = state.posts.find((post) => post.id === params.id);
  const look = looks.find((item) => item.id === params.id);
  const initialPost = existing ?? (look ? savedLookToPost(look) : undefined);

  if (!initialPost) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-headline text-3xl">Post not found</h1>
        <Link href="/create" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
          <ArrowLeft className="h-4 w-4" />
          Start a new post
        </Link>
      </div>
    );
  }

  return <PostComposer initialPost={initialPost} />;
}
