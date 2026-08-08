"use client";

import { ChevronLeft, ChevronRight, Copy, Plus, Star, Trash2 } from "lucide-react";

import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/post";

/**
 * Multi-page management. Thumbnails reuse EditorialRenderer so a page preview is
 * always the real document rather than a separate approximation.
 */
export function PostPageRail({
  post,
  activeIndex,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
  onSetCover,
}: {
  post: Post;
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onMove: (pageId: string, toIndex: number) => void;
  onSetCover: (index: number) => void;
}) {
  const activePage = post.pages[activeIndex];
  const canDelete = post.pages.length > 1;

  return (
    <div className="w-full min-w-0 shrink-0 border-t border-divider/60 bg-surface/40 px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-midnight/45">
          Page {activeIndex + 1} of {post.pages.length}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => activePage && onMove(activePage.id, activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Move page earlier"
            className="flex h-8 w-8 items-center justify-center rounded-full text-midnight/55 transition-colors hover:bg-bg disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => activePage && onMove(activePage.id, activeIndex + 1)}
            disabled={activeIndex === post.pages.length - 1}
            aria-label="Move page later"
            className="flex h-8 w-8 items-center justify-center rounded-full text-midnight/55 transition-colors hover:bg-bg disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onSetCover(activeIndex)}
            aria-label="Use this page as the cover"
            aria-pressed={post.coverPageIndex === activeIndex}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-bg",
              post.coverPageIndex === activeIndex ? "text-accent" : "text-midnight/55",
            )}
          >
            <Star className={cn("h-4 w-4", post.coverPageIndex === activeIndex && "fill-current")} />
          </button>
          <button
            type="button"
            onClick={() => activePage && onDuplicate(activePage.id)}
            aria-label="Duplicate page"
            className="flex h-8 w-8 items-center justify-center rounded-full text-midnight/55 transition-colors hover:bg-bg"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => activePage && onDelete(activePage.id)}
            disabled={!canDelete}
            aria-label="Delete page"
            className="flex h-8 w-8 items-center justify-center rounded-full text-midnight/55 transition-colors hover:bg-bg hover:text-pink disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ul className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {post.pages.map((page, index) => (
          <li key={page.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Edit page ${index + 1}`}
              aria-current={index === activeIndex}
              className={cn(
                "relative block w-16 overflow-hidden rounded-xl border-2 bg-bg transition-colors",
                index === activeIndex ? "border-accent" : "border-divider/60 hover:border-midnight/30",
              )}
            >
              {/* Non-interactive preview of the real page document. */}
              <span className="pointer-events-none block">
                <EditorialRenderer design={page.design} />
              </span>
              {post.coverPageIndex === index && (
                <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                  <Star className="h-2.5 w-2.5 fill-current" />
                </span>
              )}
            </button>
          </li>
        ))}
        <li className="shrink-0">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add page"
            className="flex h-20 w-16 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-divider text-[10px] font-semibold text-midnight/50 transition-colors hover:border-accent/50 hover:text-midnight"
          >
            <Plus className="h-4 w-4" />
            Page
          </button>
        </li>
      </ul>
    </div>
  );
}
