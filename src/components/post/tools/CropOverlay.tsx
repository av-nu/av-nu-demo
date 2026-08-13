"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, X } from "lucide-react";

import { clampCropRect, rectFromPoints, type CropRect } from "@/lib/crop";
import { EDITORIAL_FORMATS, type EditorialFormat, type EditorialMediaElement } from "@/lib/editorial";

/**
 * Drag-to-crop over a selected image.
 *
 * The dashed rectangle shows exactly what will be kept, and everything outside it
 * is dimmed, so the result is visible before it is committed rather than after.
 */
export function CropOverlay({
  element,
  format,
  onConfirm,
  onCancel,
}: {
  element: EditorialMediaElement;
  format: EditorialFormat;
  onConfirm: (rect: CropRect) => void;
  onCancel: () => void;
}) {
  const dimensions = EDITORIAL_FORMATS[format];
  const surfaceRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number }>();
  // Starts as the whole image, so confirming without dragging changes nothing.
  const [rect, setRect] = useState<CropRect>({ x: 0, y: 0, width: 1, height: 1 });
  const [dragging, setDragging] = useState(false);

  // The element's box within the canvas, as percentages.
  const boxStyle = {
    left: `${(element.x / dimensions.width) * 100}%`,
    top: `${(element.y / dimensions.height) * 100}%`,
    width: `${(element.width / dimensions.width) * 100}%`,
    height: `${(element.height / dimensions.height) * 100}%`,
  };

  const pointToFraction = (event: ReactPointerEvent) => {
    const bounds = surfaceRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return undefined;
    return {
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
    };
  };

  return (
    <div className="absolute inset-0 z-[210]" style={{ pointerEvents: "auto" }}>
      <div ref={surfaceRef} className="absolute touch-none" style={boxStyle}
        onPointerDown={(event) => {
          const point = pointToFraction(event);
          if (!point) return;
          event.preventDefault();
          event.stopPropagation();
          (event.target as Element).setPointerCapture?.(event.pointerId);
          start.current = point;
          setDragging(true);
          setRect({ x: point.x, y: point.y, width: 0, height: 0 });
        }}
        onPointerMove={(event) => {
          if (!dragging || !start.current) return;
          const point = pointToFraction(event);
          if (!point) return;
          setRect(rectFromPoints(start.current, point));
        }}
        onPointerUp={() => {
          if (!start.current) return;
          start.current = undefined;
          setDragging(false);
          setRect((current) => clampCropRect(current));
        }}
      >
        {/* Everything outside the selection is dimmed, so what remains is obvious. */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 bg-midnight/55" style={{ height: `${rect.y * 100}%` }} />
          <div className="absolute inset-x-0 bottom-0 bg-midnight/55" style={{ height: `${(1 - rect.y - rect.height) * 100}%` }} />
          <div className="absolute bg-midnight/55" style={{ top: `${rect.y * 100}%`, height: `${rect.height * 100}%`, left: 0, width: `${rect.x * 100}%` }} />
          <div className="absolute bg-midnight/55" style={{ top: `${rect.y * 100}%`, height: `${rect.height * 100}%`, right: 0, width: `${(1 - rect.x - rect.width) * 100}%` }} />
        </div>

        <div
          className="absolute border-2 border-dashed border-white"
          style={{
            left: `${rect.x * 100}%`,
            top: `${rect.y * 100}%`,
            width: `${rect.width * 100}%`,
            height: `${rect.height * 100}%`,
            boxShadow: "0 0 0 1px rgba(3,1,37,0.45)",
          }}
        >
          {/* Corner ticks, the conventional signal that a region is adjustable. */}
          {(["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"] as const).map((position) => (
            <span key={position} className={`absolute h-3 w-3 border-2 border-white ${position}`} />
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-full border border-divider/70 bg-bg/95 px-3 py-2 text-xs font-semibold text-midnight/70 shadow-sm backdrop-blur"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(rect)}
          className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-2 text-xs font-semibold text-white shadow-sm"
        >
          <Check className="h-3.5 w-3.5" />
          Crop
        </button>
      </div>
    </div>
  );
}
