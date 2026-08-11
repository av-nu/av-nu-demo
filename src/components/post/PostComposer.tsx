"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ImagePlus, LayoutTemplate, Minus, Redo2, Undo2, X, ZoomIn } from "lucide-react";

import { useCanvasDocument } from "@/components/canvas/useCanvasDocument";
import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import { PostPageRail } from "@/components/post/PostPageRail";
import { PostToolbar, type PostTool } from "@/components/post/PostToolbar";
import { AddProductTool } from "@/components/post/tools/AddProductTool";
import { DrawTool } from "@/components/post/tools/DrawTool";
import { DrawingSurface, type DrawSettings } from "@/components/post/tools/DrawingSurface";
import { LayoutsTool } from "@/components/post/tools/LayoutsTool";
import { SelectionBar } from "@/components/post/tools/SelectionBar";
import { StickersTool } from "@/components/post/tools/StickersTool";
import { TextTool } from "@/components/post/tools/TextTool";
import { useToast } from "@/components/ui/Toast";
import { DRAW_TOOL_PRESETS, pointsToPath, splitStrokeByEraser, strokeIntersectsEraser } from "@/lib/drawing";
import { mediaStore } from "@/lib/media";
import { cn } from "@/lib/utils";
import {
  EDITORIAL_FORMATS,
  appendDrawingPath,
  applyEditorialTemplate,
  createDrawingElement,
  createProductElement,
  clearSlot,
  fillPlaceholderWithImage,
  fillPlaceholderWithProduct,
  firstPlaceholder,
  isSlotElement,
  createStickerElement,
  createTextElement,
  makeEditorialDrawingPath,
  makeEditorialElementId,
  removeEditorialElement,
  reorderEditorialElement,
  updateEditorialElement,
  type EditorialDrawingElement,
  type EditorialFormat,
  type EditorialPageDesign,
  type EditorialTemplateId,
  type EditorialTextElement,
} from "@/lib/editorial";
import {
  addPostPage,
  createBlankPage,
  createMediaPage,
  duplicatePostPage,
  normalizePost,
  removePostPage,
  reorderPostPage,
  scaleDesignToFormat,
  updatePostPageDesign,
  type Post,
} from "@/lib/post";

/** Tools with a real panel; the rest still show a placeholder. */
const HANDLED_TOOLS = new Set<PostTool>(["layouts", "text", "pages", "photos", "draw", "stickers", "add"]);

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
  const [pendingSlotId, setPendingSlotId] = useState<string>();
  const [drawSettings, setDrawSettings] = useState<DrawSettings>({ tool: "pen", color: "#030125", width: DRAW_TOOL_PRESETS.pen.width });
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

  const canvas = useCanvasDocument({
    design: activePage.design,
    onChange: handleDesignChange,
    // Deleting a filled slot should empty its frame, not destroy the layout.
    // Routed through the hook so the keyboard shortcut behaves like the buttons.
    removeElement: (design, elementId) => {
      const element = design.elements.find((item) => item.id === elementId);
      return element && isSlotElement(element) ? clearSlot(design, elementId) : removeEditorialElement(design, elementId);
    },
  });

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

      // An image chosen for a specific slot fills that frame instead of starting
      // a new page.
      const slotTarget = pendingSlotId ?? (started ? firstPlaceholder(canvas.design)?.id : undefined);
      if (kind === "image" && slotTarget && canvas.design.elements.some((element) => element.id === slotTarget && element.type === "placeholder")) {
        canvas.commit(fillPlaceholderWithImage(canvas.design, slotTarget, ref), slotTarget);
        setPendingSlotId(undefined);
        setActiveTool(undefined);
        return;
      }

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

  const isDrawing = activeTool === "draw";
  const selectedText = canvas.selected?.type === "text" ? canvas.selected : undefined;
  // Templates seed their headline from existing text so re-applying a layout does
  // not silently discard the author's title.
  const firstHeadline = canvas.design.elements
    .find((element): element is EditorialTextElement => element.type === "text")?.content ?? "";

  const addText = () => {
    canvas.addElement(createTextElement("Your words", "title"));
    setActiveTool("text");
  };

  const applyTemplate = (templateId: EditorialTemplateId) => {
    const design = applyEditorialTemplate(post.productIds, firstHeadline || "Title", templateId);

    if (design.format === post.format) {
      canvas.replaceDesign(design);
    } else {
      // Layouts are composed for a particular shape, so adopt it rather than
      // squeezing the composition into the current one. Format and design must
      // change together: applying them separately would let normalisation
      // rescale the new layout against the old shape.
      setPost((current) => {
        const active = current.pages[Math.min(activeIndex, current.pages.length - 1)];
        const pages = current.pages.map((page) => (
          page.id === active?.id
            ? { ...page, design }
            : { ...page, design: scaleDesignToFormat(page.design, design.format) }
        ));
        return normalizePost({ ...current, format: design.format, pages });
      });
    }

    setActiveTool(undefined);
    // Unfilled slots are visible and tappable on the canvas, so point at them
    // rather than forcing the picker open.
    if (firstPlaceholder(design)) showToast("Tap a slot to add a product");
  };

  const changeFormat = (format: EditorialFormat) => {
    if (format === post.format) return;
    // Scale every page so the whole post keeps one shared aspect ratio.
    setPost((current) => normalizePost({
      ...current,
      format,
      pages: current.pages.map((page) => ({ ...page, design: scaleDesignToFormat(page.design, format) })),
    }));
  };

  const addSticker = (value: string) => {
    canvas.addElement(createStickerElement(value));
  };

  const addProduct = (productId: string) => {
    // Prefer the slot the author tapped, then any remaining reserved slot, so a
    // layout fills in place instead of stacking products on top of it.
    const target = pendingSlotId
      ? canvas.design.elements.find((element) => element.id === pendingSlotId && element.type === "placeholder")
      : firstPlaceholder(canvas.design);

    if (target) {
      canvas.commit(fillPlaceholderWithProduct(canvas.design, target.id, productId), target.id);
      setPendingSlotId(undefined);
      // Close the picker once the layout is full; keep it open while slots remain.
      if (!firstPlaceholder(fillPlaceholderWithProduct(canvas.design, target.id, productId))) {
        setActiveTool(undefined);
      }
      return;
    }

    // Offset each addition so a run of products does not land in one stack.
    const placed = canvas.design.elements.filter((element) => element.type === "product").length;
    canvas.addElement(createProductElement(productId, placed));
  };

  /** Swaps what is in a slot without losing the frame. */
  const replaceSelectedSlot = () => {
    const selected = canvas.selected;
    if (!selected || !isSlotElement(selected)) return;
    const emptied = clearSlot(canvas.design, selected.id);
    canvas.commit(emptied, selected.id);
    setPendingSlotId(selected.id);
    setActiveTool("add");
  };

  /** Empties a slot back to its reserved frame rather than deleting it. */
  const clearSelectedSlot = () => {
    const selected = canvas.selected;
    if (!selected || !isSlotElement(selected)) return;
    canvas.commit(clearSlot(canvas.design, selected.id), selected.id);
  };

  /** Tapping a reserved slot opens the picker aimed at that slot. */
  const handleElementSelect = (elementId: string) => {
    canvas.setSelectedId(elementId);
    const element = canvas.design.elements.find((item) => item.id === elementId);
    if (element?.type === "placeholder") {
      setPendingSlotId(elementId);
      setActiveTool("add");
      return;
    }
    // Selecting something real should reveal its actions, so close the picker —
    // the selection bar is hidden while a tool panel is open.
    if (activeTool === "add") {
      setPendingSlotId(undefined);
      setActiveTool(undefined);
    }
  };

  /** Appends a finished stroke, creating the page's drawing layer on first use. */
  const commitStroke = (path: string, points: Array<{ x: number; y: number }>) => {
    const stroke = makeEditorialDrawingPath(path, {
      color: drawSettings.color,
      width: drawSettings.width,
      tool: drawSettings.tool === "eraser" ? "pen" : drawSettings.tool,
      points,
    });
    const existing = canvas.design.elements.find((element): element is EditorialDrawingElement => element.type === "drawing");
    if (existing) {
      canvas.commit(updateEditorialElement(canvas.design, existing.id, appendDrawingPath(existing, stroke)));
      return;
    }
    const layer = appendDrawingPath(createDrawingElement(post.format), stroke);
    canvas.commit({ ...canvas.design, elements: [...canvas.design.elements, layer] });
  };

  /**
   * Erases the part of a stroke under the eraser, splitting it into the runs
   * that survive rather than deleting the whole line. Strokes authored before
   * samples were retained can only be removed whole.
   */
  const eraseAt = (point: { x: number; y: number }) => {
    const layer = canvas.design.elements.find((element): element is EditorialDrawingElement => element.type === "drawing");
    if (!layer || layer.paths.length === 0) return;
    const radius = drawSettings.width / 2;

    let changed = false;
    const paths = layer.paths.flatMap((stroke) => {
      if (!stroke.points || stroke.points.length === 0) {
        return stroke; // No samples retained — leave it alone.
      }
      if (!strokeIntersectsEraser(stroke.points, point, radius)) return stroke;
      changed = true;
      return splitStrokeByEraser(stroke.points, point, radius).map((run) => ({
        ...stroke,
        id: makeEditorialElementId("stroke"),
        d: pointsToPath(run, 0),
        points: run,
      }));
    });

    if (!changed) return;
    canvas.commit(updateEditorialElement(canvas.design, layer.id, { ...layer, paths }));
  };

  const reorderSelected = (direction: "forward" | "backward") => {
    if (!canvas.selectedId) return;
    canvas.commit(reorderEditorialElement(canvas.design, canvas.selectedId, direction), canvas.selectedId);
  };

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
              <div className="relative">
                <EditorialRenderer
                  design={canvas.design}
                  // Hide selection chrome while drawing so it does not sit under the strokes.
                  selectedId={isDrawing ? undefined : canvas.selectedId}
                  interactive
                  guides={canvas.snapGuides}
                  canvasRef={canvas.canvasRef}
                  onElementPointerDown={(event, elementId) => {
                    // Dragging inside a layout slot reframes the media; the frame
                    // itself belongs to the template and stays put.
                    const target = canvas.design.elements.find((element) => element.id === elementId);
                    canvas.startInteraction(event, elementId, target && isSlotElement(target) ? "pan" : "drag");
                    handleElementSelect(elementId);
                  }}
                  onElementSelect={handleElementSelect}
                  onHandlePointerDown={(event, elementId, handle) => canvas.startInteraction(event, elementId, handle)}
                  onCanvasPointerDown={() => canvas.setSelectedId(undefined)}
                />
                {isDrawing && (
                  <DrawingSurface
                    format={post.format}
                    settings={drawSettings}
                    onCommit={commitStroke}
                    onErase={eraseAt}
                  />
                )}
              </div>
            </div>
          ) : (
            <StartChoice
              onUpload={() => uploadRef.current?.click()}
              onCollage={startCollage}
            />
          )}
        </div>

        {/* Hidden while a tool panel is open: the stage shrinks then, leaving this
            overlay floating over the artwork instead of below it. */}
        {started && !activeTool && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-end pr-3">
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

      {started && activeTool === "layouts" && (
        <LayoutsTool
          productIds={post.productIds}
          title={firstHeadline}
          activeFormat={post.format}
          onApply={applyTemplate}
          onChangeFormat={changeFormat}
          onClose={() => setActiveTool(undefined)}
        />
      )}

      {started && activeTool === "text" && (
        <TextTool
          selected={selectedText}
          onAdd={addText}
          onPatch={canvas.patchSelected}
          onClose={() => setActiveTool(undefined)}
        />
      )}

      {started && activeTool === "draw" && (
        <DrawTool settings={drawSettings} onChange={setDrawSettings} onClose={() => setActiveTool(undefined)} />
      )}

      {started && activeTool === "stickers" && (
        <StickersTool onAdd={addSticker} onClose={() => setActiveTool(undefined)} />
      )}

      {started && activeTool === "add" && (
        <AddProductTool onAdd={addProduct} onClose={() => { setPendingSlotId(undefined); setActiveTool(undefined); }} />
      )}

      {started && activeTool && !HANDLED_TOOLS.has(activeTool) && (
        <div className="w-full min-w-0 shrink-0 border-t border-divider/60 bg-surface/40 px-4 py-4 text-center text-xs text-midnight/55">
          The {activeTool} tool arrives shortly.
        </div>
      )}

      {started && canvas.selected && !activeTool && (
        <SelectionBar
          element={canvas.selected}
          onDuplicate={canvas.duplicateSelected}
          onDelete={canvas.removeSelected}
          onReorder={reorderSelected}
          onToggleLock={() => canvas.patchSelected({ locked: !canvas.selected?.locked })}
          onReplaceSlot={replaceSelectedSlot}
          onClearSlot={clearSelectedSlot}
          onZoom={(zoom) => canvas.patchSelected({ zoom })}
        />
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
