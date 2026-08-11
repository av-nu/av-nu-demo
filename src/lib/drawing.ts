// Freehand stroke geometry.
//
// Kept dependency-free and centreline-based to match EditorialDrawingPath, which
// stores an SVG path plus a stroke width. A library such as perfect-freehand
// produces filled outline polygons instead, which would mean reworking the
// persisted drawing model; the trade-off is that stroke width is uniform rather
// than pressure-tapered.

export type DrawPoint = { x: number; y: number };

/** Drops points closer together than `minDistance` to keep paths compact. */
export function simplifyPoints(points: DrawPoint[], minDistance = 2): DrawPoint[] {
  if (points.length <= 2) return points;
  const result: DrawPoint[] = [points[0]];
  for (const point of points.slice(1)) {
    const last = result[result.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) >= minDistance) result.push(point);
  }
  const final = points[points.length - 1];
  const last = result[result.length - 1];
  if (last.x !== final.x || last.y !== final.y) result.push(final);
  return result;
}

/**
 * Builds a smoothed SVG path from raw pointer samples.
 *
 * Uses quadratic segments through the midpoints of consecutive samples, which
 * removes the visible faceting of a naive polyline without needing to fit
 * curves.
 */
export function pointsToPath(rawPoints: DrawPoint[], minDistance = 2): string {
  const points = simplifyPoints(rawPoints, minDistance);
  if (points.length === 0) return "";

  const round = (value: number) => Math.round(value * 100) / 100;

  // A single tap becomes a dot: a zero-length line renders with round caps.
  if (points.length === 1) {
    const { x, y } = points[0];
    return `M ${round(x)} ${round(y)} L ${round(x)} ${round(y)}`;
  }

  if (points.length === 2) {
    return `M ${round(points[0].x)} ${round(points[0].y)} L ${round(points[1].x)} ${round(points[1].y)}`;
  }

  let path = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q ${round(current.x)} ${round(current.y)} ${round(midX)} ${round(midY)}`;
  }
  const last = points[points.length - 1];
  path += ` L ${round(last.x)} ${round(last.y)}`;
  return path;
}

export type DrawToolPreset = {
  /** Default stroke width, in canvas units. */
  width: number;
  opacity: number;
  cap: "round" | "butt";
  /** Multiplied over the artwork beneath, the way a real highlighter behaves. */
  blend?: "multiply";
};

export const DRAW_TOOL_PRESETS: Record<"pen" | "marker" | "highlighter" | "brush" | "pencil", DrawToolPreset> = {
  pen: { width: 6, opacity: 1, cap: "round" },
  marker: { width: 16, opacity: 0.95, cap: "butt" },
  highlighter: { width: 34, opacity: 0.35, cap: "butt", blend: "multiply" },
  brush: { width: 24, opacity: 0.9, cap: "round" },
  pencil: { width: 4, opacity: 0.7, cap: "round" },
};
