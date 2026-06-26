"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserMinus, UserPlus, ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { ConnectionRow } from "@/components/social/ConnectionRow";
import { InvitationInbox } from "@/components/social/InvitationInbox";
import { UserSearch } from "@/components/social/UserSearch";

type Tab = "inner" | "followers" | "following" | "invites";

export default function ConnectionsPage() {
  const {
    isHydrated,
    innerCircle,
    followers,
    following,
    suggestions,
    incomingRequests,
    removeConnection,
    removeFollower,
    follow,
    unfollow,
  } = useSocialGraph();
  const { showToast, ToastContainer } = useToast();

  const [tab, setTab] = useState<Tab>("inner");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "inner", label: "Inner circle", count: innerCircle.length },
    { id: "followers", label: "Followers", count: followers.length },
    { id: "following", label: "Following", count: following.length },
    { id: "invites", label: "Invitations", count: incomingRequests.length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto max-w-2xl space-y-6 pb-8"
    >
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm font-medium text-text/60 transition-colors hover:text-text"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <div>
        <h1 className="font-headline text-3xl tracking-tight text-text">Connections</h1>
        <p className="mt-1 text-sm text-text/50">Manage your inner circle, followers, and invitations</p>
      </div>

      {/* Find & add people */}
      <section className="rounded-2xl border border-divider/50 bg-surface/30 p-4">
        <h2 className="mb-3 font-headline text-base tracking-tight text-text">Find people</h2>
        <UserSearch onToast={showToast} />
      </section>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-divider/60 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "text-text" : "text-text/50 hover:text-text/80",
            )}
          >
            {t.label}
            {t.count > 0 && <span className="ml-1.5 text-xs text-text/40">{t.count}</span>}
            {tab === t.id && (
              <motion.div layoutId="conn-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-burgundy" />
            )}
          </button>
        ))}
      </div>

      {!isHydrated ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-surface/50" />
          ))}
        </div>
      ) : (
        <div>
          {tab === "inner" && (
            <List
              empty="No one in your inner circle yet."
              users={innerCircle}
              renderAction={(id, name) => (
                <RemoveButton
                  label="Remove"
                  onClick={() => {
                    if (window.confirm(`Remove ${name} from your inner circle?`)) {
                      removeConnection(id);
                      showToast(`Removed ${name} from your inner circle`);
                    }
                  }}
                />
              )}
            />
          )}

          {tab === "followers" && (
            <List
              empty="You don't have any followers yet."
              users={followers}
              renderAction={(id, name) => (
                <RemoveButton
                  label="Remove"
                  onClick={() => {
                    if (window.confirm(`Remove ${name} from your followers?`)) {
                      removeFollower(id);
                      showToast(`Removed ${name}`);
                    }
                  }}
                />
              )}
            />
          )}

          {tab === "following" && (
            <List
              empty="You're not following anyone yet."
              users={following}
              renderAction={(id, name) => (
                <RemoveButton
                  label="Unfollow"
                  onClick={() => {
                    unfollow(id);
                    showToast(`Unfollowed ${name}`);
                  }}
                />
              )}
            />
          )}

          {tab === "invites" && (
            <div className="space-y-8">
              <div>
                <h2 className="mb-3 font-headline text-base tracking-tight text-text">Pending invitations</h2>
                <InvitationInbox onToast={showToast} />
              </div>

              {suggestions.length > 0 && (
                <div>
                  <h2 className="mb-3 font-headline text-base tracking-tight text-text">Suggested for you</h2>
                  <div className="space-y-1">
                    {suggestions.map((user) => (
                      <ConnectionRow
                        key={user.id}
                        user={user}
                        action={
                          <button
                            type="button"
                            onClick={() => {
                              follow(user.id);
                              showToast(`Following ${user.name}`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-burgundy/90"
                          >
                            <UserPlus className="h-4 w-4" />
                            Follow
                          </button>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ToastContainer />
    </motion.div>
  );
}

function List({
  users,
  empty,
  renderAction,
}: {
  users: { id: string; name: string; handle: string; initials: string; color: string; avatarUrl?: string }[];
  empty: string;
  renderAction: (id: string, name: string) => React.ReactNode;
}) {
  if (users.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-divider/60 px-4 py-8 text-center text-sm text-text/50">
        {empty}
      </p>
    );
  }
  return (
    <div className="space-y-1">
      {users.map((user) => (
        <ConnectionRow key={user.id} user={user} action={renderAction(user.id, user.name)} />
      ))}
    </div>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-divider/60 px-4 py-2 text-sm font-medium text-text/60 transition-colors hover:bg-surface hover:text-pink"
    >
      <UserMinus className="h-4 w-4" />
      {label}
    </button>
  );
}
