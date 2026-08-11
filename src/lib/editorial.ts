export type EditorialFormat = "portrait" | "square" | "landscape" | "spread";
export type EditorialTemplateId =
  | "fashion-cover"
  | "new-arrivals"
  | "catalog"
  | "collection-story"
  | "magazine-spread"
  | "featured"
  | "hero-stack"
  | "split-two"
  | "triptych"
  | "polaroid-scatter";
export type EditorialElementType = "product" | "image" | "video" | "text" | "shape" | "sticker" | "drawing" | "placeholder";
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
  /**
   * Set when this element occupies a layout slot. Retained so the frame can be
   * restored if the product is removed, keeping the layout a layout.
   */
  slot?: number;
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
  /** Set when this element occupies a layout slot (see product element). */
  slot?: number;
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
  /**
   * Legacy font slot, kept so documents authored before the font catalog keep
   * rendering. `fontId` takes precedence when present.
   */
  fontFamily: "headline" | "sans" | "serif";
  /** Font catalog id — see {@link FONT_CATALOG}. */
  fontId: EditorialFontId;
  /** Highlight drawn behind the glyphs (distinct from `backgroundColor`). */
  highlightColor: string;
  highlightStyle: EditorialHighlightStyle;
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

/**
 * A reserved frame in a layout, waiting for a product.
 *
 * Structurally matches an image element minus its source so templates can
 * position slots without caring whether they are filled yet.
 */
export type EditorialPlaceholderElement = EditorialElementBase & {
  type: "placeholder";
  /** Slot order within the template, used for labelling. */
  slot: number;
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

/** Emoji or icon sticker placed on the canvas. */
export type EditorialStickerElement = EditorialElementBase & {
  type: "sticker";
  kind: "emoji" | "icon";
  /** Emoji glyph, or an icon id resolved by the sticker catalog. */
  value: string;
  /** Optional resolved SVG source, for consistent cross-platform rendering. */
  src?: string;
  /** Tint applied to icon stickers. */
  color?: string;
};

export type EditorialDrawTool = "pen" | "marker" | "highlighter" | "brush" | "pencil";

/** A single committed stroke, in element-local coordinates. */
export type EditorialDrawingPath = {
  id: string;
  /** SVG path data in element-local units (viewBox `0 0 width height`). */
  d: string;
  /**
   * The samples the path was built from. Retained so the eraser can split a
   * stroke rather than delete it whole; without them only the rendered `d`
   * exists and partial erasing is not possible.
   */
  points?: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  tool: EditorialDrawTool;
  opacity: number;
};

/** A freehand drawing layer holding one or more strokes. */
export type EditorialDrawingElement = EditorialElementBase & {
  type: "drawing";
  paths: EditorialDrawingPath[];
  /** Local coordinate space the paths were authored in. */
  viewBoxWidth: number;
  viewBoxHeight: number;
};

export type EditorialElement =
  | EditorialProductElement
  | EditorialImageElement
  | EditorialVideoElement
  | EditorialTextElement
  | EditorialShapeElement
  | EditorialStickerElement
  | EditorialDrawingElement
  | EditorialPlaceholderElement;

/** Elements that render media and therefore support masks, crop, and borders. */
export type EditorialMediaElement = EditorialProductElement | EditorialImageElement | EditorialVideoElement;

export function isEditorialMediaElement(element: EditorialElement): element is EditorialMediaElement {
  return element.type === "product" || element.type === "image" || element.type === "video";
}

/** Elements drawn inside a framed box: media plus not-yet-filled slots. */
export function isEditorialFramedElement(element: EditorialElement): element is EditorialMediaElement | EditorialPlaceholderElement {
  return isEditorialMediaElement(element) || element.type === "placeholder";
}

export type EditorialPageDesign = {
  version: 1;
  format: EditorialFormat;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundOpacity: number;
  showGuides: boolean;
  elements: EditorialElement[];
};

export type EditorialHighlightStyle = "none" | "block" | "marker" | "underline";

export const EDITORIAL_HIGHLIGHT_STYLES: Array<{ id: EditorialHighlightStyle; label: string }> = [
  { id: "none", label: "None" },
  { id: "block", label: "Block" },
  { id: "marker", label: "Marker" },
  { id: "underline", label: "Underline" },
];

/**
 * Font catalog for the text tool. The three legacy ids (`headline`, `sans`,
 * `serif`) are kept first so documents authored before the catalog existed map
 * onto it without a translation table.
 */
export type EditorialFontId =
  | "headline"
  | "sans"
  | "serif"
  | "playfair"
  | "lora"
  | "dm-serif"
  | "inter"
  | "dm-sans"
  | "space-grotesk"
  | "work-sans"
  | "bebas"
  | "archivo-black"
  | "abril"
  | "caveat"
  | "dancing-script"
  | "jetbrains-mono";

export type EditorialFontCategory = "core" | "serif" | "sans" | "display" | "script" | "mono";

export const FONT_CATALOG: Array<{ id: EditorialFontId; label: string; category: EditorialFontCategory; stack: string }> = [
  { id: "headline", label: "Headline", category: "core", stack: "var(--font-headline), Georgia, serif" },
  { id: "sans", label: "Sans", category: "core", stack: "var(--font-body), Arial, sans-serif" },
  { id: "serif", label: "Serif", category: "core", stack: "Georgia, 'Times New Roman', serif" },
  { id: "playfair", label: "Playfair Display", category: "serif", stack: "var(--font-playfair), Georgia, serif" },
  { id: "lora", label: "Lora", category: "serif", stack: "var(--font-lora), Georgia, serif" },
  { id: "dm-serif", label: "DM Serif", category: "serif", stack: "var(--font-dm-serif), Georgia, serif" },
  // Reuses the app body face rather than loading Inter a second time.
  { id: "inter", label: "Inter", category: "sans", stack: "var(--font-body), Arial, sans-serif" },
  { id: "dm-sans", label: "DM Sans", category: "sans", stack: "var(--font-dm-sans), Arial, sans-serif" },
  { id: "space-grotesk", label: "Space Grotesk", category: "sans", stack: "var(--font-space-grotesk), Arial, sans-serif" },
  { id: "work-sans", label: "Work Sans", category: "sans", stack: "var(--font-work-sans), Arial, sans-serif" },
  { id: "bebas", label: "Bebas Neue", category: "display", stack: "var(--font-bebas), Impact, sans-serif" },
  { id: "archivo-black", label: "Archivo Black", category: "display", stack: "var(--font-archivo-black), Impact, sans-serif" },
  { id: "abril", label: "Abril Fatface", category: "display", stack: "var(--font-abril), Georgia, serif" },
  { id: "caveat", label: "Caveat", category: "script", stack: "var(--font-caveat), cursive" },
  { id: "dancing-script", label: "Dancing Script", category: "script", stack: "var(--font-dancing-script), cursive" },
  { id: "jetbrains-mono", label: "JetBrains Mono", category: "mono", stack: "var(--font-jetbrains-mono), monospace" },
];

const FONT_IDS = new Set<string>(FONT_CATALOG.map((font) => font.id));

export function editorialFontStack(fontId: EditorialFontId | undefined, fallback: "headline" | "sans" | "serif" = "sans") {
  const font = FONT_CATALOG.find((item) => item.id === fontId) ?? FONT_CATALOG.find((item) => item.id === fallback);
  return font?.stack ?? "var(--font-body), Arial, sans-serif";
}

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
  { id: "featured", label: "Featured", description: "Full-bleed hero with a strip of secondary pieces", format: "portrait" },
  { id: "hero-stack", label: "Hero stack", description: "One large piece above a pair", format: "portrait" },
  { id: "split-two", label: "Split", description: "Two pieces side by side", format: "square" },
  { id: "triptych", label: "Triptych", description: "Three equal columns", format: "landscape" },
  { id: "polaroid-scatter", label: "Scatter", description: "Loosely angled snapshots", format: "portrait" },
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
    fontId: preset === "body" ? "sans" : "headline",
    highlightColor: "transparent",
    highlightStyle: "none",
    fontSize: size,
    fontWeight: preset === "body" ? 400 : 600,
    italic: false,
    lineHeight: 1.05,
    letterSpacing: preset === "subtitle" ? 3 : 0,
    align: "left",
    color: "#00202e",
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
    fill: shape === "line" ? "#00202e" : "#ffd380",
    stroke: "transparent",
    strokeWidth: 0,
    borderRadius: shape === "ellipse" ? 999 : 0,
  };
}

export function createPlaceholderElement(index = 0): EditorialPlaceholderElement {
  return {
    ...baseElement("placeholder", `Slot ${index + 1}`, { x: 90 + (index % 3) * 250, y: 260 + Math.floor(index / 3) * 330, zIndex: index + 1 }),
    type: "placeholder",
    slot: index,
    fit: "cover",
    cropX: 50,
    cropY: 50,
    zoom: 1,
    borderRadius: 8,
    borderColor: "#ffffff",
    borderWidth: 0,
    shadow: "none",
    mask: "rectangle",
  };
}

/**
 * One element per layout slot: the product where the author has supplied one,
 * otherwise a reserved frame they can fill later.
 */
function slotElements(productIds: string[], count: number): Array<EditorialProductElement | EditorialPlaceholderElement> {
  return Array.from({ length: count }, (_, index) => (
    productIds[index] ? createProductElement(productIds[index], index) : createPlaceholderElement(index)
  ));
}

/** Geometry and framing shared between a slot and whatever fills it. */
function frameOf(element: EditorialElement) {
  const framed = isEditorialFramedElement(element) ? element : undefined;
  return {
    id: element.id,
    name: element.name,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    zIndex: element.zIndex,
    opacity: element.opacity,
    fit: framed?.fit ?? ("cover" as const),
    cropX: framed?.cropX ?? 50,
    cropY: framed?.cropY ?? 50,
    zoom: framed?.zoom ?? 1,
    borderRadius: framed?.borderRadius ?? 0,
    borderColor: framed?.borderColor ?? "#ffffff",
    borderWidth: framed?.borderWidth ?? 0,
    shadow: framed?.shadow ?? ("none" as const),
    mask: framed?.mask ?? ("rectangle" as const),
  };
}

/** Replaces a reserved frame with a product, keeping the frame's geometry. */
export function fillPlaceholderWithProduct(design: EditorialPageDesign, placeholderId: string, productId: string): EditorialPageDesign {
  const placeholder = design.elements.find((element) => element.id === placeholderId);
  if (!placeholder || placeholder.type !== "placeholder") return design;
  const product: EditorialProductElement = {
    ...createProductElement(productId, placeholder.slot),
    ...frameOf(placeholder),
    slot: placeholder.slot,
  };
  return { ...design, elements: design.elements.map((element) => (element.id === placeholderId ? product : element)) };
}

/** Replaces a reserved frame with an uploaded image, keeping the frame. */
export function fillPlaceholderWithImage(design: EditorialPageDesign, placeholderId: string, src: string): EditorialPageDesign {
  const placeholder = design.elements.find((element) => element.id === placeholderId);
  if (!placeholder || placeholder.type !== "placeholder") return design;
  const image: EditorialImageElement = {
    ...createImageElement(src),
    ...frameOf(placeholder),
    slot: placeholder.slot,
  };
  return { ...design, elements: design.elements.map((element) => (element.id === placeholderId ? image : element)) };
}

/** True for an element that currently occupies a layout slot. */
export function isSlotElement(element: EditorialElement): element is (EditorialProductElement | EditorialImageElement) & { slot: number } {
  return (element.type === "product" || element.type === "image") && typeof element.slot === "number";
}

/**
 * Empties a filled slot back to a reserved frame, so a layout stays a layout
 * after its contents are removed rather than degrading into loose elements.
 */
export function clearSlot(design: EditorialPageDesign, elementId: string): EditorialPageDesign {
  const element = design.elements.find((item) => item.id === elementId);
  if (!element || !isSlotElement(element)) return design;
  const placeholder: EditorialPlaceholderElement = {
    ...createPlaceholderElement(element.slot),
    ...frameOf(element),
    slot: element.slot,
  };
  return { ...design, elements: design.elements.map((item) => (item.id === elementId ? placeholder : item)) };
}

/** The first unfilled slot, so newly added products land somewhere sensible. */
export function firstPlaceholder(design: EditorialPageDesign): EditorialPlaceholderElement | undefined {
  return design.elements
    .filter((element): element is EditorialPlaceholderElement => element.type === "placeholder")
    .sort((a, b) => a.slot - b.slot)[0];
}

export function createStickerElement(value: string, kind: "emoji" | "icon" = "emoji", options: { src?: string; color?: string } = {}): EditorialStickerElement {
  return {
    ...baseElement("sticker", kind === "emoji" ? "Emoji" : "Icon", { x: 220, y: 240, width: 160, height: 160, zIndex: 60 }),
    type: "sticker",
    kind,
    value,
    src: options.src,
    color: options.color,
  };
}

export function createDrawingElement(format: EditorialFormat = "portrait", paths: EditorialDrawingPath[] = []): EditorialDrawingElement {
  const { width, height } = EDITORIAL_FORMATS[format];
  return {
    ...baseElement("drawing", "Drawing", { x: 0, y: 0, width, height, zIndex: 70 }),
    type: "drawing",
    paths,
    viewBoxWidth: width,
    viewBoxHeight: height,
  };
}

export function makeEditorialDrawingPath(
  d: string,
  options: { color?: string; width?: number; tool?: EditorialDrawTool; opacity?: number; points?: Array<{ x: number; y: number }> } = {},
): EditorialDrawingPath {
  const tool = options.tool ?? "pen";
  return {
    id: makeEditorialElementId("stroke"),
    d,
    points: options.points,
    color: options.color ?? "#030125",
    width: options.width ?? 8,
    tool,
    opacity: options.opacity ?? (tool === "highlighter" ? 0.4 : 1),
  };
}

/** Appends a stroke to a drawing element without mutating the source. */
export function appendDrawingPath(element: EditorialDrawingElement, path: EditorialDrawingPath): EditorialDrawingElement {
  return { ...element, paths: [...element.paths, path] };
}

/** Removes strokes by id — the eraser's whole-stroke mode. */
export function eraseDrawingPaths(element: EditorialDrawingElement, pathIds: string[]): EditorialDrawingElement {
  if (pathIds.length === 0) return element;
  const remove = new Set(pathIds);
  const paths = element.paths.filter((path) => !remove.has(path.id));
  return paths.length === element.paths.length ? element : { ...element, paths };
}

function titleElements(title: string, format: EditorialFormat): EditorialTextElement[] {
  const dimensions = EDITORIAL_FORMATS[format];
  return [
    { ...createTextElement(title || "LOOKBOOK", "title"), x: 64, y: 48, width: dimensions.width - 128, fontSize: format === "spread" ? 82 : 68, letterSpacing: 2 },
  ];
}

/** How many product frames each layout reserves. */
const TEMPLATE_SLOTS: Record<EditorialTemplateId, number> = {
  "fashion-cover": 1,
  "new-arrivals": 3,
  catalog: 6,
  "collection-story": 2,
  "magazine-spread": 5,
  featured: 4,
  "hero-stack": 3,
  "split-two": 2,
  triptych: 3,
  "polaroid-scatter": 4,
};

export function applyEditorialTemplate(productIds: string[], title: string, templateId: EditorialTemplateId): EditorialPageDesign {
  const template = EDITORIAL_TEMPLATES.find((item) => item.id === templateId) ?? EDITORIAL_TEMPLATES[0];
  const format = template.format;
  const dimensions = EDITORIAL_FORMATS[format];
  // Slots are always produced, so a layout applied before any product is chosen
  // still reads as a layout rather than a blank page.
  const slots = slotElements(productIds, TEMPLATE_SLOTS[template.id] ?? 4);
  const text = titleElements(title, format);
  let elements: EditorialElement[] = [];

  if (template.id === "fashion-cover") {
    const hero = { ...slots[0], x: 90, y: 190, width: 820, height: 900, borderRadius: 0, shadow: "none" as const };
    const issue = { ...createTextElement("NEW SEASON  \u2022  EDITION 01", "subtitle"), x: 68, y: 1120, width: 620, height: 48, fontSize: 18, letterSpacing: 5 };
    elements = [...text, hero, issue];
  } else if (template.id === "new-arrivals") {
    const first = { ...slots[0], x: 60, y: 150, width: 500, height: 560, borderRadius: 0, shadow: "none" as const };
    const second = { ...slots[1], x: 620, y: 95, width: 310, height: 380, rotation: 4, borderRadius: 0 };
    const third = { ...slots[2], x: 880, y: 330, width: 250, height: 390, rotation: -3, borderRadius: 0 };
    elements = [...text, first, second, third, { ...createTextElement("NEW ARRIVALS", "subtitle"), x: 610, y: 510, width: 450, fontSize: 42, letterSpacing: 8 }];
  } else if (template.id === "catalog") {
    elements = [...text, ...slots.map((slot, index) => ({ ...slot, x: 55 + (index % 3) * 380, y: 170 + Math.floor(index / 3) * 300, width: 300, height: 245, borderRadius: 0, shadow: "none" as const }))];
  } else if (template.id === "collection-story") {
    const first = { ...slots[0], x: 56, y: 170, width: 560, height: 760, borderRadius: 0, shadow: "none" as const };
    const second = { ...slots[1], x: 660, y: 300, width: 280, height: 360, borderRadius: 0 };
    elements = [...text, first, second, { ...createTextElement("A considered edit of pieces chosen for shape, texture, and ease.", "body"), x: 650, y: 700, width: 290, height: 180, fontSize: 24, lineHeight: 1.45 }];
  } else if (template.id === "featured") {
    // Mirrors the long-standing FeaturedGuideArtwork composition: a full-bleed
    // hero, a legibility scrim, the title over the top, and a strip of
    // secondary pieces along the bottom.
    const hero = { ...slots[0], x: 0, y: 0, width: dimensions.width, height: dimensions.height, borderRadius: 0, shadow: "none" as const, fit: "cover" as const };
    const scrim = { ...createShapeElement("rectangle"), name: "Scrim", x: 0, y: 0, width: dimensions.width, height: dimensions.height, fill: "rgba(3, 1, 37, 0.42)", borderRadius: 0 };
    const heading = { ...createTextElement(title || "Featured", "title"), x: 56, y: 64, width: dimensions.width - 200, height: 190, fontSize: 76, lineHeight: 0.98, color: "#ffffff" };
    const caption = { ...createTextElement("A considered edit \u2014 the pieces worth knowing.", "body"), x: 56, y: 268, width: dimensions.width - 260, height: 110, fontSize: 24, lineHeight: 1.45, color: "rgba(255,255,255,0.92)" };
    const strip = slots.slice(1).map((slot, index) => ({
      ...slot,
      x: 56 + index * 250,
      y: dimensions.height - 286,
      width: 226,
      height: 226,
      borderRadius: 24,
      borderColor: "#ffffff",
      borderWidth: 8,
      shadow: "soft" as const,
    }));
    elements = [hero, scrim, heading, caption, ...strip];
  } else if (template.id === "hero-stack") {
    const hero = { ...slots[0], x: 56, y: 190, width: dimensions.width - 112, height: 620, borderRadius: 18, shadow: "none" as const };
    const pair = slots.slice(1).map((slot, index) => ({ ...slot, x: 56 + index * 452, y: 846, width: 436, height: 340, borderRadius: 18, shadow: "none" as const }));
    elements = [...text, hero, ...pair];
  } else if (template.id === "split-two") {
    const pair = slots.map((slot, index) => ({ ...slot, x: index * (dimensions.width / 2), y: 0, width: dimensions.width / 2, height: dimensions.height, borderRadius: 0, shadow: "none" as const, fit: "cover" as const }));
    elements = [...pair, { ...createTextElement(title || "Two ways", "title"), x: 60, y: dimensions.height - 190, width: dimensions.width - 120, height: 120, fontSize: 64, color: "#ffffff" }];
  } else if (template.id === "triptych") {
    const columnWidth = dimensions.width / 3;
    const columns = slots.map((slot, index) => ({ ...slot, x: index * columnWidth, y: 0, width: columnWidth, height: dimensions.height, borderRadius: 0, shadow: "none" as const, fit: "cover" as const }));
    elements = [...columns, { ...createTextElement(title || "THE EDIT", "subtitle"), x: 48, y: dimensions.height - 120, width: dimensions.width - 96, height: 64, fontSize: 34, letterSpacing: 9, color: "#ffffff" }];
  } else if (template.id === "polaroid-scatter") {
    const angles = [-6, 5, -3, 7];
    const scattered = slots.map((slot, index) => ({
      ...slot,
      x: 90 + (index % 2) * 400,
      y: 220 + Math.floor(index / 2) * 430,
      width: 380,
      height: 380,
      rotation: angles[index % angles.length],
      borderRadius: 6,
      borderColor: "#ffffff",
      borderWidth: 18,
      shadow: "soft" as const,
    }));
    elements = [...text, ...scattered];
  } else {
    const left = { ...slots[0], x: 55, y: 115, width: 690, height: 720, borderRadius: 0, shadow: "none" as const };
    const rightProducts = slots.slice(1).map((slot, index) => ({ ...slot, x: 860 + (index % 2) * 340, y: 170 + Math.floor(index / 2) * 340, width: 270, height: 270, borderRadius: 0, shadow: "none" as const }));
    elements = [...text, left, ...rightProducts, { ...createTextElement("THE EDIT", "subtitle"), x: 880, y: 70, width: 500, fontSize: 34, letterSpacing: 9 }];
  }

  return {
    version: 1,
    format,
    backgroundColor: "#fffdf9",
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
    if (element.type === "text") {
      // Documents authored before the font catalog have no `fontId`; derive it
      // from the legacy slot so the ids stay a single source of truth.
      const patch: Partial<EditorialTextElement> = {};
      if (!element.fontId || !FONT_IDS.has(element.fontId)) patch.fontId = element.fontFamily ?? "sans";
      if (typeof element.highlightColor !== "string") patch.highlightColor = "transparent";
      if (!element.highlightStyle) patch.highlightStyle = "none";
      if (Object.keys(patch).length > 0) {
        changed = true;
        return { ...element, ...patch };
      }
      return element;
    }
    if (element.type === "drawing") {
      const paths = Array.isArray(element.paths) ? element.paths.filter((path) => path && typeof path.d === "string") : [];
      const viewBoxWidth = Number.isFinite(element.viewBoxWidth) && element.viewBoxWidth > 0 ? element.viewBoxWidth : Math.max(1, element.width);
      const viewBoxHeight = Number.isFinite(element.viewBoxHeight) && element.viewBoxHeight > 0 ? element.viewBoxHeight : Math.max(1, element.height);
      if (paths.length !== (element.paths?.length ?? 0) || viewBoxWidth !== element.viewBoxWidth || viewBoxHeight !== element.viewBoxHeight) {
        changed = true;
        return { ...element, paths, viewBoxWidth, viewBoxHeight };
      }
      return element;
    }
    if (element.type === "sticker" && typeof element.value !== "string") {
      changed = true;
      const kind: EditorialStickerElement["kind"] = element.kind === "icon" ? "icon" : "emoji";
      return { ...element, value: "★", kind };
    }
    return element;
  });
  if (elements.length !== value.elements.length) changed = true;
  const backgroundColor = value.backgroundColor || "#fffdf9";
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
