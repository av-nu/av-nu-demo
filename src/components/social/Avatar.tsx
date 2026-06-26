"use client";

import { cn } from "@/lib/utils";
import type { SocialUser } from "@/lib/social";

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-24 w-24 text-2xl",
} as const;

export function Avatar({
  user,
  size = "md",
  className,
}: {
  user: Pick<SocialUser, "initials" | "color" | "avatarUrl" | "name">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const base = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
    SIZES[size],
    className,
  );

  if (user.avatarUrl) {
    return (
      <span className={cn(base, "bg-surface")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
      </span>
    );
  }

  return <span className={cn(base, user.color)}>{user.initials}</span>;
}
