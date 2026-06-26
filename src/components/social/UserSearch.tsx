"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { contacts } from "@/data/social";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { ConnectionRow } from "./ConnectionRow";
import { FollowButton } from "./FollowButton";

/**
 * Search the member directory by name or handle to follow people or invite
 * them to your inner circle. Relationship actions reflect live state via
 * FollowButton (Follow → Add to inner circle → Requested → Inner circle).
 */
export function UserSearch({ onToast }: { onToast?: (m: string) => void }) {
  const { getUser } = useSocialGraph();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    return contacts
      .filter((c) => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q))
      .map((c) => getUser(c.id));
  }, [q, getUser]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people by name or @handle…"
          className="h-11 w-full rounded-xl border border-divider/60 bg-surface/50 pl-10 pr-10 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-text/40 transition-colors hover:bg-surface hover:text-text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {q && (
        <div className="space-y-1">
          {results.length === 0 ? (
            <p className="rounded-xl border border-dashed border-divider/60 px-4 py-8 text-center text-sm text-text/50">
              No members match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.map((user) => (
              <ConnectionRow
                key={user.id}
                user={user}
                action={<FollowButton userId={user.id} onToast={onToast} />}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
