import { describe, expect, it } from "vitest";

import { MIN_CROP_FRACTION, applyCrop, clampCropRect, croppedMediaFrame, rectFromPoints } from "./crop";

const box = { x: 100, y: 200, width: 400, height: 300, cropX: 50, cropY: 50 };

describe("clampCropRect", () => {
  it("keeps a rect inside the box", () => {
    expect(clampCropRect({ x: -0.5, y: 1.2, width: 0.5, height: 0.5 })).toEqual({ x: 0, y: 0.5, width: 0.5, height: 0.5 });
  });

  it("refuses a crop too small to recover from", () => {
    const tiny = clampCropRect({ x: 0.5, y: 0.5, width: 0.001, height: 0 });
    expect(tiny.width).toBe(MIN_CROP_FRACTION);
    expect(tiny.height).toBe(MIN_CROP_FRACTION);
  });
});

describe("rectFromPoints", () => {
  it("normalises a drag made in any direction", () => {
    const downRight = rectFromPoints({ x: 0.2, y: 0.3 }, { x: 0.7, y: 0.8 });
    const upLeft = rectFromPoints({ x: 0.7, y: 0.8 }, { x: 0.2, y: 0.3 });

    expect(downRight).toEqual(upLeft);
    expect(downRight.x).toBeCloseTo(0.2, 5);
    expect(downRight.width).toBeCloseTo(0.5, 5);
  });
});

describe("applyCrop", () => {
  it("shrinks the box to the chosen region", () => {
    const next = applyCrop(box, { x: 0.25, y: 0.5, width: 0.5, height: 0.5 });

    expect(next.x).toBe(200);
    expect(next.y).toBe(350);
    expect(next.width).toBe(200);
    expect(next.height).toBe(150);
  });

  it("records how far the picture extends past the new box", () => {
    const next = applyCrop(box, { x: 0.25, y: 0.25, width: 0.5, height: 0.5 });

    // A quarter was trimmed each side, which is half of the remaining half.
    expect(next.crop.left).toBeCloseTo(0.5, 5);
    expect(next.crop.right).toBeCloseTo(0.5, 5);
    expect(next.crop.top).toBeCloseTo(0.5, 5);
    expect(next.crop.bottom).toBeCloseTo(0.5, 5);
  });

  // Cropping twice must equal cropping once to the combined region, or repeated
  // crops would drift the picture.
  it("composes with an earlier crop", () => {
    const once = applyCrop(box, { x: 0.25, y: 0.25, width: 0.5, height: 0.5 });
    const twice = applyCrop({ ...box, ...once }, { x: 0, y: 0, width: 0.5, height: 1 });
    const direct = applyCrop(box, { x: 0.25, y: 0.25, width: 0.25, height: 0.5 });

    expect(twice.x).toBeCloseTo(direct.x, 5);
    expect(twice.width).toBeCloseTo(direct.width, 5);
    expect(twice.crop.top).toBeCloseTo(direct.crop.top, 5);
  });
});

describe("croppedMediaFrame", () => {
  it("leaves uncropped media on the pan rule", () => {
    expect(croppedMediaFrame(undefined, 1, 50, 50)).toEqual({ width: 100, height: 100, left: 0, top: 0 });
  });

  // The picture must not move when the box shrinks around it.
  it("keeps a cropped picture the same absolute size", () => {
    const crop = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 };
    const frame = croppedMediaFrame(crop, 1, 50, 50);

    // Half trimmed each side leaves the picture twice the box in both directions.
    expect(frame.width).toBeCloseTo(200, 5);
    expect(frame.height).toBeCloseTo(200, 5);
    expect(frame.left).toBeCloseTo(-50, 5);
    expect(frame.top).toBeCloseTo(-50, 5);
  });

  it("scales a cropped picture with zoom", () => {
    const crop = { top: 0, right: 1, bottom: 0, left: 0 };
    expect(croppedMediaFrame(crop, 2, 50, 50).width).toBeCloseTo(400, 5);
  });
});
