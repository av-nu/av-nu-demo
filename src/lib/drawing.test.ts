import { describe, expect, it } from "vitest";

import { DRAW_TOOL_PRESETS, pointsToPath, simplifyPoints, splitStrokeByEraser, strokeIntersectsEraser } from "./drawing";

describe("simplifyPoints", () => {
  it("drops samples closer than the minimum distance but keeps the endpoint", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0.5, y: 0 },
      { x: 1, y: 0 },
      { x: 20, y: 0 },
      { x: 20.2, y: 0 },
    ];

    const result = simplifyPoints(points, 2);

    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[result.length - 1]).toEqual({ x: 20.2, y: 0 });
    expect(result.length).toBeLessThan(points.length);
  });

  it("leaves very short input untouched", () => {
    const points = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
    expect(simplifyPoints(points)).toBe(points);
  });
});

describe("pointsToPath", () => {
  it("returns nothing for no input", () => {
    expect(pointsToPath([])).toBe("");
  });

  it("renders a single tap as a dot so round caps show it", () => {
    expect(pointsToPath([{ x: 5, y: 6 }])).toBe("M 5 6 L 5 6");
  });

  it("renders two points as a straight line", () => {
    expect(pointsToPath([{ x: 0, y: 0 }, { x: 10, y: 10 }])).toBe("M 0 0 L 10 10");
  });

  it("smooths longer strokes with quadratic segments", () => {
    const path = pointsToPath([
      { x: 0, y: 0 },
      { x: 10, y: 12 },
      { x: 24, y: 4 },
      { x: 40, y: 20 },
    ]);

    expect(path.startsWith("M 0 0")).toBe(true);
    expect(path).toContain("Q");
    expect(path.endsWith("L 40 20")).toBe(true);
  });

  it("keeps coordinates compact so persisted paths stay small", () => {
    const path = pointsToPath([
      { x: 0.123456, y: 0.987654 },
      { x: 10.555555, y: 12.111111 },
      { x: 24.999999, y: 4.4444 },
    ]);

    expect(path).not.toMatch(/\d\.\d{3,}/);
  });
});

describe("splitStrokeByEraser", () => {
  const line = Array.from({ length: 11 }, (_, i) => ({ x: i * 10, y: 0 }));

  it("splits a stroke into the runs either side of the eraser", () => {
    const runs = splitStrokeByEraser(line, { x: 50, y: 0 }, 12);

    expect(runs).toHaveLength(2);
    expect(runs[0][runs[0].length - 1].x).toBeLessThan(50);
    expect(runs[1][0].x).toBeGreaterThan(50);
  });

  it("trims from the end without splitting when the eraser hits a tail", () => {
    const runs = splitStrokeByEraser(line, { x: 100, y: 0 }, 12);

    expect(runs).toHaveLength(1);
    expect(runs[0][runs[0].length - 1].x).toBeLessThan(100);
  });

  it("returns nothing when the eraser covers the whole stroke", () => {
    expect(splitStrokeByEraser(line, { x: 50, y: 0 }, 500)).toEqual([]);
  });

  it("leaves the stroke intact when the eraser misses", () => {
    const runs = splitStrokeByEraser(line, { x: 50, y: 400 }, 12);

    expect(runs).toHaveLength(1);
    expect(runs[0]).toHaveLength(line.length);
  });

  it("drops single-point remnants that cannot be drawn", () => {
    const short = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }];
    // Erasing the middle leaves one point on each side — neither is a line.
    expect(splitStrokeByEraser(short, { x: 10, y: 0 }, 5)).toEqual([]);
  });
});

describe("strokeIntersectsEraser", () => {
  it("detects a hit only when a sample falls inside the radius", () => {
    const points = [{ x: 0, y: 0 }, { x: 50, y: 0 }];

    expect(strokeIntersectsEraser(points, { x: 52, y: 0 }, 5)).toBe(true);
    expect(strokeIntersectsEraser(points, { x: 200, y: 0 }, 5)).toBe(false);
  });
});

describe("draw tool presets", () => {
  it("gives the highlighter a wide, translucent, multiplying stroke", () => {
    const highlighter = DRAW_TOOL_PRESETS.highlighter;

    expect(highlighter.opacity).toBeLessThan(0.5);
    expect(highlighter.blend).toBe("multiply");
    expect(highlighter.width).toBeGreaterThan(DRAW_TOOL_PRESETS.pen.width);
  });

  it("keeps the pen opaque and the pencil lighter", () => {
    expect(DRAW_TOOL_PRESETS.pen.opacity).toBe(1);
    expect(DRAW_TOOL_PRESETS.pencil.opacity).toBeLessThan(1);
  });
});
