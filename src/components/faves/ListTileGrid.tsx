"use client";

import Link from "next/link";
import Image from "next/image";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { getProductById } from "@/lib/data";
import { TEMPLATE_LAYOUT, tileCount, type TemplateId } from "@/data/listTemplates";

interface ListTileGridProps {
  productIds: string[];
  template: TemplateId;
  mode?: "display" | "edit";
  onTileClick?: (index: number) => void;
  onRemove?: (index: number) => void;
  /** Namespace for dnd ids so multiple grids (carousel pages) don't collide. */
  scope?: string;
  className?: string;
}

export function ListTileGrid({
  productIds,
  template,
  mode = "display",
  onTileClick,
  onRemove,
  scope = "g",
  className,
}: ListTileGridProps) {
  const n = tileCount(template);
  const overflow = productIds.length - n;

  return (
    <div
      className={cn(
        "grid aspect-[4/5] w-full gap-1 overflow-hidden rounded-2xl bg-surface",
        TEMPLATE_LAYOUT[template].grid,
        className,
      )}
    >
      {Array.from({ length: n }).map((_, i) => {
        const productId = productIds[i];
        const isLastVisible = i === n - 1;
        const showOverflow = mode === "display" && isLastVisible && overflow > 0;

        if (mode === "edit") {
          return (
            <EditTile
              key={i}
              index={i}
              scope={scope}
              productId={productId}
              onTileClick={onTileClick}
              onRemove={onRemove}
            />
          );
        }

        return (
          <DisplayTile
            key={i}
            productId={productId}
            overflowCount={showOverflow ? overflow : 0}
          />
        );
      })}
    </div>
  );
}

function DisplayTile({
  productId,
  overflowCount,
}: {
  productId?: string;
  overflowCount: number;
}) {
  const product = productId ? getProductById(productId) : undefined;

  if (!product) {
    return <div className="relative h-full w-full bg-surface" />;
  }

  return (
    <Link
      href={`/product/${product.id}`}
      className="group relative block h-full w-full overflow-hidden bg-surface"
    >
      <Image
        src={product.images[0]}
        alt={product.name}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {overflowCount > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">
          +{overflowCount}
        </div>
      )}
    </Link>
  );
}

function EditTile({
  index,
  scope,
  productId,
  onTileClick,
  onRemove,
}: {
  index: number;
  scope: string;
  productId?: string;
  onTileClick?: (index: number) => void;
  onRemove?: (index: number) => void;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `tile-${scope}-${index}` });
  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
    transform,
    isDragging,
  } = useDraggable({ id: `move-${scope}-${index}`, disabled: !productId });

  const product = productId ? getProductById(productId) : undefined;

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  if (!product) {
    return (
      <button
        ref={setDropRef}
        type="button"
        onClick={() => onTileClick?.(index)}
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-1 border-2 border-dashed text-text/40 transition-colors",
          isOver ? "border-accent bg-accent/10 text-accent" : "border-divider hover:border-accent hover:text-accent",
        )}
      >
        <Plus className="h-5 w-5" />
        <span className="text-[11px] font-medium">Add</span>
      </button>
    );
  }

  return (
    <div ref={setDropRef} className="relative h-full w-full">
      <div
        ref={setDragRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "relative h-full w-full cursor-grab overflow-hidden bg-surface active:cursor-grabbing",
          isOver && "ring-2 ring-accent",
          isDragging && "opacity-50",
        )}
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove?.(index)}
        aria-label="Remove from list"
        className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
