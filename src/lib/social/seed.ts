import { contacts, currentUser } from "@/data/social";
import type { Connection, Notification, SocialState } from "./types";

// Builds the initial social state from the seeded contact directory. Inner
// contacts start connected, followers start following the current user, and a
// couple of pending invitations seed the inbox so accept/decline is demoable.

function buildConnections(): Record<string, Connection> {
  const connections: Record<string, Connection> = {};

  for (const c of contacts) {
    if (c.circle === "inner") {
      connections[c.id] = {
        userId: c.id,
        iFollow: true,
        followsMe: true,
        inner: "connected",
        innerSince: Date.now() - 1000 * 60 * 60 * 24 * 14,
      };
    } else if (c.circle === "follower") {
      connections[c.id] = {
        userId: c.id,
        iFollow: false,
        followsMe: true,
        inner: "none",
      };
    } else {
      // suggested — no relationship yet
      connections[c.id] = {
        userId: c.id,
        iFollow: false,
        followsMe: false,
        inner: "none",
      };
    }
  }

  // Seed two incoming inner-circle invitations (people who want to add YOU).
  connections["f-noor"] = { ...connections["f-noor"], inner: "incoming" };
  connections["f-quin"] = { ...connections["f-quin"], inner: "incoming" };

  return connections;
}

function buildNotifications(): Notification[] {
  const now = Date.now();
  return [
    {
      id: "n-seed-1",
      type: "inner-request",
      actorId: "f-noor",
      text: "wants to join your inner circle",
      createdAt: now - 1000 * 60 * 25,
      read: false,
    },
    {
      id: "n-seed-2",
      type: "inner-request",
      actorId: "f-quin",
      text: "wants to join your inner circle",
      createdAt: now - 1000 * 60 * 60 * 3,
      read: false,
    },
    {
      id: "n-seed-3",
      type: "like",
      actorId: "c-mara",
      targetLabel: "Slow Sunday Reset",
      text: "liked your list",
      createdAt: now - 1000 * 60 * 60 * 5,
      read: false,
    },
    {
      id: "n-seed-4",
      type: "comment",
      actorId: "c-jonah",
      targetLabel: "Cozy Layers",
      text: "Saving this whole list!",
      createdAt: now - 1000 * 60 * 60 * 8,
      read: true,
    },
    {
      id: "n-seed-5",
      type: "follow",
      actorId: "f-theo",
      text: "started following you",
      createdAt: now - 1000 * 60 * 60 * 26,
      read: true,
    },
  ];
}

export function buildSeedState(): SocialState {
  return {
    profile: {
      name: currentUser.name === "You" ? "" : currentUser.name,
      handle: currentUser.handle,
      bio: "",
      avatarColor: "bg-burgundy",
      visibility: "public",
    },
    connections: buildConnections(),
    notifications: buildNotifications(),
    videoReviews: [],
  };
}
