"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, UserMinus } from "lucide-react";

import { useToast } from "@/components/ui/Toast";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { getContactById } from "@/data/social";
import type { ProfileCounts } from "@/lib/social";
import { ProfileHeader } from "@/components/social/ProfileHeader";
import { ProfilePostGrid } from "@/components/social/ProfilePostGrid";
import { FollowButton } from "@/components/social/FollowButton";

// Deterministic, believable follower/following counts for a mock member so
// every profile reads like a real one. Inner-circle count reflects the live
// relationship with the current user.
function pseudoCounts(userId: string, isInner: boolean): ProfileCounts {
  let h = 0;
  for (let i = 0; i < userId.length; i += 1) h = (h * 31 + userId.charCodeAt(i)) % 9973;
  return {
    innerCircle: (h % 9) + 3 + (isInner ? 1 : 0),
    followers: (h % 280) + 40,
    following: (h % 160) + 25,
  };
}

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;

  const { isHydrated, getUser, getRelationship, removeFollower } = useSocialGraph();
  const { showToast, ToastContainer } = useToast();

  const contact = getContactById(userId);

  const counts = useMemo(
    () => pseudoCounts(userId, getRelationship(userId).inner === "connected"),
    [userId, getRelationship],
  );

  if (userId === "me") {
    if (typeof window !== "undefined") router.replace("/profile");
    return null;
  }

  if (!contact) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-text/50">This member could not be found.</p>
        <Link href="/connections" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
          Back to connections
        </Link>
      </div>
    );
  }

  if (!isHydrated) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-44 rounded-2xl bg-surface/50" />
        <div className="h-64 rounded-2xl bg-surface/50" />
      </div>
    );
  }

  const user = getUser(userId);
  const rel = getRelationship(userId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8 pb-8"
    >
      <Link
        href="/connections"
        className="inline-flex items-center gap-1 text-sm font-medium text-text/60 transition-colors hover:text-text"
      >
        <ChevronLeft className="h-4 w-4" />
        Connections
      </Link>

      <ProfileHeader user={user} counts={counts}>
        <FollowButton userId={userId} onToast={showToast} />
        {rel.followsMe && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Remove ${user.name} from your followers?`)) {
                removeFollower(userId);
                showToast(`Removed ${user.name}`);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-divider/60 px-4 py-2 text-sm font-medium text-text/60 transition-colors hover:bg-surface hover:text-pink"
          >
            <UserMinus className="h-4 w-4" />
            Remove follower
          </button>
        )}
      </ProfileHeader>

      <section>
        <h2 className="mb-4 font-headline text-lg tracking-tight text-text">Posts</h2>
        <ProfilePostGrid user={user} onToast={showToast} />
      </section>

      <ToastContainer />
    </motion.div>
  );
}
