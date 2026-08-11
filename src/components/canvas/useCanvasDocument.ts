"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  EDITORIAL_FORMATS,
  clampEditorialElement,
  duplicateEditorialElement,
  normalizeEditorialRotation,
  removeEditorialElement,
  isEditorialMediaElement,
  snapEditorialElement,
  updateEditorialElement,
  type EditorialElement,
  type EditorialPageDesign,
  type EditorialSnapGuides,
} from "@/lib/editorial";

// The single editing core for every canvas surface in the app: undo/redo,
// selection, keyboard nudging, and pointer drag/resize/rotate with snapping.
//
// Both the legacy editorial builder and the new post composer consume this, so
// interaction behavior cannot drift between them.

/**
 * `pan` reframes media inside a fixed box rather than moving the box. Layout
 * slots use it so the frame stays where the template put it.
 */
export type CanvasInteractionAction = "drag" | "resize" | "rotate" | "pan";

type Interaction = {
  action: CanvasInteractionAction;
  elementId: string;
  startX: number;
  startY: number;
  element: EditorialElement;
  rect: DOMRect;
  /** Document as it was when the gesture began, pushed to history on first move. */
  designAtStart: EditorialPageDesign;
};

/** Movement below this (in px) is treated as a tap, not a drag. */
const DRAG_THRESHOLD = 3;

const HISTORY_LIMIT = 50;

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function useCanvasDocument({
  design,
  onChange,
  enableShortcuts = true,
  removeElement = removeEditorialElement,
}: {
  design: EditorialPageDesign;
  onChange: (design: EditorialPageDesign) => void;
  /** Disable when another surface owns the keyboard (e.g. a modal above). */
  enableShortcuts?: boolean;
  /**
   * How an element is removed. Overridable so a surface can define its own
   * meaning of "remove" — emptying a layout slot rather than deleting its frame,
   * for instance — and have the keyboard shortcut agree with its buttons.
   */
  removeElement?: (design: EditorialPageDesign, elementId: string) => EditorialPageDesign;
}) {
  const [present, setPresent] = useState(design);
  const [past, setPast] = useState<EditorialPageDesign[]>([]);
  const [future, setFuture] = useState<EditorialPageDesign[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [interaction, setInteraction] = useState<Interaction>();
  const [snapGuides, setSnapGuides] = useState<EditorialSnapGuides>();
  const canvasRef = useRef<HTMLDivElement>(null);
  const presentRef = useRef(present);

  useEffect(() => { presentRef.current = present; }, [present]);

  // Adopt a new document from the parent (page switch, template applied, etc.)
  // and reset history so undo cannot cross document boundaries.
  useEffect(() => {
    if (design === presentRef.current) return;
    setPresent(design);
    presentRef.current = design;
    setPast([]);
    setFuture([]);
    setSelectedId(undefined);
  }, [design]);

  const dimensions = EDITORIAL_FORMATS[present.format];
  const selected = present.elements.find((element) => element.id === selectedId);

  const commit = useCallback((next: EditorialPageDesign, nextSelectedId?: string) => {
    setPast((current) => [...current.slice(-(HISTORY_LIMIT - 1)), presentRef.current]);
    setFuture([]);
    setPresent(next);
    presentRef.current = next;
    onChange(next);
    if (nextSelectedId !== undefined) setSelectedId(nextSelectedId);
  }, [onChange]);

  /** Applies a change without pushing history — used during a live drag. */
  const applyTransient = useCallback((next: EditorialPageDesign) => {
    setPresent(next);
    presentRef.current = next;
    onChange(next);
  }, [onChange]);

  const undo = useCallback(() => {
    setPast((current) => {
      const previous = current[current.length - 1];
      if (!previous) return current;
      setFuture((items) => [presentRef.current, ...items].slice(0, HISTORY_LIMIT));
      setPresent(previous);
      presentRef.current = previous;
      onChange(previous);
      setSelectedId(undefined);
      return current.slice(0, -1);
    });
  }, [onChange]);

  const redo = useCallback(() => {
    setFuture((current) => {
      const next = current[0];
      if (!next) return current;
      setPast((items) => [...items.slice(-(HISTORY_LIMIT - 1)), presentRef.current]);
      setPresent(next);
      presentRef.current = next;
      onChange(next);
      setSelectedId(undefined);
      return current.slice(1);
    });
  }, [onChange]);

  const patchSelected = useCallback((patch: Partial<EditorialElement>) => {
    if (!selectedId) return;
    const element = presentRef.current.elements.find((item) => item.id === selectedId);
    if (!element) return;
    const nextElement = clampEditorialElement({ ...element, ...patch } as EditorialElement, presentRef.current.format);
    commit(updateEditorialElement(presentRef.current, selectedId, nextElement));
  }, [commit, selectedId]);

  const removeSelected = useCallback(() => {
    if (!selectedId) return;
    const next = removeElement(presentRef.current, selectedId);
    // A surface may replace rather than delete (a slot becomes an empty frame),
    // in which case the element is still there and stays selected.
    const stillPresent = next.elements.some((element) => element.id === selectedId);
    commit(next, stillPresent ? selectedId : undefined);
    if (!stillPresent) setSelectedId(undefined);
  }, [commit, removeElement, selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const result = duplicateEditorialElement(presentRef.current, selectedId);
    commit(result.design, result.elementId);
  }, [commit, selectedId]);

  const addElement = useCallback((element: EditorialElement) => {
    const current = presentRef.current;
    const maxZ = Math.max(0, ...current.elements.map((item) => item.zIndex));
    const nextElement = { ...element, zIndex: maxZ + 1 } as EditorialElement;
    commit({ ...current, elements: [...current.elements, nextElement] }, nextElement.id);
  }, [commit]);

  const replaceDesign = useCallback((next: EditorialPageDesign, nextSelectedId?: string) => {
    commit(next, nextSelectedId ?? "");
  }, [commit]);

  // --- keyboard -------------------------------------------------------------

  useEffect(() => {
    if (!enableShortcuts) return;
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
      const patch = event.key === "ArrowLeft" ? { x: element.x - delta }
        : event.key === "ArrowRight" ? { x: element.x + delta }
          : event.key === "ArrowUp" ? { y: element.y - delta }
            : event.key === "ArrowDown" ? { y: element.y + delta }
              : undefined;
      if (patch) {
        event.preventDefault();
        commit(updateEditorialElement(presentRef.current, selectedId, clampEditorialElement({ ...element, ...patch }, presentRef.current.format)));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commit, enableShortcuts, redo, removeSelected, selectedId, undo]);

  // --- pointer drag / resize / rotate ---------------------------------------

  useEffect(() => {
    if (!interaction) return;
    let pushedHistory = false;
    const handleMove = (event: PointerEvent) => {
      // Tapping to select should not create an undo step — and on touch a tap
      // almost always jitters a pixel or two. Only treat it as an edit once the
      // pointer has genuinely moved.
      const movedBy = Math.hypot(event.clientX - interaction.startX, event.clientY - interaction.startY);
      if (!pushedHistory) {
        if (movedBy < DRAG_THRESHOLD) return;
        pushedHistory = true;
        setPast((current) => [...current.slice(-(HISTORY_LIMIT - 1)), interaction.designAtStart]);
        setFuture([]);
      }

      const scaleX = dimensions.width / interaction.rect.width;
      const scaleY = dimensions.height / interaction.rect.height;
      const dx = (event.clientX - interaction.startX) * scaleX;
      const dy = (event.clientY - interaction.startY) * scaleY;
      let nextElement: EditorialElement;

      if (interaction.action === "pan") {
        // Reframe the media inside its box. Dragging right should reveal more of
        // the image's left side, so the object position moves the other way.
        const source = interaction.element;
        if (!isEditorialMediaElement(source)) return;
        const zoom = Math.max(1, source.zoom);
        const cropX = clampPercent(source.cropX - (dx / Math.max(1, source.width)) * 100 / zoom);
        const cropY = clampPercent(source.cropY - (dy / Math.max(1, source.height)) * 100 / zoom);
        nextElement = { ...source, cropX, cropY };
        applyTransient(updateEditorialElement(presentRef.current, interaction.elementId, nextElement));
        return;
      }

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

  const startInteraction = useCallback((event: React.PointerEvent, elementId: string, action: CanvasInteractionAction) => {
    event.preventDefault();
    event.stopPropagation();
    const element = presentRef.current.elements.find((item) => item.id === elementId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!element || !rect) return;
    setSelectedId(elementId);
    if (element.locked) return;
    // History is pushed on the first real movement (see the move handler), so a
    // gesture is one undo step and a tap is none.
    setInteraction({
      action,
      elementId,
      startX: event.clientX,
      startY: event.clientY,
      element,
      rect,
      designAtStart: presentRef.current,
    });
  }, []);

  /** Canvas-space coordinates for a pointer/drop event, clamped to the canvas. */
  const toCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return undefined;
    return {
      x: ((clientX - rect.left) / rect.width) * dimensions.width,
      y: ((clientY - rect.top) / rect.height) * dimensions.height,
    };
  }, [dimensions.height, dimensions.width]);

  return {
    design: present,
    dimensions,
    selectedId,
    setSelectedId,
    selected,
    snapGuides,
    canvasRef,
    isInteracting: Boolean(interaction),
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    commit,
    applyTransient,
    replaceDesign,
    undo,
    redo,
    patchSelected,
    removeSelected,
    duplicateSelected,
    addElement,
    startInteraction,
    toCanvasPoint,
  };
}

export type CanvasDocument = ReturnType<typeof useCanvasDocument>;
