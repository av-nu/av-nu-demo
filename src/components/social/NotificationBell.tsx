"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell({ className }: { className?: string }) {
  const { unread, isHydrated } = useNotifications();

  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 text-text/70 backdrop-blur transition-colors hover:bg-surface hover:text-text",
        className,
      )}
    >
      <Bell className="h-5 w-5" />
      {isHydrated && unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pink px-1 text-[10px] font-semibold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
