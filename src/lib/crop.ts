// Cropping a media element.
//
// A crop shrinks the element's box to the chosen region while leaving the picture
// itself exactly where it was — anything else is a resize, not a crop. The inset
// recorded here is what lets the renderer keep the image still: the box gets
// smaller, and the image is re-expressed as a proportion of the smaller box.

export type CropRect = {
  /** Fractions of the element box, 0-1, measured from its top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CropInset = { top: number; right: number; bottom: number; left: number };

/** Smallest crop allowed, as a fraction of the box, so a slip cannot erase it. */
export const MIN_CROP_FRACTION = 0.08;

export function clampCropRect(rect: CropRect): CropRect {
  const width = Math.min(1, Math.max(MIN_CROP_FRACTION, rect.width));
  const height = Math.min(1, Math.max(MIN_CROP_FRACTION, rect.height));
  return {
    width,
    height,
    x: Math.min(Math.max(0, rect.x), 1 - width),
    y: Math.min(Math.max(0, rect.y), 1 - height),
  };
}

/** The rect a drag between two corners describes, normalised. */
export function rectFromPoints(a: { x: number; y: number }, b: { x: number; y: number }): CropRect {
  return clampCropRect({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  });
}

export type CropTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
  cropX: number;
  cropY: number;
  crop?: CropInset;
};

/**
 * Applies a crop, returning the element's new box and the inset describing how far
 * the picture now extends past it.
 *
 * The inset composes with any earlier crop, so cropping twice is the same as
 * cropping once to the combined region.
 */
export function applyCrop(element: CropTarget, rect: CropRect): {
  x: number;
  y: number;
  width: number;
  height: number;
  crop: CropInset;
} {
  const safe = clampCropRect(rect);
  const previous = element.crop ?? { top: 0, right: 0, bottom: 0, left: 0 };

  // The picture's full extent, in units of the current box.
  const spanX = 1 + previous.left + previous.right;
  const spanY = 1 + previous.top + previous.bottom;

  return {
    x: element.x + safe.x * element.width,
    y: element.y + safe.y * element.height,
    width: element.width * safe.width,
    height: element.height * safe.height,
    crop: {
      // Distances from the new box to the picture's edges, expressed against the
      // new box's own size.
      left: (previous.left + safe.x) / safe.width,
      right: (previous.right + (1 - safe.x - safe.width)) / safe.width,
      top: (previous.top + safe.y) / safe.height,
      bottom: (previous.bottom + (1 - safe.y - safe.height)) / safe.height,
    },
  };
}

/** Geometry for the media inside a cropped box, as percentages of that box. */
export function croppedMediaFrame(crop: CropInset | undefined, zoom: number, cropX: number, cropY: number): {
  width: number;
  height: number;
  left: number;
  top: number;
} {
  const scale = Math.max(0.2, Math.min(4, zoom));
  if (!crop) {
    // Uncropped: the existing pan rule, where slack is shared by position.
    const slack = 100 - scale * 100;
    return { width: scale * 100, height: scale * 100, left: slack * (cropX / 100), top: slack * (cropY / 100) };
  }

  const width = (1 + crop.left + crop.right) * scale * 100;
  const height = (1 + crop.top + crop.bottom) * scale * 100;
  return {
    width,
    height,
    // Anchored by the inset rather than by pan: the picture must stay exactly
    // where it was when the crop was taken.
    left: -crop.left * scale * 100,
    top: -crop.top * scale * 100,
  };
}
