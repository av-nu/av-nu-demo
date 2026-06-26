"use client";

import Link from "next/link";
import { Heart, MessageCircle, UserPlus, Users, Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useNotifications, type NotificationWithActor } from "@/hooks/useNotifications";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import type { NotificationType } from "@/lib/social";
import { Avatar } from "./Avatar";

const ICON: Record<NotificationType, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  "inner-request": Users,
  "inner-accepted": Users,
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function NotificationItem({
  n,
  onToast,
}: {
  n: NotificationWithActor;
  onToast?: (m: string) => void;
}) {
  const { markRead } = useNotifications();
  const { acceptRequest, declineRequest } = useSocialGraph();
  const Icon = ICON[n.type];

  return (
    <div
      onClick={() => !n.read && markRead(n.id)}
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-3 transition-colors",
        n.read ? "bg-transparent" : "bg-accent/5",
      )}
    >
      <div className="relative">
        <Link href={`/u/${n.actorId}`}>
          <Avatar user={n.actor} size="md" />
        </Link>
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-bg">
          <Icon className={cn("h-3.5 w-3.5", n.type === "like" ? "text-pink" : "text-accent")} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-text">
          <Link href={`/u/${n.actorId}`} className="font-semibold hover:underline">
            {n.actor.name}
          </Link>{" "}
          <span className="text-text/70">{n.text}</span>
          {n.targetLabel && <span className="text-text/70"> · {n.targetLabel}</span>}
        </p>
        <p className="mt-0.5 text-xs text-text/40">{timeAgo(n.createdAt)}</p>

        {n.type === "inner-request" && (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                acceptRequest(n.actorId);
                markRead(n.id);
                onToast?.(`${n.actor.name} added to your inner circle`);
              }}
              className="flex h-8 items-center gap-1.5 rounded-full bg-burgundy px-3 text-xs font-medium text-white hover:bg-burgundy/90"
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                declineRequest(n.actorId);
                markRead(n.id);
                onToast?.("Invitation declined");
              }}
              className="flex h-8 items-center gap-1.5 rounded-full border border-divider/60 px-3 text-xs font-medium text-text/60 hover:bg-surface"
            >
              <X className="h-3.5 w-3.5" />
              Decline
            </button>
          </div>
        )}
      </div>

      {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-pink" />}
    </div>
  );
}

export function NotificationList({ onToast }: { onToast?: (m: string) => void }) {
  const { notifications, isHydrated } = useNotifications();

  if (isHydrated && notifications.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-divider/60 px-4 py-12 text-center text-sm text-text/50">
        You&apos;re all caught up — no notifications yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {notifications.map((n) => (
        <NotificationItem key={n.id} n={n} onToast={onToast} />
      ))}
    </div>
  );
}
