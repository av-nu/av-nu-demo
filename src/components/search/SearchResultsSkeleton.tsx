"use client";

import { memo } from "react";

interface SearchResultsSkeletonProps {
  count?: number;
}

export const SearchResultsSkeleton = memo(function SearchResultsSkeleton({
  count = 8,
}: SearchResultsSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-square animate-pulse rounded-xl bg-surface" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-surface" />
            <div className="h-4 w-full animate-pulse rounded bg-surface" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
            <div className="mt-1 h-4 w-20 animate-pulse rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
});
