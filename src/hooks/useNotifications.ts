"use client";

import { useCallback, useMemo } from "react";

import { socialService, toSocialUser, unreadCount } from "@/lib/social";
import type { Notification, SocialUser } from "@/lib/social";
import { useSocialStore } from "./useSocialStore";

export type NotificationWithActor = Notification & { actor: SocialUser };

/**
 * The in-app notification center: likes / comments on your posts, follow
 * activity, and inner-circle invitations.
 */
export function useNotifications() {
  const { state, isHydrated } = useSocialStore();

  const notifications = useMemo<NotificationWithActor[]>(
    () =>
      [...state.notifications]
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((n) => ({ ...n, actor: toSocialUser(n.actorId, state) })),
    [state],
  );

  const unread = useMemo(() => unreadCount(state), [state]);

  const markRead = useCallback((id: string) => socialService.markRead(id), []);
  const markAllRead = useCallback(() => socialService.markAllRead(), []);

  return { isHydrated, notifications, unread, markRead, markAllRead };
}
