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

/** Shortest distance from a point to the segment a→b. */
export function distanceToSegment(point: DrawPoint, a: DrawPoint, b: DrawPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  // Projection of the point onto the segment, clamped to its ends.
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

/**
 * Splits a stroke around an eraser touch, returning the runs that survive.
 *
 * Tests the eraser against the stroke's *segments*, not just its stored samples:
 * sample spacing varies with drawing speed, so point-only testing misses strokes
 * whose samples happen to fall either side of the eraser.
 */
export function splitStrokeByEraser(points: DrawPoint[], center: DrawPoint, radius: number): DrawPoint[][] {
  const runs: DrawPoint[][] = [];
  let current: DrawPoint[] = [];
  const flush = () => {
    // A single surviving point cannot be drawn as a line, so drop stubs.
    if (current.length > 1) runs.push(current);
    current = [];
  };

  const erased = points.map((point) => Math.hypot(point.x - center.x, point.y - center.y) <= radius);

  for (let i = 0; i < points.length; i += 1) {
    if (erased[i]) {
      flush();
      continue;
    }
    current.push(points[i]);
    const next = points[i + 1];
    // Cut when the span to the next sample passes under the eraser, even though
    // neither endpoint does.
    if (next && !erased[i + 1] && distanceToSegment(center, points[i], next) <= radius) {
      flush();
    }
  }
  flush();

  return runs;
}

/** True when the eraser touches the stroke anywhere along its length. */
export function strokeIntersectsEraser(points: DrawPoint[], center: DrawPoint, radius: number): boolean {
  if (points.length === 1) return Math.hypot(points[0].x - center.x, points[0].y - center.y) <= radius;
  for (let i = 0; i < points.length - 1; i += 1) {
    if (distanceToSegment(center, points[i], points[i + 1]) <= radius) return true;
  }
  return false;
}

/**
 * Fills in the gap between two eraser positions.
 *
 * Pointer events during a fast drag can be tens of pixels apart, which would let
 * the eraser jump straight over a stroke without ever testing it.
 */
export function interpolateEraserPath(from: DrawPoint, to: DrawPoint, step: number): DrawPoint[] {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.floor(distance / Math.max(1, step));
  if (steps <= 0) return [to];
  const points: DrawPoint[] = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    points.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
  }
  // Guarantee the destination is tested even when it lands mid-step.
  const last = points[points.length - 1];
  if (!last || last.x !== to.x || last.y !== to.y) points.push(to);
  return points;
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
