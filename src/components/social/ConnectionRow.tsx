"use client";

import { type ReactNode } from "react";
import Link from "next/link";

import type { SocialUser } from "@/lib/social";
import { Avatar } from "./Avatar";

export function ConnectionRow({
  user,
  action,
}: {
  user: SocialUser;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface/50">
      <Link href={`/u/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar user={user} size="md" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-text">{user.name}</span>
          <span className="block truncate text-xs text-text/50">@{user.handle}</span>
        </span>
      </Link>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
