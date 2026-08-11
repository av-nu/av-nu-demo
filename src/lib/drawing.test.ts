import { describe, expect, it } from "vitest";

import { DRAW_TOOL_PRESETS, distanceToSegment, interpolateEraserPath, pointsToPath, simplifyPoints, splitStrokeByEraser, strokeIntersectsEraser } from "./drawing";

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

  it("keeps the clipped remainder either side of the eraser", () => {
    const short = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }];

    // Clipping at the circle edge leaves a drawable run on each side, rather
    // than deleting the neighbouring spans along with the sample.
    expect(splitStrokeByEraser(short, { x: 10, y: 0 }, 5)).toEqual([
      [{ x: 0, y: 0 }, { x: 5, y: 0 }],
      [{ x: 15, y: 0 }, { x: 20, y: 0 }],
    ]);
  });

  it("drops remnants too short to draw", () => {
    // The eraser covers all but a sliver at each end.
    expect(splitStrokeByEraser([{ x: 0, y: 0 }, { x: 10, y: 0 }], { x: 5, y: 0 }, 20)).toEqual([]);
  });
});

describe("strokeIntersectsEraser", () => {
  it("detects a hit only when the stroke passes inside the radius", () => {
    const points = [{ x: 0, y: 0 }, { x: 50, y: 0 }];

    expect(strokeIntersectsEraser(points, { x: 52, y: 0 }, 5)).toBe(true);
    expect(strokeIntersectsEraser(points, { x: 200, y: 0 }, 5)).toBe(false);
  });

  // The cause of the eraser feeling unreliable: sample spacing varies with
  // drawing speed, so testing only the stored samples misses strokes whose
  // samples happen to sit either side of the eraser.
  it("hits a long span even when neither endpoint is inside the radius", () => {
    const sparse = [{ x: 0, y: 0 }, { x: 400, y: 0 }];

    expect(strokeIntersectsEraser(sparse, { x: 200, y: 0 }, 10)).toBe(true);
  });

  it("still misses when the span passes outside the radius", () => {
    const sparse = [{ x: 0, y: 0 }, { x: 400, y: 0 }];

    expect(strokeIntersectsEraser(sparse, { x: 200, y: 60 }, 10)).toBe(false);
  });
});

describe("distanceToSegment", () => {
  it("measures perpendicular distance to the span", () => {
    expect(distanceToSegment({ x: 50, y: 30 }, { x: 0, y: 0 }, { x: 100, y: 0 })).toBe(30);
  });

  it("clamps to the nearer endpoint beyond the span", () => {
    expect(distanceToSegment({ x: 130, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 0 })).toBe(30);
  });

  it("handles a zero-length span", () => {
    expect(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
  });
});

describe("interpolateEraserPath", () => {
  // Pointer events during a fast drag land far apart; without filling the gap the
  // eraser jumps straight over strokes.
  it("fills the gap between distant eraser positions", () => {
    const path = interpolateEraserPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 10);

    expect(path.length).toBeGreaterThan(5);
    expect(path[path.length - 1]).toEqual({ x: 100, y: 0 });
  });

  it("always includes the destination", () => {
    const path = interpolateEraserPath({ x: 0, y: 0 }, { x: 3, y: 4 }, 10);

    expect(path[path.length - 1]).toEqual({ x: 3, y: 4 });
  });
});

describe("splitStrokeByEraser with sparse samples", () => {
  it("cuts a long span that the eraser crosses mid-way", () => {
    const runs = splitStrokeByEraser(
      [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 800, y: 0 }],
      { x: 200, y: 0 },
      20,
    );

    // The crossed span is cut, leaving the far side intact.
    expect(runs.length).toBeGreaterThan(0);
    expect(runs.every((run) => run.length > 1)).toBe(true);
  });

  // The gap must match the eraser, not the sample spacing: discarding whole
  // samples used to delete everything between their neighbours.
  it("removes only the eraser's width, however sparse the samples", () => {
    const radius = 20;
    const runs = splitStrokeByEraser([{ x: 0, y: 0 }, { x: 1000, y: 0 }], { x: 500, y: 0 }, radius);

    expect(runs).toHaveLength(2);
    const gapStart = runs[0][runs[0].length - 1].x;
    const gapEnd = runs[1][0].x;
    expect(gapEnd - gapStart).toBeCloseTo(radius * 2, 5);
  });

  it("clips to the circle edge rather than the nearest sample", () => {
    const dense = Array.from({ length: 21 }, (_, i) => ({ x: i * 50, y: 0 }));
    const runs = splitStrokeByEraser(dense, { x: 500, y: 0 }, 30);

    expect(runs).toHaveLength(2);
    expect(runs[0][runs[0].length - 1].x).toBeCloseTo(470, 5);
    expect(runs[1][0].x).toBeCloseTo(530, 5);
  });

  it("keeps a stroke that only grazes outside the circle", () => {
    const runs = splitStrokeByEraser([{ x: 0, y: 100 }, { x: 1000, y: 100 }], { x: 500, y: 0 }, 30);

    expect(runs).toHaveLength(1);
    expect(runs[0]).toHaveLength(2);
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
