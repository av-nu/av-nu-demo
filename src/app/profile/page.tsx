"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Pencil, Settings as SettingsIcon, Users, UserPlus, Sparkles } from "lucide-react";

import { useToast } from "@/components/ui/Toast";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { useSocialStore } from "@/hooks/useSocialStore";
import { socialService, toSocialUser } from "@/lib/social";
import { ProfileHeader } from "@/components/social/ProfileHeader";
import { ProfilePostGrid } from "@/components/social/ProfilePostGrid";
import { EditProfileDialog } from "@/components/social/EditProfileDialog";
import { AddPostMenu } from "@/components/social/AddPostMenu";
import { FindPeopleDialog } from "@/components/social/FindPeopleDialog";
import { InterestPicker } from "@/components/personalize/InterestPicker";

export default function ProfilePage() {
  const { state, isHydrated } = useSocialStore();
  const { counts, innerCircle } = useSocialGraph();
  const { showToast, ToastContainer } = useToast();

  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [findingPeople, setFindingPeople] = useState(false);

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
      className="space-y-8 pb-8"
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
          className="inline-flex items-center gap-1.5 rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-burgundy/90"
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

      {/* Personalize */}
      <section className="rounded-2xl border border-divider/50 bg-surface/30 p-5 sm:p-6">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-pink" />
          <h2 className="font-headline text-lg tracking-tight text-text">Personalize your experience</h2>
        </div>
        <p className="mb-4 text-sm text-text/50">
          Tell us what you&apos;re into and we&apos;ll tailor your feed.
        </p>
        <InterestPicker />
      </section>

      {/* Posts */}
      <section>
        <h2 className="mb-4 font-headline text-lg tracking-tight text-text">Your posts</h2>
        <ProfilePostGrid user={me} onToast={showToast} />
      </section>

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
