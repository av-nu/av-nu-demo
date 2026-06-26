"use client";

import { Check, Clock, UserPlus, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSocialGraph } from "@/hooks/useSocialGraph";

/**
 * Relationship CTA for another user. Reflects and mutates the full follow /
 * inner-circle state machine.
 */
export function FollowButton({
  userId,
  onToast,
  className,
}: {
  userId: string;
  onToast?: (message: string) => void;
  className?: string;
}) {
  const {
    getRelationship,
    follow,
    unfollow,
    requestInnerCircle,
    cancelInnerRequest,
    removeConnection,
    getUser,
  } = useSocialGraph();

  const rel = getRelationship(userId);
  const name = getUser(userId).name;

  const pill =
    "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors";

  // Connected — show membership, allow removal.
  if (rel.inner === "connected") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Remove ${name} from your inner circle?`)) {
              removeConnection(userId);
              onToast?.(`Removed ${name} from your inner circle`);
            }
          }}
          className={cn(pill, "bg-accent/15 text-accent hover:bg-accent/25")}
        >
          <Users className="h-4 w-4" />
          Inner circle
        </button>
      </div>
    );
  }

  // Outgoing inner-circle request pending.
  if (rel.inner === "outgoing") {
    return (
      <button
        type="button"
        onClick={() => {
          cancelInnerRequest(userId);
          onToast?.("Request cancelled");
        }}
        className={cn(pill, "border border-divider/60 text-text/70 hover:bg-surface", className)}
      >
        <Clock className="h-4 w-4" />
        Requested
      </button>
    );
  }

  // Following (public) — offer to request inner circle.
  if (rel.iFollow) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          type="button"
          onClick={() => {
            unfollow(userId);
            onToast?.(`Unfollowed ${name}`);
          }}
          className={cn(pill, "border border-divider/60 text-text/70 hover:bg-surface")}
        >
          <Check className="h-4 w-4" />
          Following
        </button>
        <button
          type="button"
          onClick={() => {
            requestInnerCircle(userId);
            onToast?.(`Inner-circle request sent to ${name}`);
          }}
          className={cn(pill, "bg-burgundy text-white hover:bg-burgundy/90")}
        >
          <UserPlus className="h-4 w-4" />
          Add to inner circle
        </button>
      </div>
    );
  }

  // No relationship — follow.
  return (
    <button
      type="button"
      onClick={() => {
        follow(userId);
        onToast?.(`Following ${name}`);
      }}
      className={cn(pill, "bg-burgundy text-white hover:bg-burgundy/90", className)}
    >
      <UserPlus className="h-4 w-4" />
      Follow
    </button>
  );
}
