export type EditorialFormat = "portrait" | "square" | "landscape" | "spread";
export type EditorialTemplateId = "fashion-cover" | "new-arrivals" | "catalog" | "collection-story" | "magazine-spread";
export type EditorialElementType = "product" | "image" | "video" | "text" | "shape";
export type EditorialTextAlign = "left" | "center" | "right";
export type EditorialImageFit = "cover" | "contain";
export type EditorialShapeKind = "rectangle" | "ellipse" | "line" | "heart" | "star" | "clover" | "diamond" | "triangle" | "arch" | "blob";
export type EditorialImageMask = "rectangle" | "rounded" | "circle" | "oval" | "heart" | "star" | "clover" | "diamond" | "arch";

export type EditorialElementBase = {
  id: string;
  type: EditorialElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  locked: boolean;
  hidden: boolean;
};

export type EditorialProductElement = EditorialElementBase & {
  type: "product";
  productId: string;
  fit: EditorialImageFit;
  cropX: number;
  cropY: number;
  zoom: number;
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
  shadow: "none" | "soft" | "strong";
  mask: EditorialImageMask;
};

export type EditorialImageElement = EditorialElementBase & {
  type: "image";
  src: string;
  fit: EditorialImageFit;
  cropX: number;
  cropY: number;
  zoom: number;
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
  shadow: "none" | "soft" | "strong";
  mask: EditorialImageMask;
};

export type EditorialVideoElement = EditorialElementBase & {
  type: "video";
  src: string;
  fit: EditorialImageFit;
  cropX: number;
  cropY: number;
  zoom: number;
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
  shadow: "none" | "soft" | "strong";
  mask: EditorialImageMask;
};

export type EditorialTextElement = EditorialElementBase & {
  type: "text";
  content: string;
  fontFamily: "headline" | "sans" | "serif";
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  italic: boolean;
  lineHeight: number;
  letterSpacing: number;
  align: EditorialTextAlign;
  color: string;
  backgroundColor: string;
  padding: number;
};

export type EditorialShapeElement = EditorialElementBase & {
  type: "shape";
  shape: EditorialShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
};

export type EditorialElement = EditorialProductElement | EditorialImageElement | EditorialVideoElement | EditorialTextElement | EditorialShapeElement;

export type EditorialPageDesign = {
  version: 1;
  format: EditorialFormat;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundOpacity: number;
  showGuides: boolean;
  elements: EditorialElement[];
};

export const EDITORIAL_FORMATS: Record<EditorialFormat, { width: number; height: number; label: string }> = {
  portrait: { width: 1000, height: 1250, label: "Portrait 4:5" },
  square: { width: 1000, height: 1000, label: "Square 1:1" },
  landscape: { width: 1200, height: 800, label: "Landscape 3:2" },
  spread: { width: 1600, height: 900, label: "Magazine spread" },
};

export const EDITORIAL_SHAPES: Array<{ id: EditorialShapeKind; label: string; mood: "classic" | "expressive" }> = [
  { id: "rectangle", label: "Rectangle", mood: "classic" },
  { id: "ellipse", label: "Ellipse", mood: "classic" },
  { id: "line", label: "Line", mood: "classic" },
  { id: "diamond", label: "Diamond", mood: "classic" },
  { id: "triangle", label: "Triangle", mood: "classic" },
  { id: "arch", label: "Arch", mood: "classic" },
  { id: "heart", label: "Heart", mood: "expressive" },
  { id: "star", label: "Star", mood: "expressive" },
  { id: "clover", label: "Clover", mood: "expressive" },
  { id: "blob", label: "Organic", mood: "expressive" },
];

export const EDITORIAL_IMAGE_MASKS: Array<{ id: EditorialImageMask; label: string }> = [
  { id: "rectangle", label: "Rectangle" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
  { id: "oval", label: "Oval" },
  { id: "arch", label: "Arch" },
  { id: "heart", label: "Heart" },
  { id: "star", label: "Star" },
  { id: "clover", label: "Clover" },
  { id: "diamond", label: "Diamond" },
];

export const EDITORIAL_VECTOR_PATHS: Partial<Record<EditorialShapeKind | EditorialImageMask, string>> = {
  heart: "M .5 .94 C .38 .82 .07 .62 .07 .33 C .07 .11 .33 .04 .5 .25 C .67 .04 .93 .11 .93 .33 C .93 .62 .62 .82 .5 .94 Z",
  star: "M .5 .03 L .62 .36 L .97 .36 L .69 .57 L .8 .92 L .5 .71 L .2 .92 L .31 .57 L .03 .36 L .38 .36 Z",
  clover: "M .5 .49 C .32 .49 .16 .39 .16 .23 C .16 .07 .39 .03 .5 .22 C .61 .03 .84 .07 .84 .23 C .84 .39 .68 .49 .5 .49 C .68 .49 .84 .61 .84 .77 C .84 .93 .61 .97 .5 .78 C .39 .97 .16 .93 .16 .77 C .16 .61 .32 .49 .5 .49 Z",
  diamond: "M .5 .02 L .98 .5 L .5 .98 L .02 .5 Z",
  triangle: "M .5 .03 L .98 .96 L .02 .96 Z",
  arch: "M .06 1 L .06 .48 A .44 .48 0 0 1 .94 .48 L .94 1 Z",
  blob: "M .53 .04 C .76 .02 .96 .19 .93 .43 C .9 .68 .78 .93 .52 .96 C .26 .99 .04 .81 .06 .55 C .08 .29 .27 .06 .53 .04 Z",
};

export const EDITORIAL_TEMPLATES: Array<{ id: EditorialTemplateId; label: string; description: string; format: EditorialFormat }> = [
  { id: "fashion-cover", label: "Fashion cover", description: "Bold masthead and hero image", format: "portrait" },
  { id: "new-arrivals", label: "New arrivals", description: "Layered campaign composition", format: "landscape" },
  { id: "catalog", label: "Collection grid", description: "Structured product story", format: "landscape" },
  { id: "collection-story", label: "Collection story", description: "Editorial image and product notes", format: "portrait" },
  { id: "magazine-spread", label: "Magazine spread", description: "Two-page fashion feature", format: "spread" },
];

let elementSequence = 0;

export function makeEditorialElementId(prefix = "element") {
  elementSequence += 1;
  return `${prefix}-${Date.now()}-${elementSequence}`;
}

function baseElement(type: EditorialElementType, name: string, patch: Partial<EditorialElementBase> = {}): EditorialElementBase {
  return {
    id: makeEditorialElementId(type),
    type,
    name,
    x: 80,
    y: 80,
    width: 300,
    height: 360,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    locked: false,
    hidden: false,
    ...patch,
  };
}

export function createProductElement(productId: string, index = 0): EditorialProductElement {
  return {
    ...baseElement("product", `Product ${index + 1}`, { x: 90 + (index % 3) * 250, y: 260 + Math.floor(index / 3) * 330, zIndex: index + 1 }),
    type: "product",
    productId,
    fit: "cover",
    cropX: 50,
    cropY: 50,
    zoom: 1,
    borderRadius: 8,
    borderColor: "#ffffff",
    borderWidth: 0,
    shadow: "soft",
    mask: "rectangle",
  };
}

export function createImageElement(src: string, mask: EditorialImageMask = "rectangle"): EditorialImageElement {
  return {
    ...baseElement("image", "Uploaded image", { x: 120, y: 180, width: 420, height: mask === "circle" ? 420 : 520, zIndex: 20 }),
    type: "image",
    src,
    fit: "cover",
    cropX: 50,
    cropY: 50,
    zoom: 1,
    borderRadius: 0,
    borderColor: "#ffffff",
    borderWidth: 0,
    shadow: "none",
    mask,
  };
}

export function createVideoElement(src: string, mask: EditorialImageMask = "rectangle"): EditorialVideoElement {
  return {
    ...baseElement("video", "Uploaded video", { x: 120, y: 180, width: 420, height: mask === "circle" ? 420 : 520, zIndex: 20 }),
    type: "video",
    src,
    fit: "cover",
    cropX: 50,
    cropY: 50,
    zoom: 1,
    borderRadius: 0,
    borderColor: "#ffffff",
    borderWidth: 0,
    shadow: "none",
    mask,
  };
}

export function createTextElement(content = "Add your story", preset: "title" | "subtitle" | "body" = "title"): EditorialTextElement {
  const size = preset === "title" ? 72 : preset === "subtitle" ? 34 : 22;
  return {
    ...baseElement("text", preset === "title" ? "Headline" : preset === "subtitle" ? "Subheading" : "Body copy", { x: 70, y: 70, width: preset === "body" ? 430 : 700, height: preset === "title" ? 110 : 80, zIndex: 50 }),
    type: "text",
    content,
    fontFamily: preset === "body" ? "sans" : "headline",
    fontSize: size,
    fontWeight: preset === "body" ? 400 : 600,
    italic: false,
    lineHeight: 1.05,
    letterSpacing: preset === "subtitle" ? 3 : 0,
    align: "left",
    color: "#29445f",
    backgroundColor: "transparent",
    padding: 0,
  };
}

export function createShapeElement(shape: EditorialShapeKind = "rectangle"): EditorialShapeElement {
  const label = EDITORIAL_SHAPES.find((item) => item.id === shape)?.label ?? "Shape";
  return {
    ...baseElement("shape", shape === "rectangle" ? "Color block" : label, { x: 180, y: 200, width: 360, height: shape === "line" ? 8 : 300, zIndex: 0 }),
    type: "shape",
    shape,
    fill: shape === "line" ? "#29445f" : "#b9dfea",
    stroke: "transparent",
    strokeWidth: 0,
    borderRadius: shape === "ellipse" ? 999 : 0,
  };
}

function titleElements(title: string, format: EditorialFormat): EditorialTextElement[] {
  const dimensions = EDITORIAL_FORMATS[format];
  return [
    { ...createTextElement(title || "LOOKBOOK", "title"), x: 64, y: 48, width: dimensions.width - 128, fontSize: format === "spread" ? 82 : 68, letterSpacing: 2 },
  ];
}

export function applyEditorialTemplate(productIds: string[], title: string, templateId: EditorialTemplateId): EditorialPageDesign {
  const template = EDITORIAL_TEMPLATES.find((item) => item.id === templateId) ?? EDITORIAL_TEMPLATES[0];
  const format = template.format;
  const dimensions = EDITORIAL_FORMATS[format];
  const products = productIds.slice(0, 8).map((id, index) => createProductElement(id, index));
  const text = titleElements(title, format);
  let elements: EditorialElement[] = [];

  if (template.id === "fashion-cover") {
    const hero = products[0] ? { ...products[0], x: 90, y: 190, width: 820, height: 900, borderRadius: 0, shadow: "none" as const } : undefined;
    const issue = { ...createTextElement("NEW SEASON  •  EDITION 01", "subtitle"), x: 68, y: 1120, width: 620, height: 48, fontSize: 18, letterSpacing: 5 };
    elements = [...text, ...(hero ? [hero] : []), issue];
  } else if (template.id === "new-arrivals") {
    const first = products[0] ? { ...products[0], x: 60, y: 150, width: 500, height: 560, borderRadius: 0, shadow: "none" as const } : undefined;
    const second = products[1] ? { ...products[1], x: 620, y: 95, width: 310, height: 380, rotation: 4, borderRadius: 0 } : undefined;
    const third = products[2] ? { ...products[2], x: 880, y: 330, width: 250, height: 390, rotation: -3, borderRadius: 0 } : undefined;
    elements = [...text, ...(first ? [first] : []), ...(second ? [second] : []), ...(third ? [third] : []), { ...createTextElement("NEW ARRIVALS", "subtitle"), x: 610, y: 510, width: 450, fontSize: 42, letterSpacing: 8 }];
  } else if (template.id === "catalog") {
    elements = [...text, ...products.slice(0, 6).map((product, index) => ({ ...product, x: 55 + (index % 3) * 380, y: 170 + Math.floor(index / 3) * 300, width: 300, height: 245, borderRadius: 0, shadow: "none" as const }))];
  } else if (template.id === "collection-story") {
    const first = products[0] ? { ...products[0], x: 56, y: 170, width: 560, height: 760, borderRadius: 0, shadow: "none" as const } : undefined;
    const second = products[1] ? { ...products[1], x: 660, y: 300, width: 280, height: 360, borderRadius: 0 } : undefined;
    elements = [...text, ...(first ? [first] : []), ...(second ? [second] : []), { ...createTextElement("A considered edit of pieces chosen for shape, texture, and ease.", "body"), x: 650, y: 700, width: 290, height: 180, fontSize: 24, lineHeight: 1.45 }];
  } else {
    const left = products[0] ? { ...products[0], x: 55, y: 115, width: 690, height: 720, borderRadius: 0, shadow: "none" as const } : undefined;
    const rightProducts = products.slice(1, 5).map((product, index) => ({ ...product, x: 860 + (index % 2) * 340, y: 170 + Math.floor(index / 2) * 340, width: 270, height: 270, borderRadius: 0, shadow: "none" as const }));
    elements = [...text, ...(left ? [left] : []), ...rightProducts, { ...createTextElement("THE EDIT", "subtitle"), x: 880, y: 70, width: 500, fontSize: 34, letterSpacing: 9 }];
  }

  return {
    version: 1,
    format,
    backgroundColor: "#fffaf0",
    backgroundOpacity: 1,
    showGuides: true,
    elements: elements.map((element, index) => ({ ...element, zIndex: index })),
  };
}

export function createEditorialPage(productIds: string[], title: string, templateId: EditorialTemplateId = "fashion-cover") {
  return applyEditorialTemplate(productIds, title, templateId);
}

export function normalizeEditorialPage(value: EditorialPageDesign | undefined, productIds: string[], title: string): EditorialPageDesign {
  if (!value || value.version !== 1 || !Array.isArray(value.elements)) return createEditorialPage(productIds, title);
  const validMasks = new Set(EDITORIAL_IMAGE_MASKS.map((item) => item.id));
  const validShapes = new Set(EDITORIAL_SHAPES.map((item) => item.id));
  let changed = false;
  const elements = value.elements.filter((element) => element && typeof element.id === "string" && typeof element.type === "string").map((element) => {
    if ((element.type === "product" || element.type === "image" || element.type === "video") && !validMasks.has(element.mask)) {
      changed = true;
      return { ...element, mask: "rectangle" as const };
    }
    if (element.type === "shape" && !validShapes.has(element.shape)) {
      changed = true;
      return { ...element, shape: "rectangle" as const };
    }
    return element;
  });
  if (elements.length !== value.elements.length) changed = true;
  const backgroundColor = value.backgroundColor || "#fffaf0";
  const backgroundOpacity = Number.isFinite(value.backgroundOpacity) ? value.backgroundOpacity : 1;
  const showGuides = value.showGuides ?? true;
  if (backgroundColor !== value.backgroundColor || backgroundOpacity !== value.backgroundOpacity || showGuides !== value.showGuides) changed = true;
  if (!changed) return value;
  return { ...value, backgroundColor, backgroundOpacity, showGuides, elements };
}

export function editorialProductIds(design?: EditorialPageDesign) {
  if (!design) return [];
  return Array.from(new Set(design.elements.filter((element): element is EditorialProductElement => element.type === "product").map((element) => element.productId)));
}

export function updateEditorialElement(design: EditorialPageDesign, elementId: string, patch: Partial<EditorialElement>): EditorialPageDesign {
  return { ...design, elements: design.elements.map((element) => element.id === elementId ? { ...element, ...patch } as EditorialElement : element) };
}

export function removeEditorialElement(design: EditorialPageDesign, elementId: string): EditorialPageDesign {
  return { ...design, elements: design.elements.filter((element) => element.id !== elementId) };
}

export function duplicateEditorialElement(design: EditorialPageDesign, elementId: string): { design: EditorialPageDesign; elementId?: string } {
  const source = design.elements.find((element) => element.id === elementId);
  if (!source) return { design };
  const copy = { ...source, id: makeEditorialElementId(source.type), name: `${source.name} copy`, x: source.x + 24, y: source.y + 24, zIndex: Math.max(0, ...design.elements.map((element) => element.zIndex)) + 1 } as EditorialElement;
  return { design: { ...design, elements: [...design.elements, copy] }, elementId: copy.id };
}

export function reorderEditorialElement(design: EditorialPageDesign, elementId: string, direction: "front" | "forward" | "backward" | "back"): EditorialPageDesign {
  const ordered = [...design.elements].sort((a, b) => a.zIndex - b.zIndex);
  const index = ordered.findIndex((element) => element.id === elementId);
  if (index < 0) return design;
  const target = direction === "front" ? ordered.length - 1 : direction === "back" ? 0 : direction === "forward" ? Math.min(ordered.length - 1, index + 1) : Math.max(0, index - 1);
  const [element] = ordered.splice(index, 1);
  ordered.splice(target, 0, element);
  return { ...design, elements: ordered.map((item, itemIndex) => ({ ...item, zIndex: itemIndex })) };
}

export function clampEditorialElement(element: EditorialElement, format: EditorialFormat): EditorialElement {
  const { width, height } = EDITORIAL_FORMATS[format];
  const nextWidth = Math.max(24, Math.min(width, element.width));
  const nextHeight = Math.max(12, Math.min(height, element.height));
  return {
    ...element,
    width: nextWidth,
    height: nextHeight,
    x: Math.max(-nextWidth * 0.8, Math.min(width - nextWidth * 0.2, element.x)),
    y: Math.max(-nextHeight * 0.8, Math.min(height - nextHeight * 0.2, element.y)),
  };
}

export type EditorialSnapGuides = { x?: number; y?: number };

function nearestSnap(sources: number[], targets: number[], threshold: number) {
  let match: { delta: number; target: number } | undefined;
  for (const source of sources) {
    for (const target of targets) {
      const delta = target - source;
      if (Math.abs(delta) <= threshold && (!match || Math.abs(delta) < Math.abs(match.delta))) match = { delta, target };
    }
  }
  return match;
}

export function snapEditorialElement(element: EditorialElement, format: EditorialFormat, peers: EditorialElement[], threshold = 8): { element: EditorialElement; guides: EditorialSnapGuides } {
  const dimensions = EDITORIAL_FORMATS[format];
  const xTargets = [0, dimensions.width / 2, dimensions.width];
  const yTargets = [0, dimensions.height / 2, dimensions.height];
  for (const peer of peers) {
    if (peer.hidden || peer.id === element.id) continue;
    xTargets.push(peer.x, peer.x + peer.width / 2, peer.x + peer.width);
    yTargets.push(peer.y, peer.y + peer.height / 2, peer.y + peer.height);
  }
  const xMatch = nearestSnap([element.x, element.x + element.width / 2, element.x + element.width], xTargets, threshold);
  const yMatch = nearestSnap([element.y, element.y + element.height / 2, element.y + element.height], yTargets, threshold);
  return {
    element: { ...element, x: element.x + (xMatch?.delta ?? 0), y: element.y + (yMatch?.delta ?? 0) },
    guides: { x: xMatch?.target, y: yMatch?.target },
  };
}

export function normalizeEditorialRotation(rotation: number) {
  return ((rotation + 180) % 360 + 360) % 360 - 180;
}
