"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { DRAW_TOOL_PRESETS, pointsToPath, simplifyPoints, type DrawPoint } from "@/lib/drawing";
import { EDITORIAL_FORMATS, type EditorialDrawTool, type EditorialFormat } from "@/lib/editorial";

export type DrawSettings = {
  tool: EditorialDrawTool | "eraser";
  color: string;
  width: number;
};

/**
 * Transparent capture layer placed over the canvas while the draw tool is open.
 *
 * Pointer positions are converted into canvas units so strokes stay correct at
 * any zoom or screen size. Committed strokes are rendered by EditorialRenderer;
 * this layer only draws the in-progress one.
 */
export function DrawingSurface({
  format,
  settings,
  onCommit,
  onErase,
}: {
  format: EditorialFormat;
  settings: DrawSettings;
  onCommit: (path: string, points: DrawPoint[]) => void;
  onErase: (point: DrawPoint) => void;
}) {
  const dimensions = EDITORIAL_FORMATS[format];
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<DrawPoint[]>([]);
  const drawing = useRef(false);

  const toCanvasPoint = (event: ReactPointerEvent): DrawPoint | undefined => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return undefined;
    return {
      x: ((event.clientX - rect.left) / rect.width) * dimensions.width,
      y: ((event.clientY - rect.top) / rect.height) * dimensions.height,
    };
  };

  const handleDown = (event: ReactPointerEvent) => {
    const point = toCanvasPoint(event);
    if (!point) return;
    event.preventDefault();
    event.stopPropagation();
    (event.target as Element).setPointerCapture?.(event.pointerId);
    drawing.current = true;
    if (settings.tool === "eraser") {
      onErase(point);
      return;
    }
    setPoints([point]);
  };

  const handleMove = (event: ReactPointerEvent) => {
    if (!drawing.current) return;
    const point = toCanvasPoint(event);
    if (!point) return;
    if (settings.tool === "eraser") {
      onErase(point);
      return;
    }
    setPoints((current) => [...current, point]);
  };

  const handleUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (settings.tool === "eraser") return;
    // Persist the simplified samples alongside the path so the eraser can split
    // this stroke later.
    const simplified = simplifyPoints(points);
    const path = pointsToPath(simplified, 0);
    setPoints([]);
    if (path) onCommit(path, simplified);
  };

  const preset = settings.tool === "eraser" ? DRAW_TOOL_PRESETS.pen : DRAW_TOOL_PRESETS[settings.tool];
  const previewPath = points.length > 0 ? pointsToPath(points) : "";

  return (
    <div
      ref={surfaceRef}
      // Sits above the elements so strokes are not intercepted by element drags.
      className="absolute inset-0 z-[200] touch-none"
      style={{ cursor: settings.tool === "eraser" ? "cell" : "crosshair" }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
    >
      {previewPath && (
        <svg
          aria-hidden="true"
          className="pointer-events-none h-full w-full"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="none"
          style={preset.blend ? { mixBlendMode: preset.blend } : undefined}
        >
          <path
            d={previewPath}
            fill="none"
            stroke={settings.color}
            strokeWidth={settings.width}
            strokeOpacity={preset.opacity}
            strokeLinecap={preset.cap}
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
