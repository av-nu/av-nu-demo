"use client";

import { Check, X } from "lucide-react";

import { useSocialGraph } from "@/hooks/useSocialGraph";
import { ConnectionRow } from "./ConnectionRow";

export function InvitationInbox({ onToast }: { onToast?: (m: string) => void }) {
  const { incomingRequests, acceptRequest, declineRequest } = useSocialGraph();

  if (incomingRequests.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-divider/60 px-4 py-8 text-center text-sm text-text/50">
        No pending invitations.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {incomingRequests.map((user) => (
        <ConnectionRow
          key={user.id}
          user={user}
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  acceptRequest(user.id);
                  onToast?.(`${user.name} added to your inner circle`);
                }}
                aria-label="Accept"
                className="flex h-9 items-center gap-1.5 rounded-full bg-burgundy px-3 text-sm font-medium text-white transition-colors hover:bg-burgundy/90"
              >
                <Check className="h-4 w-4" />
                Accept
              </button>
              <button
                type="button"
                onClick={() => {
                  declineRequest(user.id);
                  onToast?.("Invitation declined");
                }}
                aria-label="Decline"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-divider/60 text-text/60 transition-colors hover:bg-surface hover:text-pink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          }
        />
      ))}
    </div>
  );
}
