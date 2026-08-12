"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Pencil, Settings as SettingsIcon, Users, UserPlus, Store } from "lucide-react";

import { useToast } from "@/components/ui/Toast";
import { mockBrands } from "@/data/mockBrands";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { useSocialStore } from "@/hooks/useSocialStore";
import { socialService, toSocialUser } from "@/lib/social";
import { PostCard } from "@/components/post/PostCard";
import { PostQuickView } from "@/components/post/PostQuickView";
import { useListSocial } from "@/hooks/useListSocial";
import type { Post } from "@/lib/post";
import { ProfileHeader } from "@/components/social/ProfileHeader";
import { ProfilePostGrid, type ProfilePostFilter } from "@/components/social/ProfilePostGrid";
import { EditProfileDialog } from "@/components/social/EditProfileDialog";
import { AddPostMenu } from "@/components/social/AddPostMenu";
import { FindPeopleDialog } from "@/components/social/FindPeopleDialog";
import { SavedLooksSection } from "@/components/social/SavedLooksSection";

export default function ProfilePage() {
  const { state, isHydrated } = useSocialStore();
  const { counts, innerCircle, followedBrands, unfollowBrand } = useSocialGraph();
  const { showToast, ToastContainer } = useToast();

  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [findingPeople, setFindingPeople] = useState(false);
  const [postFilter, setPostFilter] = useState<ProfilePostFilter>("all");
  const [activePost, setActivePost] = useState<Post>();
  const { isLiked, toggleLike } = useListSocial();
  const myPosts = useMemo(() => state.posts.filter((post) => post.authorId === "me").sort((a, b) => b.createdAt - a.createdAt), [state.posts]);

  if (!isHydrated) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-44 rounded-2xl bg-surface/50" />
        <div className="h-64 rounded-2xl bg-surface/50" />
      </div>
    );
  }

  const me = toSocialUser("me", state);
  const profile = state.profile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`space-y-8 rounded-3xl pb-8 ${profile.themeColor ?? "bg-pink/5"}`}
    >
      <ProfileHeader
        user={me}
        counts={counts}
        isMe
        visibility={profile.visibility}
        onToggleVisibility={() => {
          const next = profile.visibility === "public" ? "inner-circle" : "public";
          socialService.updateProfile({ visibility: next });
          showToast(next === "public" ? "Profile is now public" : "Profile limited to inner circle");
        }}
      >
        <button
          type="button"
          onClick={() => setUploading(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy/90"
        >
          <Plus className="h-4 w-4" />
          Add post
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-divider/60 px-4 py-2 text-sm font-medium text-text/70 transition-colors hover:bg-surface"
        >
          <Pencil className="h-4 w-4" />
          Edit profile
        </button>
        <Link
          href="/profile/settings"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-divider/60 text-text/60 transition-colors hover:bg-surface"
          aria-label="Settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </Link>
      </ProfileHeader>

      {/* Inner circle quick browse */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <h2 className="flex items-center gap-2 font-headline text-lg tracking-tight text-text">
              <Users className="h-4 w-4 text-accent" />
              Your inner circle
            </h2>
            <button
              type="button"
              onClick={() => setFindingPeople(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              <UserPlus className="h-4 w-4" />
              Find people
            </button>
          </div>
          <Link href="/connections" className="shrink-0 text-sm font-medium text-accent hover:underline">
            See all
          </Link>
        </div>
        {innerCircle.length === 0 ? (
          <p className="rounded-xl border border-dashed border-divider/60 px-4 py-6 text-center text-sm text-text/50">
            No one in your inner circle yet.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {innerCircle.map((user) => (
              <Link
                key={user.id}
                href={`/u/${user.id}`}
                className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
              >
                <span
                  className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-white ring-2 ring-accent/30 ring-offset-2 ring-offset-bg ${user.color}`}
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.initials
                  )}
                </span>
                <span className="w-full truncate text-xs text-text/70">{user.name.split(" ")[0]}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <SavedLooksSection />

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-headline text-lg tracking-tight text-text"><Store className="h-4 w-4 text-accent" />My favorite brands</h2>
          <Link href="/window-shopping" className="text-sm font-medium text-accent hover:underline">Browse brands</Link>
        </div>
        {followedBrands.length === 0 ? <p className="rounded-xl border border-dashed border-divider/60 px-4 py-6 text-center text-sm text-text/50">Follow brands from Discover or Brands to see them here.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{followedBrands.map((brandId) => { const brand = mockBrands.find((item) => item.id === brandId); if (!brand) return null; return <div key={brand.id} className="rounded-2xl border border-divider/60 bg-surface/30 p-3"><Link href={`/brand/${brand.id}`} className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1"><Image src={brand.logoMark} alt={brand.name} width={32} height={32} className="h-full w-full object-contain" /></span><span className="truncate text-sm font-semibold text-text">{brand.name}</span></Link><button type="button" onClick={() => unfollowBrand(brand.id)} className="mt-3 text-xs font-medium text-text/50 hover:text-text">Following · remove</button></div>; })}</div>}
      </section>

      {/* Posts */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-headline text-lg tracking-tight text-text">Your posts</h2>
          <div className="flex rounded-full border border-divider/60 bg-surface/40 p-1">
            {(["all", "moment", "guide", "list"] as ProfilePostFilter[]).map((filter) => <button key={filter} type="button" onClick={() => setPostFilter(filter)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${postFilter === filter ? "bg-text text-bg" : "text-text/50 hover:text-text"}`}>{filter === "all" ? "All" : filter === "moment" ? "Moments" : `${filter}s`}</button>)}
          </div>
        </div>
        {myPosts.length > 0 && (
          // Posts made in the composer, newest first, ahead of legacy content.
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={me}
                liked={isLiked(post.id)}
                saved={false}
                onLike={() => toggleLike(post.id)}
                onComment={() => undefined}
                onSave={() => undefined}
                onShare={() => showToast("Sharing coming soon")}
                onOpen={() => setActivePost(post)}
                onDelete={() => { void socialService.deletePost(post.id); showToast("Post deleted"); }}
              />
            ))}
          </div>
        )}
        <ProfilePostGrid user={me} onToast={showToast} filter={postFilter} />
      </section>

      {activePost && (
        <PostQuickView
          post={activePost}
          author={me}
          liked={isLiked(activePost.id)}
          saved={false}
          onLike={() => toggleLike(activePost.id)}
          onSave={() => undefined}
          onShare={() => showToast("Sharing coming soon")}
          onClose={() => setActivePost(undefined)}
        />
      )}
      {editing && (
        <EditProfileDialog profile={profile} onClose={() => setEditing(false)} onToast={showToast} />
      )}
      {uploading && (
        <AddPostMenu onClose={() => setUploading(false)} onToast={showToast} />
      )}
      {findingPeople && (
        <FindPeopleDialog onClose={() => setFindingPeople(false)} onToast={showToast} />
      )}
      <ToastContainer />
    </motion.div>
  );
}
