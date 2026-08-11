"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { getProductById } from "@/lib/data";
import type { PostProductPin } from "@/lib/post";

/**
 * Tappable shopping pins laid over a page.
 *
 * Positions are percentages of the page, so a pin stays put across canvas sizes
 * and formats. Used for media posts, where products are tagged onto the photo
 * rather than placed on the canvas.
 */
export function PostPins({
  pins,
  editable = false,
  onMove,
  onRemove,
}: {
  pins: PostProductPin[];
  editable?: boolean;
  onMove?: (pinId: string, x: number, y: number) => void;
  onRemove?: (pinId: string) => void;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string>();

  const handleMove = (event: ReactPointerEvent) => {
    const pinId = dragging.current;
    const rect = layerRef.current?.getBoundingClientRect();
    if (!pinId || !rect || rect.width === 0 || !onMove) return;
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    onMove(pinId, x, y);
  };

  return (
    <div
      ref={layerRef}
      // Only the pins take pointer events, so the canvas beneath stays usable.
      className="pointer-events-none absolute inset-0 z-[150]"
      onPointerMove={editable ? handleMove : undefined}
      onPointerUp={() => { dragging.current = undefined; }}
      onPointerLeave={() => { dragging.current = undefined; }}
    >
      {pins.map((pin) => {
        const product = getProductById(pin.productId);
        if (!product) return null;
        return (
          <div
            key={pin.id}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            onPointerDown={(event) => {
              if (!editable) return;
              event.preventDefault();
              event.stopPropagation();
              dragging.current = pin.id;
            }}
          >
            <div className="flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-1 pr-2.5 shadow-md backdrop-blur">
              <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-surface">
                <Image src={product.images[0]} alt={product.name} fill sizes="24px" className="object-cover" />
              </span>
              <span className="max-w-24 truncate text-[10px] font-semibold text-midnight">{product.name}</span>
              {editable && onRemove && (
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); onRemove(pin.id); }}
                  aria-label={`Remove ${product.name} tag`}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-midnight text-white"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
