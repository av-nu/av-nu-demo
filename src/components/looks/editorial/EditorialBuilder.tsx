import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlignCenter, AlignHorizontalJustifyCenter, ArrowDown, ArrowUp, BringToFront, Copy, Eye, EyeOff, Film, ImagePlus, Layers3, Lock, LockOpen, MousePointer2, Redo2, RotateCw, SendToBack, Shapes, Trash2, Type, Undo2 } from "lucide-react";

import { EditorialColorPicker } from "@/components/looks/editorial/EditorialColorPicker";
import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import type { Product } from "@/data/mockProducts";
import {
  EDITORIAL_FORMATS,
  EDITORIAL_IMAGE_MASKS,
  EDITORIAL_SHAPES,
  EDITORIAL_TEMPLATES,
  applyEditorialTemplate,
  clampEditorialElement,
  createImageElement,
  createProductElement,
  createShapeElement,
  createTextElement,
  createVideoElement,
  duplicateEditorialElement,
  editorialProductIds,
  removeEditorialElement,
  reorderEditorialElement,
  normalizeEditorialRotation,
  snapEditorialElement,
  updateEditorialElement,
  type EditorialElement,
  type EditorialFormat,
  type EditorialImageMask,
  type EditorialPageDesign,
  type EditorialShapeKind,
  type EditorialSnapGuides,
  type EditorialTemplateId,
} from "@/lib/editorial";

function compressImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose an image file."));
      return;
    }
    if (file.size > 12_000_000) {
      reject(new Error("Images must be smaller than 12 MB."));
      return;
    }
    const image = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const longest = Math.max(image.naturalWidth, image.naturalHeight);
      const scale = Math.min(1, 1600 / longest);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Image processing is unavailable in this browser."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      const compressed = canvas.toDataURL("image/webp", 0.8);
      if (compressed === "data:,") {
        reject(new Error("This image could not be compressed."));
        return;
      }
      resolve(compressed);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This image could not be read."));
    };
    image.src = objectUrl;
  });
}

type Interaction = {
  action: "drag" | "resize" | "rotate";
  elementId: string;
  startX: number;
  startY: number;
  element: EditorialElement;
  rect: DOMRect;
};

type EditorialBuilderProps = {
  title: string;
  design: EditorialPageDesign;
  products: Product[];
  promptProducts?: Product[];
  onChangeAction: (design: EditorialPageDesign) => void;
  onAddPromptProduct?: (productId: string) => void;
  onBrowsePromptResults?: () => void;
};

function Button({ label, active = false, disabled = false, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:opacity-35 ${active ? "border-text bg-text text-bg" : "border-divider/70 bg-bg text-text/65 hover:border-text/30 hover:text-text"}`}>{children}</button>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-text/45">{children}</label>;
}

function NumberField({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  const formatted = String(Math.round(value * 100) / 100);
  const [draft, setDraft] = useState(formatted);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setDraft(formatted); }, [formatted]);
  const commitDraft = () => {
    focused.current = false;
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(formatted);
      return;
    }
    const next = Math.max(min, Math.min(max, parsed));
    setDraft(String(next));
    if (next !== value) onChange(next);
  };
  return <label className="min-w-0"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-text/40">{label}</span><input type="number" value={draft} min={min} max={max} step={step} onFocus={() => { focused.current = true; }} onChange={(event) => setDraft(event.target.value)} onBlur={commitDraft} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { setDraft(formatted); event.currentTarget.blur(); } }} className="h-9 w-full rounded-lg border border-divider/70 bg-bg px-2 text-xs text-text focus:border-accent/50 focus:outline-none" /></label>;
}

export function EditorialBuilder({ title, design, products, promptProducts = [], onChangeAction, onAddPromptProduct = () => undefined, onBrowsePromptResults = () => undefined }: EditorialBuilderProps) {
  const [present, setPresent] = useState(design);
  const [past, setPast] = useState<EditorialPageDesign[]>([]);
  const [future, setFuture] = useState<EditorialPageDesign[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [panel, setPanel] = useState<"design" | "add" | "layers">("design");
  const [zoom, setZoom] = useState(1);
  const [interaction, setInteraction] = useState<Interaction>();
  const [snapGuides, setSnapGuides] = useState<EditorialSnapGuides>();
  const [uploadError, setUploadError] = useState<string>();
  const [uploadMask, setUploadMask] = useState<EditorialImageMask>("rectangle");
  const canvasRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const videoUploadRef = useRef<HTMLInputElement>(null);
  const backgroundUploadRef = useRef<HTMLInputElement>(null);
  const presentRef = useRef(present);

  useEffect(() => { presentRef.current = present; }, [present]);
  useEffect(() => {
    if (design === presentRef.current) return;
    setPresent(design);
    presentRef.current = design;
    setPast([]);
    setFuture([]);
    setSelectedId(undefined);
  }, [design]);

  const selected = present.elements.find((element) => element.id === selectedId);
  const presentProductIds = editorialProductIds(present);
  const dimensions = EDITORIAL_FORMATS[present.format];

  const commit = useCallback((next: EditorialPageDesign, nextSelectedId?: string) => {
    setPast((current) => [...current.slice(-49), presentRef.current]);
    setFuture([]);
    setPresent(next);
    presentRef.current = next;
    onChangeAction(next);
    if (nextSelectedId !== undefined) setSelectedId(nextSelectedId);
  }, [onChangeAction]);

  const applyTransient = useCallback((next: EditorialPageDesign) => {
    setPresent(next);
    presentRef.current = next;
    onChangeAction(next);
  }, [onChangeAction]);

  const undo = useCallback(() => {
    setPast((current) => {
      const previous = current[current.length - 1];
      if (!previous) return current;
      setFuture((items) => [presentRef.current, ...items].slice(0, 50));
      setPresent(previous);
      presentRef.current = previous;
      onChangeAction(previous);
      setSelectedId(undefined);
      return current.slice(0, -1);
    });
  }, [onChangeAction]);

  const redo = useCallback(() => {
    setFuture((current) => {
      const next = current[0];
      if (!next) return current;
      setPast((items) => [...items.slice(-49), presentRef.current]);
      setPresent(next);
      presentRef.current = next;
      onChangeAction(next);
      setSelectedId(undefined);
      return current.slice(1);
    });
  }, [onChangeAction]);

  const patchSelected = useCallback((patch: Partial<EditorialElement>) => {
    if (!selectedId) return;
    const element = presentRef.current.elements.find((item) => item.id === selectedId);
    if (!element) return;
    const nextElement = clampEditorialElement({ ...element, ...patch } as EditorialElement, presentRef.current.format);
    commit(updateEditorialElement(presentRef.current, selectedId, nextElement));
  }, [commit, selectedId]);

  const removeSelected = useCallback(() => {
    if (!selectedId) return;
    commit(removeEditorialElement(presentRef.current, selectedId));
    setSelectedId(undefined);
  }, [commit, selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const result = duplicateEditorialElement(presentRef.current, selectedId);
    commit(result.design, result.elementId);
  }, [commit, selectedId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const editingText = target.matches("input, textarea, select, [contenteditable='true']");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if (editingText || !selectedId) return;
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        removeSelected();
        return;
      }
      const delta = event.shiftKey ? 10 : 2;
      const element = presentRef.current.elements.find((item) => item.id === selectedId);
      if (!element || element.locked) return;
      const patch = event.key === "ArrowLeft" ? { x: element.x - delta } : event.key === "ArrowRight" ? { x: element.x + delta } : event.key === "ArrowUp" ? { y: element.y - delta } : event.key === "ArrowDown" ? { y: element.y + delta } : undefined;
      if (patch) {
        event.preventDefault();
        commit(updateEditorialElement(presentRef.current, selectedId, clampEditorialElement({ ...element, ...patch }, presentRef.current.format)));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commit, redo, removeSelected, selectedId, undo]);

  useEffect(() => {
    if (!interaction) return;
    const handleMove = (event: PointerEvent) => {
      const scaleX = dimensions.width / interaction.rect.width;
      const scaleY = dimensions.height / interaction.rect.height;
      const dx = (event.clientX - interaction.startX) * scaleX;
      const dy = (event.clientY - interaction.startY) * scaleY;
      let nextElement: EditorialElement;
      if (interaction.action === "drag") {
        const candidate = clampEditorialElement({ ...interaction.element, x: interaction.element.x + dx, y: interaction.element.y + dy }, presentRef.current.format);
        if (presentRef.current.showGuides) {
          const snapped = snapEditorialElement(candidate, presentRef.current.format, presentRef.current.elements, 8 * Math.max(scaleX, scaleY));
          nextElement = clampEditorialElement(snapped.element, presentRef.current.format);
          setSnapGuides(snapped.guides);
        } else {
          nextElement = candidate;
        }
      } else if (interaction.action === "resize") {
        const width = Math.max(30, interaction.element.width + dx);
        const height = event.shiftKey ? width / (interaction.element.width / interaction.element.height) : Math.max(20, interaction.element.height + dy);
        nextElement = clampEditorialElement({ ...interaction.element, width, height }, presentRef.current.format);
      } else {
        const centerX = interaction.rect.left + ((interaction.element.x + interaction.element.width / 2) / dimensions.width) * interaction.rect.width;
        const centerY = interaction.rect.top + ((interaction.element.y + interaction.element.height / 2) / dimensions.height) * interaction.rect.height;
        const startAngle = Math.atan2(interaction.startY - centerY, interaction.startX - centerX);
        const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
        const rotation = normalizeEditorialRotation(interaction.element.rotation + ((angle - startAngle) * 180) / Math.PI);
        nextElement = { ...interaction.element, rotation: event.shiftKey ? Math.round(rotation / 15) * 15 : rotation };
      }
      applyTransient(updateEditorialElement(presentRef.current, interaction.elementId, nextElement));
    };
    const handleUp = () => { setInteraction(undefined); setSnapGuides(undefined); };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
    window.addEventListener("pointercancel", handleUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [applyTransient, dimensions.height, dimensions.width, interaction]);

  const startInteraction = (event: React.PointerEvent, elementId: string, action: Interaction["action"]) => {
    event.preventDefault();
    event.stopPropagation();
    const element = presentRef.current.elements.find((item) => item.id === elementId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!element || !rect) return;
    setSelectedId(elementId);
    if (element.locked) return;
    setPast((current) => [...current.slice(-49), presentRef.current]);
    setFuture([]);
    setInteraction({ action, elementId, startX: event.clientX, startY: event.clientY, element, rect });
  };

  const addElement = (element: EditorialElement) => {
    const maxZ = Math.max(0, ...present.elements.map((item) => item.zIndex));
    const nextElement = { ...element, zIndex: maxZ + 1 } as EditorialElement;
    commit({ ...present, elements: [...present.elements, nextElement] }, nextElement.id);
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploadError(undefined);
    try {
      addElement(createImageElement(await compressImage(file), uploadMask));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const handleVideoUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setUploadError("Choose a video file.");
      return;
    }
    if (file.size > 15_000_000) {
      setUploadError("Video clips must be smaller than 15 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") addElement(createVideoElement(reader.result, uploadMask));
      if (videoUploadRef.current) videoUploadRef.current.value = "";
    };
    reader.onerror = () => setUploadError("This video could not be read.");
    reader.readAsDataURL(file);
  };

  const handleBackgroundUpload = async (file?: File) => {
    if (!file) return;
    setUploadError(undefined);
    try {
      commit({ ...presentRef.current, backgroundImage: await compressImage(file), backgroundOpacity: 1 });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Background upload failed.");
    } finally {
      if (backgroundUploadRef.current) backgroundUploadRef.current.value = "";
    }
  };

  const setFormat = (format: EditorialFormat) => {
    if (format === present.format) return;
    const previous = EDITORIAL_FORMATS[present.format];
    const next = EDITORIAL_FORMATS[format];
    const scaleX = next.width / previous.width;
    const scaleY = next.height / previous.height;
    commit({ ...present, format, elements: present.elements.map((element) => ({ ...element, x: element.x * scaleX, y: element.y * scaleY, width: element.width * scaleX, height: element.height * scaleY })) });
  };

  const applyTemplate = (templateId: EditorialTemplateId) => {
    commit(applyEditorialTemplate(editorialProductIds(present), title, templateId));
    setSelectedId(undefined);
  };

  const alignSelected = (alignment: "horizontal" | "vertical") => {
    if (!selected) return;
    patchSelected(alignment === "horizontal" ? { x: (dimensions.width - selected.width) / 2 } : { y: (dimensions.height - selected.height) / 2 });
  };

  const reorder = (direction: "front" | "forward" | "backward" | "back") => {
    if (!selectedId) return;
    commit(reorderEditorialElement(present, selectedId, direction));
  };

  const renderInspector = () => (
    <div className="space-y-4">
      {uploadError && <div role="alert" className="rounded-xl border border-pink/25 bg-pink/5 px-3 py-2 text-xs font-medium text-pink">{uploadError}</div>}
      {!selected ? (
        <>
          <EditorialColorPicker label="Page color" value={present.backgroundColor} action={(color) => commit({ ...presentRef.current, backgroundColor: color })} />
          <div><FieldLabel>Page image</FieldLabel><div className="mt-2 flex flex-wrap gap-2"><Button label="Upload page background" onClick={() => backgroundUploadRef.current?.click()}><ImagePlus className="h-3.5 w-3.5" />Upload</Button>{present.backgroundImage && <Button label="Remove page background" onClick={() => commit({ ...present, backgroundImage: undefined })}><Trash2 className="h-3.5 w-3.5" />Remove</Button>}</div><input ref={backgroundUploadRef} type="file" accept="image/*" onChange={(event) => handleBackgroundUpload(event.target.files?.[0])} className="sr-only" />{present.backgroundImage && <label className="mt-2 block"><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text/40">Image opacity</span><input type="range" min="0.1" max="1" step="0.05" value={present.backgroundOpacity} onChange={(event) => commit({ ...present, backgroundOpacity: Number(event.target.value) })} className="mt-1 w-full accent-text" /></label>}</div>
          <label className="flex items-center justify-between rounded-xl border border-divider/60 bg-bg px-3 py-2.5 text-xs font-semibold text-text/65"><span>Alignment guides</span><input type="checkbox" checked={present.showGuides} onChange={(event) => commit({ ...present, showGuides: event.target.checked })} /></label>
          <p className="rounded-xl bg-accent/5 px-3 py-3 text-xs leading-relaxed text-text/55"><MousePointer2 className="mr-1 inline h-3.5 w-3.5 text-accent" /> Select an element on the canvas to edit its position, styling, crop, and layer.</p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2"><div className="min-w-0"><FieldLabel>Selected</FieldLabel><p className="mt-1 truncate text-sm font-semibold text-text">{selected.name}</p></div><div className="flex gap-1"><Button label={selected.locked ? "Unlock" : "Lock"} active={selected.locked} onClick={() => patchSelected({ locked: !selected.locked })}>{selected.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}</Button><Button label={selected.hidden ? "Show" : "Hide"} active={selected.hidden} onClick={() => patchSelected({ hidden: !selected.hidden })}>{selected.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button></div></div>
          <div className="grid grid-cols-2 gap-2"><NumberField label="X" value={selected.x} min={-1000} max={dimensions.width} onChange={(value) => patchSelected({ x: value })} /><NumberField label="Y" value={selected.y} min={-1000} max={dimensions.height} onChange={(value) => patchSelected({ y: value })} /><NumberField label="Width" value={selected.width} min={24} max={dimensions.width} onChange={(value) => patchSelected({ width: value })} /><NumberField label="Height" value={selected.height} min={12} max={dimensions.height} onChange={(value) => patchSelected({ height: value })} /><NumberField label="Rotate" value={selected.rotation} min={-180} max={180} onChange={(value) => patchSelected({ rotation: value })} /><NumberField label="Opacity" value={selected.opacity} min={0.05} max={1} step={0.05} onChange={(value) => patchSelected({ opacity: value })} /></div>
          <div><FieldLabel>Align and arrange</FieldLabel><div className="mt-2 grid grid-cols-2 gap-1.5"><Button label="Center horizontally on the canvas" onClick={() => alignSelected("horizontal")}><AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />Center horizontally</Button><Button label="Center vertically on the canvas" onClick={() => alignSelected("vertical")}><AlignCenter className="h-3.5 w-3.5" />Center vertically</Button><Button label="Move above every other layer" onClick={() => reorder("front")}><BringToFront className="h-3.5 w-3.5" />Bring to front</Button><Button label="Move below every other layer" onClick={() => reorder("back")}><SendToBack className="h-3.5 w-3.5" />Send to back</Button><Button label="Move up one layer" onClick={() => reorder("forward")}><ArrowUp className="h-3.5 w-3.5" />Forward one</Button><Button label="Move down one layer" onClick={() => reorder("backward")}><ArrowDown className="h-3.5 w-3.5" />Back one</Button></div></div>
          {selected.type === "text" && <div className="space-y-3"><label><FieldLabel>Text</FieldLabel><textarea value={selected.content} onChange={(event) => patchSelected({ content: event.target.value })} rows={3} className="mt-1 w-full resize-none rounded-lg border border-divider/70 bg-bg px-3 py-2 text-sm focus:border-accent/50 focus:outline-none" /></label><div className="grid grid-cols-2 gap-2"><label><FieldLabel>Typeface</FieldLabel><select value={selected.fontFamily} onChange={(event) => patchSelected({ fontFamily: event.target.value as "headline" | "sans" | "serif" })} className="mt-1 h-9 w-full rounded-lg border border-divider/70 bg-bg px-2 text-xs"><option value="headline">Editorial</option><option value="sans">Modern sans</option><option value="serif">Classic serif</option></select></label><label><FieldLabel>Weight</FieldLabel><select value={selected.fontWeight} onChange={(event) => patchSelected({ fontWeight: Number(event.target.value) as 400 | 500 | 600 | 700 })} className="mt-1 h-9 w-full rounded-lg border border-divider/70 bg-bg px-2 text-xs"><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option></select></label><NumberField label="Font size" value={selected.fontSize} min={8} max={180} onChange={(value) => patchSelected({ fontSize: value })} /><NumberField label="Line height" value={selected.lineHeight} min={0.7} max={3} step={0.05} onChange={(value) => patchSelected({ lineHeight: value })} /><NumberField label="Tracking" value={selected.letterSpacing} min={-8} max={30} step={0.5} onChange={(value) => patchSelected({ letterSpacing: value })} /><NumberField label="Padding" value={selected.padding} min={0} max={120} onChange={(value) => patchSelected({ padding: value })} /></div><div><FieldLabel>Style and alignment</FieldLabel><div className="mt-2 grid grid-cols-4 gap-1.5"><Button label="Left align" active={selected.align === "left"} onClick={() => patchSelected({ align: "left" })}>Left</Button><Button label="Center align" active={selected.align === "center"} onClick={() => patchSelected({ align: "center" })}>Center</Button><Button label="Right align" active={selected.align === "right"} onClick={() => patchSelected({ align: "right" })}>Right</Button><Button label="Italic" active={selected.italic} onClick={() => patchSelected({ italic: !selected.italic })}>Italic</Button></div></div><div className="space-y-2"><EditorialColorPicker label="Text color" value={selected.color} action={(value) => patchSelected({ color: value })} /><EditorialColorPicker label="Text background" value={selected.backgroundColor} action={(value) => patchSelected({ backgroundColor: value })} allowTransparent /></div></div>}
          {(selected.type === "product" || selected.type === "image" || selected.type === "video") && <div className="space-y-3"><div className="grid grid-cols-2 gap-2"><label><FieldLabel>Frame shape</FieldLabel><select value={selected.mask} onChange={(event) => { const mask = event.target.value as EditorialImageMask; patchSelected(mask === "circle" ? { mask, height: selected.width } : { mask }); }} className="mt-1 h-9 w-full rounded-lg border border-divider/70 bg-bg px-2 text-xs">{EDITORIAL_IMAGE_MASKS.map((mask) => <option key={mask.id} value={mask.id}>{mask.label}</option>)}</select></label><label><FieldLabel>Image fit</FieldLabel><select value={selected.fit} onChange={(event) => patchSelected({ fit: event.target.value as "cover" | "contain" })} className="mt-1 h-9 w-full rounded-lg border border-divider/70 bg-bg px-2 text-xs"><option value="cover">Crop to fill</option><option value="contain">Fit image</option></select></label><NumberField label="Zoom" value={selected.zoom} min={1} max={3} step={0.05} onChange={(value) => patchSelected({ zoom: value })} /><NumberField label="Crop X" value={selected.cropX} min={0} max={100} onChange={(value) => patchSelected({ cropX: value })} /><NumberField label="Crop Y" value={selected.cropY} min={0} max={100} onChange={(value) => patchSelected({ cropY: value })} /><NumberField label="Radius" value={selected.borderRadius} min={0} max={200} onChange={(value) => patchSelected({ borderRadius: value })} /><NumberField label="Border" value={selected.borderWidth} min={0} max={30} onChange={(value) => patchSelected({ borderWidth: value })} /></div><label><FieldLabel>Shadow</FieldLabel><select value={selected.shadow} onChange={(event) => patchSelected({ shadow: event.target.value as "none" | "soft" | "strong" })} className="mt-1 h-9 w-full rounded-lg border border-divider/70 bg-bg px-2 text-xs"><option value="none">None</option><option value="soft">Soft</option><option value="strong">Strong</option></select></label></div>}
          {selected.type === "shape" && <div className="space-y-3"><label><FieldLabel>Shape</FieldLabel><select value={selected.shape} onChange={(event) => patchSelected({ shape: event.target.value as EditorialShapeKind })} className="mt-1 h-9 w-full rounded-lg border border-divider/70 bg-bg px-2 text-xs">{EDITORIAL_SHAPES.map((shape) => <option key={shape.id} value={shape.id}>{shape.mood === "classic" ? "Editorial" : "Expressive"} · {shape.label}</option>)}</select></label><div className="space-y-2"><EditorialColorPicker label="Fill" value={selected.fill} action={(value) => patchSelected({ fill: value })} allowTransparent /><EditorialColorPicker label="Stroke" value={selected.stroke} action={(value) => patchSelected({ stroke: value })} allowTransparent /></div><div className="grid grid-cols-2 gap-2"><NumberField label="Stroke width" value={selected.strokeWidth} min={0} max={40} onChange={(value) => patchSelected({ strokeWidth: value })} /><NumberField label="Corner radius" value={selected.borderRadius} min={0} max={300} onChange={(value) => patchSelected({ borderRadius: value })} /></div></div>}
          <div className="flex flex-wrap gap-2 border-t border-divider/60 pt-3"><Button label="Duplicate" onClick={duplicateSelected}><Copy className="h-3.5 w-3.5" />Duplicate</Button><Button label="Delete" onClick={removeSelected}><Trash2 className="h-3.5 w-3.5" />Delete</Button></div>
        </>
      )}
    </div>
  );

  const renderAddPanel = () => (
    <div className="space-y-4">
      {uploadError && <div role="alert" className="rounded-xl border border-pink/25 bg-pink/5 px-3 py-2 text-xs font-medium text-pink">{uploadError}</div>}
      {promptProducts.length > 0 && <section className="rounded-xl border border-accent/25 bg-accent/5 p-3"><div className="flex items-start justify-between gap-2"><div><FieldLabel>Prompt product results</FieldLabel><p className="mt-1 text-[11px] leading-relaxed text-text/55">Browse products matched to your Guide prompt, then add them directly to this page.</p></div><button type="button" onClick={onBrowsePromptResults} className="shrink-0 text-[10px] font-semibold text-accent hover:underline">Show me all results <ArrowDown className="ml-0.5 inline h-3 w-3" /></button></div><div className="mt-3 space-y-2">{promptProducts.slice(0, 6).map((product) => { const added = presentProductIds.includes(product.id); return <div key={product.id} className="flex items-center gap-2 rounded-lg border border-divider/60 bg-bg p-1.5"><Image src={product.images[0]} alt="" width={40} height={40} className="h-10 w-10 rounded-md object-cover" /><span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-text/70">{product.name}</span><button type="button" disabled={added} onClick={() => onAddPromptProduct(product.id)} className="shrink-0 rounded-full bg-text px-2 py-1 text-[9px] font-semibold text-bg disabled:bg-surface disabled:text-text/40">{added ? "Added" : "Add to current Guide"}</button></div>; })}</div></section>}
      <div><FieldLabel>Text</FieldLabel><div className="mt-2 grid grid-cols-3 gap-2"><Button label="Add headline" onClick={() => addElement(createTextElement("Your headline", "title"))}><Type className="h-3.5 w-3.5" />Title</Button><Button label="Add subheading" onClick={() => addElement(createTextElement("A new perspective", "subtitle"))}><Type className="h-3.5 w-3.5" />Deck</Button><Button label="Add body copy" onClick={() => addElement(createTextElement("Tell the story behind this collection.", "body"))}><Type className="h-3.5 w-3.5" />Body</Button></div></div>
      <div className="space-y-2"><FieldLabel>Add your media</FieldLabel><div className="grid grid-cols-2 gap-2"><Button label="Add image" onClick={() => uploadRef.current?.click()}><ImagePlus className="h-3.5 w-3.5" />Add image</Button><Button label="Add video clip" onClick={() => videoUploadRef.current?.click()}><Film className="h-3.5 w-3.5" />Add video</Button></div><input ref={uploadRef} type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} className="sr-only" /><input ref={videoUploadRef} type="file" accept="video/*" onChange={(event) => handleVideoUpload(event.target.files?.[0])} className="sr-only" /><label className="block"><span className="mb-1 block text-[10px] font-medium text-text/45">Frame shape for newly added media</span><select value={uploadMask} onChange={(event) => setUploadMask(event.target.value as EditorialImageMask)} className="h-9 w-full rounded-lg border border-divider/70 bg-bg px-2 text-xs">{EDITORIAL_IMAGE_MASKS.map((mask) => <option key={mask.id} value={mask.id}>{mask.label}</option>)}</select></label><p className="text-[10px] leading-relaxed text-text/40">You can change the frame shape again after selecting the image or video on the canvas.</p></div>
      <div><FieldLabel>Editorial shapes</FieldLabel><div className="mt-2 grid grid-cols-3 gap-2">{EDITORIAL_SHAPES.filter((shape) => shape.mood === "classic").map((shape) => <Button key={shape.id} label={`Add ${shape.label}`} onClick={() => addElement(createShapeElement(shape.id))}>{shape.label}</Button>)}</div></div>
      <div><FieldLabel>Expressive shapes</FieldLabel><div className="mt-2 grid grid-cols-2 gap-2">{EDITORIAL_SHAPES.filter((shape) => shape.mood === "expressive").map((shape) => <Button key={shape.id} label={`Add ${shape.label}`} onClick={() => addElement(createShapeElement(shape.id))}>{shape.label}</Button>)}</div></div>
      <div><FieldLabel>My Favorite Products</FieldLabel><p className="mt-1 text-[10px] leading-relaxed text-text/45">Add products you have already saved to your favorite list.</p><div className="mt-2 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1">{products.length > 0 ? products.map((product, index) => <button key={product.id} type="button" onClick={() => addElement(createProductElement(product.id, index))} className="group overflow-hidden rounded-xl border border-divider/60 bg-bg text-left"><span className="relative block aspect-square bg-surface"><Image src={product.images[0]} alt={product.name} fill sizes="120px" className="object-cover transition-transform group-hover:scale-105" /></span><span className="block truncate px-2 py-1.5 text-[10px] font-semibold text-text/65">{product.name}</span></button>) : <p className="col-span-3 rounded-lg border border-dashed border-divider/70 px-3 py-4 text-center text-[10px] leading-relaxed text-text/45">Your My Favorite Products list is empty.</p>}</div></div>
    </div>
  );

  const renderLayers = () => {
    const layers = [...present.elements].sort((a, b) => b.zIndex - a.zIndex);
    return <div className="space-y-3"><div className="rounded-xl bg-accent/5 px-3 py-2 text-[11px] leading-relaxed text-text/55"><span className="font-semibold text-text/70">Top layers appear in front.</span> Select a layer to edit it. Use Forward one or Back one in Edit to change its position by a single step.</div><div className="space-y-2">{layers.map((element, index) => <button key={element.id} type="button" onClick={() => { setSelectedId(element.id); setPanel("design"); }} aria-label={`Select ${element.name}, layer ${index + 1}`} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left ${selectedId === element.id ? "border-accent bg-accent/5" : "border-divider/60 bg-bg"}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-text/50">{element.type === "text" ? <Type className="h-3.5 w-3.5" /> : element.type === "shape" ? <Shapes className="h-3.5 w-3.5" /> : element.type === "video" ? <Film className="h-3.5 w-3.5" /> : <ImagePlus className="h-3.5 w-3.5" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-text/70">{element.name}</span><span className="block text-[10px] text-text/40">Layer {index + 1} · {element.type}</span></span>{element.locked && <Lock className="h-3 w-3 shrink-0 text-text/35" />}{element.hidden && <EyeOff className="h-3 w-3 shrink-0 text-text/35" />}</button>)}</div></div>;
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-divider/70 bg-surface/35 shadow-sm">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-divider/60 bg-bg/90 px-3 py-3 backdrop-blur sm:px-4">
        <Button label="Undo" disabled={past.length === 0} onClick={undo}><Undo2 className="h-4 w-4" /></Button>
        <Button label="Redo" disabled={future.length === 0} onClick={redo}><Redo2 className="h-4 w-4" /></Button>
        <span className="mx-1 hidden h-6 w-px bg-divider sm:block" />
        <label className="flex h-9 items-center gap-2 rounded-lg border border-divider/70 bg-bg px-2.5 text-xs font-semibold text-text/65"><span className="hidden sm:inline">Format</span><select value={present.format} onChange={(event) => setFormat(event.target.value as EditorialFormat)} className="bg-transparent focus:outline-none">{Object.entries(EDITORIAL_FORMATS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
        <label className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-divider/70 bg-bg px-2.5 text-xs font-semibold text-text/65"><span>{Math.round(zoom * 100)}%</span><input type="range" min="0.55" max="1.25" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-20 accent-text" /></label>
      </div>

      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0 overflow-auto bg-sky/25 p-4 sm:p-7 lg:min-h-[680px]">
          <div className="mx-auto origin-top transition-[width,max-width]" style={{ width: `${zoom * 100}%`, maxWidth: `${(present.format === "spread" ? 900 : 680) * zoom}px` }}>
            <EditorialRenderer design={present} selectedId={selectedId} interactive guides={snapGuides} canvasRef={canvasRef} onCanvasPointerDown={(event) => { if (event.target === event.currentTarget) setSelectedId(undefined); }} onElementSelect={setSelectedId} onElementPointerDown={(event, elementId) => startInteraction(event, elementId, "drag")} onHandlePointerDown={(event, elementId, handle) => startInteraction(event, elementId, handle)} />
          </div>
        </div>

        <aside className="min-w-0 border-t border-divider/60 bg-bg lg:border-l lg:border-t-0">
          <div className="grid grid-cols-3 border-b border-divider/60 p-2"><button type="button" onClick={() => setPanel("design")} className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold ${panel === "design" ? "bg-text text-bg" : "text-text/50"}`}><MousePointer2 className="h-3.5 w-3.5" />Edit</button><button type="button" onClick={() => setPanel("add")} className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold ${panel === "add" ? "bg-text text-bg" : "text-text/50"}`}><Shapes className="h-3.5 w-3.5" />Add</button><button type="button" onClick={() => setPanel("layers")} className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold ${panel === "layers" ? "bg-text text-bg" : "text-text/50"}`}><Layers3 className="h-3.5 w-3.5" />Layers</button></div>
          <div className="max-h-[620px] overflow-y-auto p-4">{panel === "design" ? renderInspector() : panel === "add" ? renderAddPanel() : renderLayers()}</div>
        </aside>
      </div>

      <div className="border-t border-divider/60 bg-bg px-3 py-3 sm:px-4">
        <div className="mb-2 flex items-center justify-between"><FieldLabel>Start from a layout</FieldLabel><span className="text-[10px] text-text/40">Applying a layout rearranges this page</span></div>
        <div className="flex gap-2 overflow-x-auto pb-1">{EDITORIAL_TEMPLATES.map((template) => <button key={template.id} type="button" onClick={() => applyTemplate(template.id)} className="min-w-36 rounded-xl border border-divider/60 bg-surface/40 px-3 py-2 text-left transition-colors hover:border-accent/40 hover:bg-accent/5"><span className="block text-xs font-semibold text-text">{template.label}</span><span className="mt-0.5 block text-[10px] leading-snug text-text/45">{template.description}</span></button>)}</div>
      </div>
    </section>
  );
}
