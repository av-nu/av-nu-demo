import type { ReactNode } from "react";

import { Avatar } from "@/components/social/Avatar";

export type SocialPostKind = "Guide" | "List" | "Moment";

const PILL_CLASS: Record<SocialPostKind, string> = {
  Guide: "bg-guide/90",
  List: "bg-list/90",
  Moment: "bg-moment/90",
};

/**
 * The author header shared by every social post format. Sits above the media so
 * moments, videos, guides, and lists all read the same way: avatar, display
 * name, then the category pill.
 */
export function SocialPostMeta({
  author,
  kind,
  trailing,
}: {
  author: { name: string; initials: string; color: string; avatarUrl?: string };
  kind: SocialPostKind;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Avatar user={author} size="sm" className="h-10 w-10 text-xs" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-midnight">{author.name}</p>
        <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-midnight ${PILL_CLASS[kind]}`}>{kind}</span>
      </div>
      {trailing}
    </div>
  );
}
