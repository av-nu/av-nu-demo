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
            <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
              {safeIndex + 1}/{pages.length}
            </span>
          </>
        )}
      </div>

      {multiPage && (
        <div className="flex items-center justify-center gap-1 py-1">
          {safeIndex > 0 && (
            <button type="button" onClick={(event) => { event.stopPropagation(); go(safeIndex - 1); }} aria-label="Previous page" className="flex h-7 w-7 items-center justify-center rounded-full text-midnight/45 transition-colors hover:bg-surface hover:text-midnight">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="flex items-center gap-0.5">
            {pages.map((page, dotIndex) => (
              <button key={page.id} type="button" onClick={(event) => { event.stopPropagation(); go(dotIndex); }} aria-label={`Page ${dotIndex + 1} of ${pages.length}`} aria-current={dotIndex === safeIndex} className="flex h-7 w-6 items-center justify-center">
                <span className={cn("h-1.5 rounded-full transition-all", dotIndex === safeIndex ? "w-5 bg-midnight" : "w-1.5 bg-midnight/25")} />
              </button>
            ))}
          </div>
          {safeIndex < pages.length - 1 && (
            <button type="button" onClick={(event) => { event.stopPropagation(); go(safeIndex + 1); }} aria-label="Next page" className="flex h-7 w-7 items-center justify-center rounded-full text-midnight/45 transition-colors hover:bg-surface hover:text-midnight">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
