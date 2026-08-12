"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff, Move, Plus, RotateCw } from "lucide-react";
import { useId, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

import { mockProducts } from "@/data/mockProducts";
import { isUnoptimizableSrc, useMediaSrc } from "@/lib/media/useMediaSrc";
import { getVideoPoster } from "@/lib/utils";
import { EDITORIAL_FORMATS, EDITORIAL_VECTOR_PATHS, editorialFontStack, isEditorialFramedElement, isEditorialMediaElement, isSlotElement, type EditorialElement, type EditorialMediaElement, type EditorialImageMask, type EditorialPageDesign, type EditorialSnapGuides } from "@/lib/editorial";

/** Applies an alpha to a hex colour, leaving other notations untouched. */
function withOpacity(color: string, opacity?: number): string {
  if (opacity === undefined || opacity >= 1) return color;
  const hex = color.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return color;
  const value = Math.round(Math.max(0, Math.min(1, opacity)) * 255).toString(16).padStart(2, "0");
  return `${hex}${value}`;
}

function shadowFor(value: "none" | "soft" | "strong") {
  if (value === "strong") return "0 22px 50px rgba(40, 30, 25, 0.28)";
  if (value === "soft") return "0 12px 28px rgba(40, 30, 25, 0.16)";
  return "none";
}

function fontFor(value: "headline" | "sans" | "serif") {
  if (value === "headline") return "var(--font-headline), Georgia, serif";
  if (value === "serif") return "Georgia, 'Times New Roman', serif";
  return "var(--font-sans), Arial, sans-serif";
}

function maskStyle(mask: EditorialImageMask, borderRadius: number, canvasWidth: number, maskId: string) {
  if (EDITORIAL_VECTOR_PATHS[mask]) return { clipPath: `url(#${maskId})` };
  if (mask === "circle") return { clipPath: "circle(50% at 50% 50%)" };
  if (mask === "oval") return { clipPath: "ellipse(50% 50% at 50% 50%)" };
  if (mask === "rounded") return { borderRadius: `${(Math.max(32, borderRadius) / canvasWidth) * 100}cqw` };
  return { borderRadius: `${(borderRadius / canvasWidth) * 100}cqw` };
}

/**
 * Media elements resolve their ref through the media store, so this has to be a
 * component rather than a plain render function.
 */
function MediaElementContent({ element, staticMedia }: { element: EditorialMediaElement; staticMedia?: boolean }) {
  const ref = element.type === "product"
    ? mockProducts.find((product) => product.id === element.productId)?.images[0]
    : element.src;
  const { src, status } = useMediaSrc(ref);

  // Both states have to read on any backdrop. A media page's background is
  // black, where the old light-on-light treatment was simply invisible — an
  // unrecoverable upload looked like an empty black post.
  if (status === "loading") return <div className="h-full w-full animate-pulse bg-white/10" />;
  if (!src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-[2cqw] bg-midnight/75 px-3 text-center text-white/80">
        <ImageOff style={{ width: "7cqw", height: "7cqw" }} aria-hidden="true" />
        <span className="font-semibold leading-tight" style={{ fontSize: "3cqw" }}>Media unavailable</span>
      </div>
    );
  }

  // Zoom enlarges the media box rather than transforming it, so the excess can
  // be panned on *both* axes. `object-fit: cover` alone only ever overflows one
  // axis, which left the other with no play at all.
  const zoom = Math.max(0.2, Math.min(4, element.zoom));
  // One offset rule for both directions: zoomed in, the surplus is panned out of
  // view; zoomed out, the smaller image is positioned within the frame. Zooming
  // below 1 is what lets the whole photo be seen rather than a fixed crop.
  const slack = 100 - zoom * 100;
  const objectStyle: React.CSSProperties = {
    width: `${zoom * 100}%`,
    height: `${zoom * 100}%`,
    left: `${slack * (element.cropX / 100)}%`,
    top: `${slack * (element.cropY / 100)}%`,
    // Still governs the overflow that `cover` itself produces.
    objectPosition: `${element.cropX}% ${element.cropY}%`,
  };
  // Zoomed out the intent is to see the whole frame, which cover would defeat.
  const fitClass = zoom < 1 || element.fit === "contain" ? "object-contain" : "object-cover";

  // The wrapper carries the zoom and pan so the media itself can simply fill it.
  const inner: React.CSSProperties = { objectPosition: objectStyle.objectPosition };

  return (
    <span className="absolute" style={{ width: objectStyle.width, height: objectStyle.height, left: objectStyle.left, top: objectStyle.top }}>
      {element.type === "video" ? (
        <video
          src={src}
          // A still preview needs a poster, or the element paints black until
          // something forces a frame to decode.
          poster={getVideoPoster(src)}
          controls={!staticMedia}
          playsInline
          muted={staticMedia}
          preload="metadata"
          className={`h-full w-full ${fitClass} ${staticMedia ? "pointer-events-none" : ""}`}
          style={inner}
        />
      ) : isUnoptimizableSrc(src) ? (
        // Object URLs and data URLs cannot go through next/image's loader.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={element.name} draggable={false} className={`h-full w-full ${fitClass}`} style={inner} />
      ) : (
        <Image
          src={src}
          alt={element.name}
          fill
          sizes="(max-width: 768px) 80vw, 700px"
          className={fitClass}
          style={inner}
          draggable={false}
        />
      )}
    </span>
  );
}

function elementContent(element: EditorialElement, canvasWidth: number, staticMedia?: boolean) {
  if (isEditorialMediaElement(element)) {
    return <MediaElementContent element={element} staticMedia={staticMedia} />;
  }

  if (element.type === "text") {
    const highlight = element.highlightStyle && element.highlightStyle !== "none"
      ? withOpacity(element.highlightColor, element.highlightOpacity)
      : undefined;
    const content = highlight
      ? (
        <span
          className="box-decoration-clone"
          style={
            element.highlightStyle === "underline"
              ? { backgroundImage: `linear-gradient(${highlight}, ${highlight})`, backgroundSize: "100% 0.3em", backgroundPosition: "0 88%", backgroundRepeat: "no-repeat" }
              : element.highlightStyle === "marker"
                ? { backgroundImage: `linear-gradient(${highlight}, ${highlight})`, backgroundSize: "100% 62%", backgroundPosition: "0 62%", backgroundRepeat: "no-repeat" }
                : { backgroundColor: highlight, padding: "0.08em 0.22em" }
          }
        >
          {element.content}
        </span>
      )
      : element.content;
    return (
      <div
        className="h-full w-full whitespace-pre-wrap break-words"
        style={{
          color: element.color,
          backgroundColor: element.backgroundColor,
          fontFamily: element.fontId ? editorialFontStack(element.fontId, element.fontFamily) : fontFor(element.fontFamily),
          fontSize: `${(element.fontSize / canvasWidth) * 100}cqw`,
          fontWeight: element.fontWeight,
          fontStyle: element.italic ? "italic" : "normal",
          lineHeight: element.lineHeight,
          letterSpacing: `${(element.letterSpacing / canvasWidth) * 100}cqw`,
          textAlign: element.align,
          padding: `${(element.padding / canvasWidth) * 100}cqw`,
        }}
      >
        {content}
      </div>
    );
  }

  if (element.type === "sticker") {
    if (element.src) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={element.src} alt={element.name} draggable={false} className="h-full w-full object-contain" style={element.color ? { color: element.color } : undefined} />;
    }
    return (
      <div
        className="flex h-full w-full items-center justify-center leading-none"
        style={{ fontSize: `${(Math.min(element.width, element.height) / canvasWidth) * 100}cqw`, color: element.color }}
      >
        {element.value}
      </div>
    );
  }

  if (element.type === "drawing") {
    return (
      <svg
        aria-hidden="true"
        className="h-full w-full overflow-visible"
        viewBox={`0 0 ${element.viewBoxWidth} ${element.viewBoxHeight}`}
        preserveAspectRatio="none"
      >
        {element.paths.map((path) => (
          <path
            key={path.id}
            // Queried by the eraser, which hit-tests with isPointInStroke.
            data-stroke-id={path.id}
            d={path.d}
            fill="none"
            stroke={path.color}
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
            strokeLinecap={path.tool === "marker" || path.tool === "highlighter" ? "butt" : "round"}
            strokeLinejoin="round"
            style={path.tool === "highlighter" ? { mixBlendMode: "multiply" } : undefined}
          />
        ))}
      </svg>
    );
  }

  if (element.type === "placeholder") {
    // A reserved slot: dashed frame plus an affordance to fill it.
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-[2cqw] bg-black/[0.03] text-black/40"
        style={{ outline: "0.5cqw dashed rgba(3,1,37,0.28)", outlineOffset: "-0.5cqw" }}
      >
        <Plus style={{ width: "8cqw", height: "8cqw" }} strokeWidth={2} aria-hidden="true" />
        <span className="font-semibold" style={{ fontSize: "3cqw" }}>Add product</span>
      </div>
    );
  }

  if (element.shape === "line") {
    return <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2" style={{ height: `${(Math.max(1, element.strokeWidth || element.height) / canvasWidth) * 100}cqw`, backgroundColor: element.fill }} />;
  }

  const path = EDITORIAL_VECTOR_PATHS[element.shape];
  if (path) return <svg aria-hidden="true" className="h-full w-full overflow-visible" viewBox="0 0 1 1" preserveAspectRatio="none"><path d={path} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth / Math.max(element.width, 1)} /></svg>;

  return <div className="h-full w-full" style={{ backgroundColor: element.fill, border: `${(element.strokeWidth / canvasWidth) * 100}cqw solid ${element.stroke}`, borderRadius: element.shape === "ellipse" ? "999px" : `${(element.borderRadius / canvasWidth) * 100}cqw` }} />;
}

type EditorialRendererProps = {
  design: EditorialPageDesign;
  selectedId?: string;
  interactive?: boolean;
  productLinks?: boolean;
  guides?: EditorialSnapGuides;
  canvasRef?: RefObject<HTMLDivElement>;
  onElementPointerDown?: (event: ReactPointerEvent<HTMLDivElement>, elementId: string) => void;
  onElementSelect?: (elementId: string) => void;
  onHandlePointerDown?: (event: ReactPointerEvent<HTMLButtonElement>, elementId: string, handle: "resize" | "rotate") => void;
  onCanvasPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  /** Renders video as a still preview: no controls, and not hit-testable. */
  staticMedia?: boolean;
};

export function EditorialRenderer({ design, selectedId, interactive = false, productLinks = false, staticMedia = false, guides, canvasRef, onElementPointerDown, onElementSelect, onHandlePointerDown, onCanvasPointerDown }: EditorialRendererProps) {
  const dimensions = EDITORIAL_FORMATS[design.format];
  const rendererId = useId().replace(/:/g, "");
  const elements = [...design.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={canvasRef}
      className={`relative w-full overflow-hidden bg-white shadow-[0_24px_70px_rgba(63,51,46,0.18)] ring-1 ring-black/10 ${interactive ? "touch-none select-none" : ""}`}
      style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}`, backgroundColor: design.backgroundColor, containerType: "inline-size" }}
      onPointerDown={onCanvasPointerDown}
    >
      {design.backgroundImage && <Image src={design.backgroundImage} alt="" fill sizes="100vw" className="pointer-events-none object-cover" style={{ opacity: design.backgroundOpacity }} unoptimized={design.backgroundImage.startsWith("data:")} draggable={false} />}
      {interactive && design.showGuides && <><span className="pointer-events-none absolute inset-y-0 left-1/2 z-[80] w-px bg-sky-400/25" /><span className="pointer-events-none absolute inset-x-0 top-1/2 z-[80] h-px bg-sky-400/25" /></>}
      {interactive && guides?.x !== undefined && <span className="pointer-events-none absolute inset-y-0 z-[90] w-px bg-sky-500 shadow-[0_0_3px_rgba(14,165,233,0.7)]" style={{ left: `${(guides.x / dimensions.width) * 100}%` }} />}
      {interactive && guides?.y !== undefined && <span className="pointer-events-none absolute inset-x-0 z-[90] h-px bg-sky-500 shadow-[0_0_3px_rgba(14,165,233,0.7)]" style={{ top: `${(guides.y / dimensions.height) * 100}%` }} />}
      {design.format === "spread" && <span className="pointer-events-none absolute inset-y-0 left-1/2 z-[81] w-px bg-black/20 shadow-[0_0_12px_rgba(0,0,0,0.2)]" />}
      {elements.map((element) => {
        if (element.hidden) return null;
        const selected = interactive && selectedId === element.id;
        const maskId = `editorial-mask-${rendererId}-${element.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
        const media = isEditorialFramedElement(element) ? element : undefined;
        const imageStyle = media ? { ...maskStyle(media.mask, media.borderRadius, dimensions.width, maskId), boxShadow: shadowFor(media.shadow) } : undefined;
        const borderStyle = media && media.mask !== "circle" ? { border: `${(media.borderWidth / dimensions.width) * 100}cqw solid ${media.borderColor}` } : undefined;
        const maskPath = media ? EDITORIAL_VECTOR_PATHS[media.mask] : undefined;
        return (
          <div
            key={element.id}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `Select ${element.name}` : undefined}
            className={`absolute outline-none ${
              // A drawing layer spans the whole canvas, so leaving it hit-testable
              // would swallow every tap and make other elements unselectable.
              element.type === "drawing" ? "pointer-events-none" : ""
            } ${interactive ? element.locked ? "cursor-not-allowed" : "cursor-move" : ""} ${selected ? "ring-[3px] ring-sky-500 ring-offset-2 ring-offset-transparent" : ""}`}
            style={{
              left: `${(element.x / dimensions.width) * 100}%`,
              top: `${(element.y / dimensions.height) * 100}%`,
              width: `${(element.width / dimensions.width) * 100}%`,
              height: `${(element.height / dimensions.height) * 100}%`,
              opacity: element.opacity,
              transform: `rotate(${element.rotation}deg)`,
              zIndex: element.zIndex + 2,
              ...borderStyle,
            }}
            onPointerDown={(event) => onElementPointerDown?.(event, element.id)}
            onFocus={() => onElementSelect?.(element.id)}
          >
            {maskPath && <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0"><defs><clipPath id={maskId} clipPathUnits="objectBoundingBox"><path d={maskPath} /></clipPath></defs></svg>}
            <div className="relative h-full w-full overflow-hidden" style={imageStyle}>{elementContent(element, dimensions.width, staticMedia)}</div>
            {productLinks && element.type === "product" && <Link href={`/product/${element.productId}`} aria-label={`Shop ${element.name}`} className="absolute inset-0 z-[1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" />}
            {/* A slot's frame is owned by the layout, so it offers reframing
                rather than resize and rotate handles. */}
            {selected && !element.locked && isSlotElement(element) && (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[100] flex justify-center pb-[2cqw]">
                <span className="flex items-center gap-[1cqw] rounded-full bg-black/55 px-[2.5cqw] py-[1cqw] font-semibold text-white" style={{ fontSize: "2.6cqw" }}>
                  <Move className="inline-block" style={{ width: "3cqw", height: "3cqw" }} />
                  Drag to reframe
                </span>
              </span>
            )}
            {selected && !element.locked && !isSlotElement(element) && element.type !== "placeholder" && (
              // Handles are centred on their anchor rather than sitting fully
              // outside the element. The canvas clips overflow, so an element at
              // a canvas edge would otherwise lose its handles completely —
              // half-overlapping keeps them reachable everywhere. Targets grow on
              // touch pointers.
              <>
                <button
                  type="button"
                  aria-label="Resize element"
                  className="absolute bottom-0 right-0 z-[100] h-8 w-8 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-white bg-sky-500 shadow-md [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11"
                  onPointerDown={(event) => onHandlePointerDown?.(event, element.id, "resize")}
                />
                <button
                  type="button"
                  aria-label="Rotate element"
                  title="Rotate element"
                  className="absolute left-1/2 top-0 z-[100] flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-sky-600 bg-white text-sky-700 shadow-[0_3px_8px_rgba(14,116,144,0.28)] [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11"
                  onPointerDown={(event) => onHandlePointerDown?.(event, element.id, "rotate")}
                >
                  <RotateCw className="h-4 w-4 [@media(pointer:coarse)]:h-5 [@media(pointer:coarse)]:w-5" strokeWidth={2.75} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
