"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ImagePlus, LayoutTemplate, Minus, Redo2, Undo2, X, ZoomIn } from "lucide-react";

import { useCanvasDocument } from "@/components/canvas/useCanvasDocument";
import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import { PostPageRail } from "@/components/post/PostPageRail";
import { PostToolbar, type PostTool } from "@/components/post/PostToolbar";
import { useToast } from "@/components/ui/Toast";
import { mediaStore } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { EditorialFormat, EditorialPageDesign } from "@/lib/editorial";
import {
  addPostPage,
  createBlankPage,
  createMediaPage,
  duplicatePostPage,
  normalizePost,
  removePostPage,
  reorderPostPage,
  updatePostPageDesign,
  type Post,
} from "@/lib/post";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.4;
const ZOOM_STEP = 0.1;

function emptyPost(format: EditorialFormat = "portrait"): Post {
  return normalizePost({
    id: "draft",
    authorId: "me",
    pages: [createBlankPage(format)],
    format,
    coverPageIndex: 0,
    productIds: [],
    caption: "",
    visibility: "public",
    likes: 0,
    comments: [],
    createdAt: Date.now(),
  });
}

/**
 * The unified post editor shell.
 *
 * Mobile-first: the canvas takes the available height, the tool rail sits at the
 * bottom within thumb reach, and the canvas is `touch-none` so element drags do
 * not fight page scroll — zoom is explicit instead of pinch.
 *
 * Phase 2 delivers the shell, page management, and the shared editing core.
 * The tool panels themselves land in Phase 3.
 */
export function PostComposer({ initialPost }: { initialPost?: Post }) {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  const [post, setPost] = useState<Post>(() => initialPost ?? emptyPost());
  const [started, setStarted] = useState(Boolean(initialPost));
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<PostTool>();
  const [zoom, setZoom] = useState(1);
  const uploadRef = useRef<HTMLInputElement>(null);

  const activePage = post.pages[Math.min(activeIndex, post.pages.length - 1)];

  // The composer owns the Post; the shared hook owns the active page's design.
  const handleDesignChange = useCallback((design: EditorialPageDesign) => {
    setPost((current) => {
      const page = current.pages[Math.min(activeIndex, current.pages.length - 1)];
      if (!page) return current;
      return updatePostPageDesign(current, page.id, design);
    });
  }, [activeIndex]);

  const canvas = useCanvasDocument({ design: activePage.design, onChange: handleDesignChange });

  const startCollage = () => {
    setPost(emptyPost());
    setActiveIndex(0);
    setStarted(true);
    setActiveTool("layouts");
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    const kind: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
    try {
      // Media goes to the MediaStore; the design only ever holds a ref.
      const ref = await mediaStore.put(file, kind);
      const page = createMediaPage(ref, kind, post.format);
      // Derive the landing page index from the updater's own result so it cannot
      // drift from a stale closure.
      setPost((current) => {
        // A fresh, untouched draft adopts the upload as its first page rather
        // than leaving an empty page in front of it.
        const isPristine = current.pages.length === 1 && current.pages[0].design.elements.length === 0;
        const next = isPristine
          ? normalizePost({ ...current, pages: [page] })
          : addPostPage(current, page);
        setActiveIndex(Math.max(0, next.pages.findIndex((item) => item.id === page.id)));
        return next;
      });
      setStarted(true);
      setActiveTool(undefined);
    } catch {
      showToast("That file could not be added");
    } finally {
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const pageActions = useMemo(() => ({
    add: () => {
      setPost((current) => addPostPage(current));
      setActiveIndex(post.pages.length);
    },
    duplicate: (pageId: string) => setPost((current) => duplicatePostPage(current, pageId)),
    delete: (pageId: string) => {
      setPost((current) => {
        const next = removePostPage(current, pageId);
        setActiveIndex((index) => Math.min(index, next.pages.length - 1));
        return next;
      });
    },
    move: (pageId: string, toIndex: number) => {
      setPost((current) => {
        const next = reorderPostPage(current, pageId, toIndex);
        setActiveIndex(Math.max(0, next.pages.findIndex((page) => page.id === pageId)));
        return next;
      });
    },
    setCover: (index: number) => setPost((current) => normalizePost({ ...current, coverPageIndex: index })),
  }), [post.pages.length]);

  const close = () => router.push("/");

  return (
    // Sized to the viewport rather than fixed-positioned: the composer route
    // opts out of the shopper shell, so it owns the whole screen.
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-bg">
      {/* Top bar */}
      <header className="flex w-full min-w-0 shrink-0 items-center gap-2 border-b border-divider/60 px-3 py-2.5">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full text-midnight/60 transition-colors hover:bg-surface hover:text-midnight"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-midnight">New post</p>
        <button
          type="button"
          onClick={canvas.undo}
          disabled={!canvas.canUndo}
          aria-label="Undo"
          className="flex h-9 w-9 items-center justify-center rounded-full text-midnight/60 transition-colors hover:bg-surface disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={canvas.redo}
          disabled={!canvas.canRedo}
          aria-label="Redo"
          className="flex h-9 w-9 items-center justify-center rounded-full text-midnight/60 transition-colors hover:bg-surface disabled:opacity-30"
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={!started}
          onClick={() => showToast("Publishing arrives in a later phase")}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy/90 disabled:opacity-40"
        >
          Next
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Canvas stage — the dotted grid reads as "workspace" rather than page. */}
      <div
        className="relative min-h-0 w-full min-w-0 flex-1 overflow-auto"
        style={{
          backgroundColor: "rgb(var(--surface-rgb))",
          backgroundImage: "radial-gradient(rgba(3,1,37,0.14) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="flex min-h-full min-w-0 items-center justify-center p-4">
          {started ? (
            <div
              className="w-full touch-none"
              style={{ maxWidth: `min(100%, ${420 * zoom}px)` }}
            >
              <EditorialRenderer
                design={canvas.design}
                selectedId={canvas.selectedId}
                interactive
                guides={canvas.snapGuides}
                canvasRef={canvas.canvasRef}
                onElementPointerDown={(event, elementId) => canvas.startInteraction(event, elementId, "drag")}
                onElementSelect={canvas.setSelectedId}
                onHandlePointerDown={(event, elementId, handle) => canvas.startInteraction(event, elementId, handle)}
                onCanvasPointerDown={() => canvas.setSelectedId(undefined)}
              />
            </div>
          ) : (
            <StartChoice
              onUpload={() => uploadRef.current?.click()}
              onCollage={startCollage}
            />
          )}
        </div>

        {started && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-divider/70 bg-bg/95 px-1.5 py-1 shadow-sm backdrop-blur">
              <button
                type="button"
                onClick={() => setZoom((value) => Math.max(ZOOM_MIN, Number((value - ZOOM_STEP).toFixed(2))))}
                disabled={zoom <= ZOOM_MIN}
                aria-label="Zoom out"
                className="flex h-8 w-8 items-center justify-center rounded-full text-midnight/60 transition-colors hover:bg-surface disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-10 text-center text-[10px] font-semibold text-midnight/60">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((value) => Math.min(ZOOM_MAX, Number((value + ZOOM_STEP).toFixed(2))))}
                disabled={zoom >= ZOOM_MAX}
                aria-label="Zoom in"
                className="flex h-8 w-8 items-center justify-center rounded-full text-midnight/60 transition-colors hover:bg-surface disabled:opacity-30"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {started && activeTool === "pages" && (
        <PostPageRail
          post={post}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          onAdd={pageActions.add}
          onDuplicate={pageActions.duplicate}
          onDelete={pageActions.delete}
          onMove={pageActions.move}
          onSetCover={pageActions.setCover}
        />
      )}

      {started && activeTool && activeTool !== "pages" && (
        <div className="w-full min-w-0 shrink-0 border-t border-divider/60 bg-surface/40 px-4 py-4 text-center text-xs text-midnight/55">
          The {activeTool} tool arrives in the next phase.
        </div>
      )}

      <PostToolbar
        active={activeTool}
        disabled={!started}
        onSelect={(tool) => {
          if (tool === "photos") {
            uploadRef.current?.click();
            return;
          }
          setActiveTool((current) => (current === tool ? undefined : tool));
        }}
      />

      <input
        ref={uploadRef}
        type="file"
        accept="image/*,video/*"
        onChange={(event) => handleUpload(event.target.files?.[0])}
        className="sr-only"
      />
      <ToastContainer />
    </div>
  );
}

function StartChoice({ onUpload, onCollage }: { onUpload: () => void; onCollage: () => void }) {
  return (
    <div className="w-full max-w-sm text-center">
      <h1 className="font-headline text-3xl tracking-tight text-midnight">Start your post</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-midnight/55">
        Share a photo or video, or build a collage from products you love.
      </p>
      <div className="mt-6 grid gap-3">
        <StartOption
          onClick={onUpload}
          icon={<ImagePlus className="h-6 w-6" />}
          title="Upload photo or video"
          description="Add text, stickers, and product tags"
          className="border-moment/60 bg-moment/25 hover:bg-moment/40"
        />
        <StartOption
          onClick={onCollage}
          icon={<LayoutTemplate className="h-6 w-6" />}
          title="Create a collage"
          description="Start from a layout or a blank canvas"
          className="border-guide/45 bg-guide/15 hover:bg-guide/25"
        />
      </div>
    </div>
  );
}

function StartOption({
  onClick,
  icon,
  title,
  description,
  className,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-3xl border bg-bg p-4 text-left transition-colors",
        className,
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bg/80 text-midnight">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-midnight">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-midnight/60">{description}</span>
      </span>
    </button>
  );
}
