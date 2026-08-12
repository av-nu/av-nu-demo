"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import { PostPins } from "@/components/post/PostPins";
import { cn } from "@/lib/utils";
import type { PostPage } from "@/lib/post";

/** Horizontal travel, in px, that counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 44;

/**
 * The artwork for a multi-page post, with swipe, edge arrows, and a page counter.
 *
 * Shared by the feed card and the opened post so paging behaves identically in
 * both; dots alone were too small a target to be the only way through a post.
 */
export function PostPager({
  pages,
  index,
  onIndex,
  onTap,
  staticMedia = false,
  showPins = false,
}: {
  pages: PostPage[];
  index: number;
  onIndex: (index: number) => void;
  onTap?: () => void;
  staticMedia?: boolean;
  showPins?: boolean;
}) {
  const start = useRef<{ x: number; y: number }>();
  const swiped = useRef(false);
  const safeIndex = Math.min(Math.max(index, 0), pages.length - 1);
  const current = pages[safeIndex];
  const multiPage = pages.length > 1;

  const go = (next: number) => onIndex(Math.min(Math.max(next, 0), pages.length - 1));

  const handleDown = (event: ReactPointerEvent) => {
    start.current = { x: event.clientX, y: event.clientY };
    swiped.current = false;
  };

  const handleUp = (event: ReactPointerEvent) => {
    const from = start.current;
    start.current = undefined;
    if (!from || !multiPage) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    // Ignore mostly-vertical travel so paging does not fight the page scroll.
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    swiped.current = true;
    go(safeIndex + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="group/pager">
      <div
        className="relative touch-pan-y select-none"
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerCancel={() => { start.current = undefined; }}
        onClick={() => {
          // A swipe ends in a click; opening the post here would be wrong.
          if (swiped.current) {
            swiped.current = false;
            return;
          }
          onTap?.();
        }}
        role={onTap ? "button" : undefined}
        tabIndex={onTap ? 0 : undefined}
        aria-label={onTap ? "Open post" : undefined}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") go(safeIndex - 1);
          if (event.key === "ArrowRight") go(safeIndex + 1);
          if (onTap && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onTap();
          }
        }}
      >
        <EditorialRenderer design={current.design} staticMedia={staticMedia} />
        {showPins && <PostPins pins={current.pins} />}

        {multiPage && (
          <>
            {safeIndex > 0 && (
              <EdgeArrow side="left" onClick={() => go(safeIndex - 1)} />
            )}
            {safeIndex < pages.length - 1 && (
              <EdgeArrow side="right" onClick={() => go(safeIndex + 1)} />
            )}
            <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
              {safeIndex + 1}/{pages.length}
            </span>
          </>
        )}
      </div>

      {multiPage && (
        // Generous hit areas around each dot: the dots themselves are too small
        // to be a reliable target on a touchscreen.
        <div className="flex items-center justify-center gap-0.5 py-1">
          {pages.map((page, dotIndex) => (
            <button
              key={page.id}
              type="button"
              onClick={() => go(dotIndex)}
              aria-label={`Page ${dotIndex + 1} of ${pages.length}`}
              aria-current={dotIndex === safeIndex}
              className="flex h-7 w-6 items-center justify-center"
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-all",
                  dotIndex === safeIndex ? "w-5 bg-midnight" : "w-2 bg-midnight/25",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EdgeArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "Previous page" : "Next page"}
      className={cn(
        "absolute top-1/2 z-[160] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-midnight shadow-md backdrop-blur transition-opacity",
        // Visible rather than hover-revealed: an arrow nobody knows is there is
        // no better than the dots it replaces.
        "opacity-80 hover:opacity-100 md:opacity-70",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
