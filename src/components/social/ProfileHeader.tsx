"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { Globe, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MyProfile, SocialUser } from "@/lib/social";
import type { ProfileCounts } from "@/lib/social";
import { Avatar } from "./Avatar";

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <span className="flex flex-col items-center">
      <span className="text-lg font-semibold text-text">{value}</span>
      <span className="text-xs text-text/50">{label}</span>
    </span>
  );
  return href ? (
    <Link href={href} className="rounded-lg px-2 py-1 transition-colors hover:bg-surface/60">
      {inner}
    </Link>
  ) : (
    <div className="px-2 py-1">{inner}</div>
  );
}

export function ProfileHeader({
  user,
  counts,
  isMe,
  visibility,
  onToggleVisibility,
  children,
}: {
  user: SocialUser;
  counts: ProfileCounts;
  isMe?: boolean;
  visibility?: MyProfile["visibility"];
  onToggleVisibility?: () => void;
  children?: ReactNode;
}) {
  const connectionsHref = isMe ? "/connections" : undefined;

  return (
    <section className="rounded-2xl border border-divider/50 bg-surface/30 p-5 sm:p-6">
      <div className="flex items-start gap-4 sm:gap-6">
        <Avatar user={user} size="xl" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-headline text-2xl tracking-tight text-text">{user.name}</h1>
            {isMe && visibility && (
              <button
                type="button"
                onClick={onToggleVisibility}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  visibility === "public"
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-divider/60 text-text/60 hover:bg-surface",
                )}
                title="Tap to change who can see your profile"
              >
                {visibility === "public" ? (
                  <>
                    <Globe className="h-3.5 w-3.5" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" /> Inner circle
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-sm text-text/50">@{user.handle}</p>

          {/* Counts */}
          <div className="mt-3 flex items-center gap-4">
            <Stat label="Inner circle" value={counts.innerCircle} href={connectionsHref} />
            <Stat label="Followers" value={counts.followers} href={connectionsHref} />
            <Stat label="Following" value={counts.following} href={connectionsHref} />
          </div>
        </div>
      </div>

      {user.bio && <p className="mt-4 text-sm leading-relaxed text-text/80">{user.bio}</p>}

      {children && <div className="mt-5 flex flex-wrap items-center gap-2">{children}</div>}
    </section>
  );
}
