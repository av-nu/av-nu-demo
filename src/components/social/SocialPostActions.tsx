"use client";

import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { useRequireAuth } from "@/components/auth/AccountInvitationDialog";
import { cn } from "@/lib/utils";

/**
 * The single engagement row shared by every social post format (moment, video,
 * guide, list). Icon-only so all four actions always fit: like + comment on the
 * left, save + share on the right.
 */
export function SocialPostActions({
  liked,
  saved,
  onLike,
  onComment,
  onSave,
  onShare,
  likeCount = 0,
  commentCount = 0,
  className,
  overlay = false,
}: {
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
  onShare: () => void;
  likeCount?: number;
  commentCount?: number;
  className?: string;
  overlay?: boolean;
}) {
  const { requireAuth, invitation } = useRequireAuth();
  const stop = (action: string, handler: () => void) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    requireAuth(action, handler);
  };
  const iconClass = overlay ? "text-white/90 transition-colors hover:text-white" : "text-midnight/70 transition-colors hover:text-midnight";
  const countClass = overlay ? "text-white/90" : "text-midnight/65";

  return (
    <>
      <div className={cn("flex min-w-0 items-center justify-between gap-2 px-3 py-3", overlay && "bg-gradient-to-t from-black/75 via-black/30 to-transparent pt-8", className)}>
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={stop("like this post", onLike)} aria-label={liked ? "Unlike" : "Like"} className={cn("inline-flex shrink-0 items-center gap-1.5 transition-colors", liked ? "text-pink" : iconClass)}>
            <Heart className={cn("h-6 w-6", liked && "fill-current")} />
            <span className={cn("text-xs font-semibold tabular-nums", countClass)}>{likeCount.toLocaleString()}</span>
          </button>
          <button type="button" onClick={stop("comment on this post", onComment)} aria-label="Comment" className={cn("inline-flex shrink-0 items-center gap-1.5", iconClass)}>
            <MessageCircle className="h-6 w-6" />
            <span className={cn("text-xs font-semibold tabular-nums", countClass)}>{commentCount.toLocaleString()}</span>
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={stop(saved ? "edit this saved post" : "save this post", onSave)} aria-label={saved ? "Saved" : "Save"} className={cn("shrink-0 transition-colors", saved ? "text-accent" : iconClass)}>
            <Bookmark className={cn("h-6 w-6", saved && "fill-current")} />
          </button>
          <button type="button" onClick={stop("share this post", onShare)} aria-label="Share" className={cn("shrink-0", iconClass)}>
            <Send className="h-6 w-6" />
          </button>
        </div>
      </div>
      {invitation}
    </>
  );
}
