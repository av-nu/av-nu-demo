"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, FileText, ImagePlus, LayoutTemplate, Minus, Redo2, ShoppingBag, Undo2, X, ZoomIn } from "lucide-react";

import { useCanvasDocument } from "@/components/canvas/useCanvasDocument";
import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import { PostPins } from "@/components/post/PostPins";
import { PublishSheet } from "@/components/post/PublishSheet";
import { PostPageRail } from "@/components/post/PostPageRail";
import { ProductSideRail } from "@/components/post/ProductSideRail";
import { DraftsPanel } from "@/components/post/DraftsPanel";
import { PostToolbar, type PostTool } from "@/components/post/PostToolbar";
import { DrawTool } from "@/components/post/tools/DrawTool";
import { CropOverlay } from "@/components/post/tools/CropOverlay";
import { ImageTool } from "@/components/post/tools/ImageTool";
import { DrawingSurface, type DrawSettings } from "@/components/post/tools/DrawingSurface";
import { LayersTool } from "@/components/post/tools/LayersTool";
import { LayoutsTool } from "@/components/post/tools/LayoutsTool";
import { SelectionBar } from "@/components/post/tools/SelectionBar";
import { StickersTool } from "@/components/post/tools/StickersTool";
import { TextTool } from "@/components/post/tools/TextTool";
import { useToast } from "@/components/ui/Toast";
import { useRequireAuth } from "@/components/auth/AccountInvitationDialog";
import { makePostDraftId, usePostDrafts, type PostDraft } from "@/hooks/usePostDrafts";
import { applyCrop } from "@/lib/crop";
import { DRAW_TOOL_PRESETS, pointsToPath, splitStrokeByEraser, strokeIntersectsEraser } from "@/lib/drawing";
import { mediaStore } from "@/lib/media";
import { socialService } from "@/lib/social";
import type { FaveVisibility } from "@/data/faves";
import { cn } from "@/lib/utils";
import {
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
  isEditorialMediaElement,
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
  addPostPin,
  createBlankPage,
  createMediaPage,
  duplicatePostPage,
  isFullBleedMedia,
  isMediaPage,
  movePostPin,
  normalizePost,
  removePostPin,
  removePostPage,
  reorderPostPage,
  scaleDesignToFormat,
  updatePostPageDesign,
  type Post,
} from "@/lib/post";

/** Tools with a real panel; the rest still show a placeholder. */
const HANDLED_TOOLS = new Set<PostTool>(["layouts", "text", "pages", "photos", "draw", "stickers", "add", "layers", "image"]);

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
export function PostComposer({
  initialPost,
  initialDraft,
  embedded = false,
  onClose,
  onPublished,
}: {
  initialPost?: Post;
  initialDraft?: PostDraft;
  embedded?: boolean;
  onClose?: () => void;
  onPublished?: (post: Post) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast, ToastContainer } = useToast();
  const { requireAuth, invitation } = useRequireAuth();
  const { drafts, saveDraft, removeDraft } = usePostDrafts();
  const [post, setPost] = useState<Post>(() => initialDraft?.post ?? initialPost ?? emptyPost());
  const [draftId, setDraftId] = useState(initialDraft?.id);
  const [draftTitle, setDraftTitle] = useState(initialDraft?.title ?? "");
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [productRailOpen, setProductRailOpen] = useState(false);
  const [started, setStarted] = useState(Boolean(initialPost || initialDraft));
  const [activeIndex, setActiveIndex] = useState(initialDraft?.activePageIndex ?? 0);
  const [activeTool, setActiveTool] = useState<PostTool>();
  const [zoom, setZoom] = useState(1);
  const [pendingSlotId, setPendingSlotId] = useState<string>();
  const [imageSection, setImageSection] = useState<"shape" | "crop" | undefined>("shape");
  const [cropping, setCropping] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string>();
  const [drawSettings, setDrawSettings] = useState<DrawSettings>({ tool: "pen", color: "#030125", width: DRAW_TOOL_PRESETS.pen.width });
  const uploadRef = useRef<HTMLInputElement>(null);
  const initialProductSeeded = useRef(false);

  const activePage = post.pages[Math.min(activeIndex, post.pages.length - 1)];
  const initialProductId = searchParams.get("productId");

  useEffect(() => {
    if (!initialProductId || initialProductSeeded.current || initialPost || initialDraft) return;
    initialProductSeeded.current = true;
    setStarted(true);
    setProductRailOpen(true);
    setPost((current) => {
      const page = current.pages[0];
      if (!page) return current;
      return updatePostPageDesign(current, page.id, { ...page.design, elements: [...page.design.elements, createProductElement(initialProductId)] });
    });
  }, [initialDraft, initialPost, initialProductId]);

  useEffect(() => {
    if (!started) return;
    const timer = window.setTimeout(() => {
      const id = draftId ?? makePostDraftId();
      if (!draftId) setDraftId(id);
      saveDraft({ id, post, title: draftTitle, createdAt: initialDraft?.createdAt ?? Date.now(), updatedAt: Date.now(), activePageIndex: activeIndex });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activeIndex, draftId, draftTitle, initialDraft?.createdAt, post, saveDraft, started]);

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
  // Framing is offered for a loose image only: inside a slot the frame is the
  // template's, and reframing there is already handled by dragging.
  const selectedElement = canvas.selected;
  const adjustableMedia = selectedElement && isEditorialMediaElement(selectedElement) && !isSlotElement(selectedElement)
    ? selectedElement
    : undefined;
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

    // A media page carries its products as pins on the photo rather than as
    // canvas elements, which is what makes an uploaded shot shoppable.
    if (isMediaPage(activePage)) {
      setPost((current) => addPostPin(current, activePage.id, productId));
      showToast("Tagged — drag the tag to reposition");
      return;
    }

    // Offset each addition so a run of products does not land in one stack.
    const placed = canvas.design.elements.filter((element) => element.type === "product").length;
    canvas.addElement(createProductElement(productId, placed));
  };

  /**
   * Links several products in one go. Folded into a single design rather than
   * called per product: each call would otherwise read the same design and the
   * fills would overwrite one another.
   */
  const addProducts = (productIds: string[]) => {
    if (productIds.length === 0) return;

    if (isMediaPage(activePage)) {
      setPost((current) => productIds.reduce((next, productId) => addPostPin(next, activePage.id, productId), current));
      showToast(productIds.length === 1 ? "Tagged — drag the tag to reposition" : `Tagged ${productIds.length} products`);
      setActiveTool(undefined);
      return;
    }

    let design = canvas.design;
    let target = pendingSlotId;
    for (const productId of productIds) {
      const slot = target && design.elements.some((element) => element.id === target && element.type === "placeholder")
        ? target
        : firstPlaceholder(design)?.id;
      design = slot
        ? fillPlaceholderWithProduct(design, slot, productId)
        : { ...design, elements: [...design.elements, createProductElement(productId, design.elements.filter((element) => element.type === "product").length)] };
      target = undefined; // Only the tapped slot is honoured; the rest fill in order.
    }
    canvas.commit(design);
    setPendingSlotId(undefined);
    setActiveTool(undefined);
  };

  /** Swaps what is in a slot without losing the frame. */
  const replaceSelectedSlot = () => {
    const selected = canvas.selected;
    if (!selected || !isSlotElement(selected)) return;
    const emptied = clearSlot(canvas.design, selected.id);
    canvas.commit(emptied, selected.id);
    setPendingSlotId(selected.id);
    setProductRailOpen(true);
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
      setProductRailOpen(true);
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

  const publish = async (caption: string, visibility: FaveVisibility) => {
    setPublishing(true);
    setPublishError(undefined);
    try {
      const isExisting = initialPost !== undefined && (await socialService.getPost(post.id)) !== undefined;
      let publishedId = post.id;
      if (isExisting) {
        await socialService.updatePost(post.id, { pages: post.pages, format: post.format, caption, visibility, coverPageIndex: post.coverPageIndex });
      } else {
        publishedId = await socialService.addPost({ pages: post.pages, format: post.format, caption, visibility, coverPageIndex: post.coverPageIndex });
      }
      const publishedPost = { ...post, id: publishedId, caption, visibility };
      if (draftId) removeDraft(draftId);
      if (embedded) {
        onPublished?.(publishedPost);
        onClose?.();
      } else {
        router.push("/");
      }
    } catch (error) {
      // Storage failures are surfaced rather than swallowed: losing a post the
      // author just built is worse than an explicit error.
      setPublishError(error instanceof Error ? error.message : "That post could not be saved.");
      setPublishing(false);
    }
  };

  const close = () => {
    if (onClose) onClose();
    else router.push("/");
  };

  const resumeDraft = (draft: PostDraft) => {
    setPost(draft.post);
    setDraftId(draft.id);
    setDraftTitle(draft.title);
    setActiveIndex(Math.min(draft.activePageIndex, draft.post.pages.length - 1));
    setStarted(true);
    setDraftsOpen(false);
  };

  const deleteCurrentDraft = (id: string) => {
    removeDraft(id);
    if (id === draftId) setDraftId(undefined);
  };

  return (
    // Sized to the viewport rather than fixed-positioned: the composer route
    // opts out of the shopper shell, so it owns the whole screen.
    <div className={embedded ? "fixed inset-0 z-[180] flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm sm:p-5" : ""}>
      <div className={`relative flex w-full flex-col overflow-hidden bg-bg ${embedded ? "h-[min(94dvh,900px)] max-w-6xl rounded-3xl shadow-2xl" : "h-[100dvh]"}`}>
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
        <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="New post" aria-label="Post title" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-midnight placeholder:text-midnight/45 focus:outline-none" />
        <button
          type="button"
          onClick={() => setDraftsOpen(true)}
          aria-label="Open drafts"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-midnight/60 transition-colors hover:bg-surface hover:text-midnight"
        >
          <FileText className="h-4 w-4" />
          {drafts.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink px-1 text-[9px] font-bold text-white">{drafts.length}</span>}
        </button>
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
          onClick={() => { requireAuth("publish a post", () => { setPublishError(undefined); setPublishOpen(true); }); }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy/90 disabled:opacity-40"
        >
          Next
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Canvas stage — the dotted grid reads as "workspace" rather than page. */}
      <div
        className={`relative min-h-0 w-full min-w-0 flex-1 overflow-auto ${productRailOpen ? "md:pr-[360px]" : ""}`}
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
                    const reframes = target && (isSlotElement(target) || isFullBleedMedia(target, post.format));
                    canvas.startInteraction(event, elementId, reframes ? "pan" : "drag");
                    handleElementSelect(elementId);
                  }}
                  onElementSelect={handleElementSelect}
                  onHandlePointerDown={(event, elementId, handle) => canvas.startInteraction(event, elementId, handle)}
                  onCanvasPointerDown={() => canvas.setSelectedId(undefined)}
                />
                <PostPins
                  pins={activePage.pins}
                  editable
                  onMove={(pinId, x, y) => setPost((current) => movePostPin(current, activePage.id, pinId, x, y))}
                  onRemove={(pinId) => setPost((current) => removePostPin(current, activePage.id, pinId))}
                />
                {cropping && adjustableMedia && (
                  <CropOverlay
                    element={adjustableMedia}
                    format={post.format}
                    onCancel={() => setCropping(false)}
                    onConfirm={(rect) => {
                      canvas.patchSelected(applyCrop(adjustableMedia, rect));
                      setCropping(false);
                    }}
                  />
                )}
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
              onProducts={() => { requireAuth("create a post", () => { setStarted(true); setProductRailOpen(true); }); }}
              onUpload={() => { requireAuth("create a post", () => uploadRef.current?.click()); }}
              onCollage={() => { requireAuth("create a post", startCollage); }}
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

      {started && (
        <ProductSideRail
          open={productRailOpen}
          onOpen={() => { requireAuth("add a product to your post", () => setProductRailOpen(true)); }}
          onDrafts={() => setDraftsOpen(true)}
          onClose={() => { setPendingSlotId(undefined); setProductRailOpen(false); }}
          onAdd={addProduct}
          onAddMany={addProducts}
          tagsOnly={isMediaPage(activePage)}
        />
      )}

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

      {started && activeTool === "image" && adjustableMedia && (
        <ImageTool
          selected={adjustableMedia}
          section={imageSection}
          onSection={setImageSection}
          onPatch={canvas.patchSelected}
          onStartCrop={() => setCropping(true)}
          onResetCrop={adjustableMedia.crop ? () => canvas.patchSelected({ crop: undefined }) : undefined}
          onClose={() => setActiveTool(undefined)}
        />
      )}

      {started && activeTool === "layers" && (
        <LayersTool
          design={canvas.design}
          selectedId={canvas.selectedId}
          onSelect={canvas.setSelectedId}
          onReorder={(elementId, direction) => canvas.commit(reorderEditorialElement(canvas.design, elementId, direction), elementId)}
          onPatch={(elementId, patch) => canvas.commit(updateEditorialElement(canvas.design, elementId, patch), elementId)}
          onClose={() => setActiveTool(undefined)}
        />
      )}

      {started && activeTool && !HANDLED_TOOLS.has(activeTool) && (
        <div className="w-full min-w-0 shrink-0 border-t border-divider/60 bg-surface/40 px-4 py-4 text-center text-xs text-midnight/55">
          The {activeTool} tool arrives shortly.
        </div>
      )}

      {started && canvas.selected && !activeTool && !productRailOpen && (
        <SelectionBar
          element={canvas.selected}
          onDuplicate={canvas.duplicateSelected}
          onDelete={canvas.removeSelected}
          onReorder={reorderSelected}
          onToggleLock={() => canvas.patchSelected({ locked: !canvas.selected?.locked })}
          onReplaceSlot={replaceSelectedSlot}
          onClearSlot={clearSelectedSlot}
          onZoom={(zoom) => canvas.patchSelected({ zoom })}
          onAdjust={adjustableMedia ? () => setActiveTool("image") : undefined}
        />
      )}

      <PostToolbar
        active={productRailOpen ? "add" : activeTool}
        disabled={!started}
        onSelect={(tool) => {
          if (tool === "photos") {
            uploadRef.current?.click();
            return;
          }
          if (tool === "add") {
            requireAuth("add a product to your post", () => setProductRailOpen(true));
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
      {publishOpen && (
        <PublishSheet
          post={post}
          publishing={publishing}
          error={publishError}
          onPublish={publish}
          onClose={() => setPublishOpen(false)}
        />
      )}
      {draftsOpen && <DraftsPanel drafts={drafts} onResume={resumeDraft} onDelete={deleteCurrentDraft} onClose={() => setDraftsOpen(false)} />}
      <ToastContainer />
      {invitation}
      </div>
    </div>
  );
}

function StartChoice({ onProducts, onUpload, onCollage }: { onProducts: () => void; onUpload: () => void; onCollage: () => void }) {
  return (
    <div className="w-full max-w-sm text-center">
      <h1 className="font-headline text-3xl tracking-tight text-midnight">Start your post</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-midnight/55">
        Add products you love, a photo from your device, or build a collage.
      </p>
      <div className="mt-6 grid gap-3">
        <StartOption
          onClick={onProducts}
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Add products"
          description="From Favorites or Explore"
        />
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
