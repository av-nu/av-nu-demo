import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
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
  className,
  overlay = false,
}: {
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
  onShare: () => void;
  className?: string;
  overlay?: boolean;
}) {
  const stop = (handler: () => void) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    handler();
  };

  return (
    <div className={cn("flex items-center gap-5 px-3 py-3", overlay && "bg-gradient-to-t from-black/75 via-black/30 to-transparent pt-8", className)}>
      <button type="button" onClick={stop(onLike)} aria-label={liked ? "Unlike" : "Like"} className={cn("transition-colors", liked ? "text-pink" : overlay ? "text-white/90 hover:text-white" : "text-midnight/70 hover:text-pink")}>
        <Heart className={cn("h-6 w-6", liked && "fill-current")} />
      </button>
      <button type="button" onClick={stop(onComment)} aria-label="Comment" className={overlay ? "text-white/90 transition-colors hover:text-white" : "text-midnight/70 transition-colors hover:text-midnight"}>
        <MessageCircle className="h-6 w-6" />
      </button>
      <div className="flex-1" />
      <button type="button" onClick={stop(onSave)} aria-label={saved ? "Saved" : "Save"} className={cn("transition-colors", saved ? "text-accent" : overlay ? "text-white/90 hover:text-white" : "text-midnight/70 hover:text-accent")}>
        <Bookmark className={cn("h-6 w-6", saved && "fill-current")} />
      </button>
      <button type="button" onClick={stop(onShare)} aria-label="Share" className={overlay ? "text-white/90 transition-colors hover:text-white" : "text-midnight/70 transition-colors hover:text-midnight"}>
        <Send className="h-6 w-6" />
      </button>
    </div>
  );
}
