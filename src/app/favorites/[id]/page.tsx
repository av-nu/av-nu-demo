"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
  X,
  Lock,
  Users,
  Globe2,
  EyeOff,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ListTileGrid } from "@/components/faves/ListTileGrid";
import { ProductPickerDialog } from "@/components/faves/ProductPickerDialog";
import { ShareListDialog } from "@/components/faves/ShareListDialog";
import { useFaveLists } from "@/hooks/useFaveLists";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/components/ui/Toast";
import { getProductById } from "@/lib/data";
import { getContactById, getInnerCircle } from "@/data/social";
import { socialService } from "@/lib/social";
import { TEMPLATE_IDS, TEMPLATE_LAYOUT, type TemplateId } from "@/data/listTemplates";
import { flattenPages, type ListPage } from "@/data/faves";

const VIS_META = {
  private: { icon: Lock, label: "Private" },
  "inner-circle": { icon: Users, label: "Inner circle" },
  public: { icon: Globe2, label: "Public" },
} as const;

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const a = [...arr];
  const [moved] = a.splice(from, 1);
  a.splice(to, 0, moved);
  return a;
}

function placeAt(ids: string[], productId: string, index: number): string[] {
  const arr = ids.filter((id) => id !== productId);
  const clamped = Math.max(0, Math.min(index, arr.length));
  arr.splice(clamped, 0, productId);
  return arr;
}

function parseScoped(id: string, prefix: string) {
  if (!id.startsWith(prefix)) return null;
  const body = id.slice(prefix.length);
  const li = body.lastIndexOf("-");
  if (li < 0) return null;
  return { scope: body.slice(0, li), index: Number(body.slice(li + 1)) };
}

function DraggableTrayItem({ productId }: { productId: string }) {
  const product = getProductById(productId);
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `tray-${productId}`,
  });
  if (!product) return null;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "relative aspect-square w-20 shrink-0 cursor-grab overflow-hidden rounded-xl bg-surface active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      title={product.name}
    >
      <Image src={product.images[0]} alt={product.name} fill sizes="80px" className="object-cover" />
    </div>
  );
}

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const {
    lists,
    getList,
    isHydrated,
    updateList,
    deleteList,
    setProductIds,
    setVisibility,
    setCaption,
    addPage,
    removePage,
    updatePage,
  } = useFaveLists();
  const { favorites } = useFavorites();
  const { showToast, ToastContainer } = useToast();

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [sharing, setSharing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Collection picker (private / inner-circle), or per-page picker (public).
  const [collectionPicker, setCollectionPicker] = useState(false);
  const [pagePicker, setPagePicker] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const list = getList(params.id);

  if (!isHydrated) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-surface" />
        <div className="aspect-[4/5] max-w-sm rounded-2xl bg-surface" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="font-headline text-2xl text-text">List not found</h1>
        <p className="mt-2 text-sm text-text/50">
          This list may have been deleted or isn&apos;t available.
        </p>
        <Button asChild className="mt-6">
          <Link href="/favorites">Back to My Faves</Link>
        </Button>
      </div>
    );
  }

  const pages: ListPage[] = list.pages ?? [];
  const isPublic = list.visibility === "public";
  const vis = VIS_META[list.visibility];
  const VisIcon = vis.icon;

  const collectionProducts = list.productIds
    .map((id) => getProductById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getProductById>>[];

  // Drag tray = everything the user has saved anywhere (umbrella + all lists).
  const trayIds = (() => {
    const set = new Set<string>(favorites);
    lists.forEach((l) => {
      l.productIds.forEach((id) => set.add(id));
      flattenPages(l.pages).forEach((id) => set.add(id));
    });
    return Array.from(set);
  })();

  const recipients =
    list.visibility === "inner-circle"
      ? list.sharedWith.length > 0
        ? list.sharedWith.map((id) => getContactById(id)?.name).filter(Boolean).join(", ")
        : `All inner circle (${getInnerCircle().length})`
      : null;

  const startEdit = () => {
    setDraftName(list.name);
    setEditing(true);
  };
  const saveEdit = () => {
    if (draftName.trim()) {
      updateList(list.id, { name: draftName.trim() });
      showToast("List renamed");
    }
    setEditing(false);
  };
  const handleDelete = () => {
    if (window.confirm(`Delete "${list.name}"? This can't be undone.`)) {
      deleteList(list.id);
      router.push("/favorites");
    }
  };

  const handlePublish = () => {
    setVisibility(list.id, "public", []);
    showToast("Published to the feed");
    // Simulate your circle engaging with the freshly published post.
    socialService.simulateEngagement({ id: list.id, label: list.name });
  };
  const handleUnpublish = () => {
    setVisibility(list.id, "private");
    showToast("Unpublished — set to private");
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const target = parseScoped(String(over.id), "tile-");
    if (!target) return;
    const aId = String(active.id);

    if (aId.startsWith("tray-")) {
      const pid = aId.slice(5);
      const page = pages.find((p) => p.id === target.scope);
      if (!page) return;
      updatePage(list.id, page.id, { productIds: placeAt(page.productIds, pid, target.index) });
      return;
    }

    const src = parseScoped(aId, "move-");
    if (!src) return;
    if (src.scope === target.scope) {
      const page = pages.find((p) => p.id === src.scope);
      if (!page || src.index >= page.productIds.length) return;
      const to = Math.min(target.index, page.productIds.length - 1);
      if (src.index !== to) {
        updatePage(list.id, page.id, { productIds: arrayMove(page.productIds, src.index, to) });
      }
    } else {
      const from = pages.find((p) => p.id === src.scope);
      const to = pages.find((p) => p.id === target.scope);
      if (!from || !to) return;
      const pid = from.productIds[src.index];
      if (!pid) return;
      updatePage(list.id, from.id, { productIds: from.productIds.filter((_, i) => i !== src.index) });
      updatePage(list.id, to.id, { productIds: placeAt(to.productIds, pid, target.index) });
    }
  };

  const activeProduct = (() => {
    if (!activeId) return undefined;
    if (activeId.startsWith("tray-")) return getProductById(activeId.slice(5));
    const m = parseScoped(activeId, "move-");
    if (m) {
      const page = pages.find((p) => p.id === m.scope);
      return page ? getProductById(page.productIds[m.index]) : undefined;
    }
    return undefined;
  })();

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm">
        <Link href="/favorites" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          My Faves
        </Link>
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-3"
      >
        <div className="flex flex-wrap items-center gap-3">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="h-11 rounded-xl border border-divider/60 bg-surface/50 px-4 font-headline text-2xl text-text focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button type="button" onClick={saveEdit} aria-label="Save name" className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Check className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setEditing(false)} aria-label="Cancel" className="flex h-9 w-9 items-center justify-center rounded-full text-text/50 hover:bg-surface">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-headline text-3xl tracking-tight text-text">{list.name}</h1>
              <button type="button" onClick={startEdit} aria-label="Rename list" className="flex h-8 w-8 items-center justify-center rounded-full text-text/40 transition-colors hover:bg-surface hover:text-text">
                <Pencil className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Status pill */}
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
            isPublic
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-divider/60 bg-surface/40 text-text/70",
          )}
        >
          <VisIcon className="h-4 w-4" />
          <span className="font-medium">{vis.label}</span>
          {recipients && <span className="opacity-70">· {recipients}</span>}
          {isPublic && <span className="opacity-70">· Live on feed</span>}
        </div>

        {/* Actions: sharing/status vs publishing are separate */}
        <div className="flex flex-wrap gap-2 pt-1">
          {!isPublic ? (
            <>
              <Button variant="surface" onClick={() => setSharing(true)} className="gap-2">
                <Users className="h-4 w-4" />
                Sharing
              </Button>
              <Button onClick={handlePublish} className="gap-2">
                <Globe2 className="h-4 w-4" />
                Publish to feed
              </Button>
            </>
          ) : (
            <Button variant="surface" onClick={handleUnpublish} className="gap-2">
              <EyeOff className="h-4 w-4" />
              Unpublish
            </Button>
          )}
          <Button variant="surface" onClick={handleDelete} className="gap-2 text-pink hover:text-pink">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </motion.div>

      {isPublic ? (
        /* ---------- Public carousel editor ---------- */
        <div className="space-y-6">
          {/* Caption */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Caption</label>
            <textarea
              value={list.caption ?? ""}
              onChange={(e) => setCaption(list.id, e.target.value)}
              placeholder="Write a caption for your post..."
              rows={2}
              className="w-full resize-none rounded-xl border border-divider/60 bg-surface/50 px-4 py-3 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Pages */}
              <div className="space-y-6">
                <p className="text-sm font-medium text-text">
                  Carousel {pages.length > 1 ? `· ${pages.length} pages` : ""}
                </p>
                {pages.map((page, pi) => (
                  <div key={page.id} className="rounded-2xl border border-divider/50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-text/60">Page {pi + 1}</span>
                      {pages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePage(list.id, page.id)}
                          className="flex items-center gap-1 text-xs text-pink hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    {/* Template picker for this page */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {TEMPLATE_IDS.map((t) => (
                        <TemplateOption
                          key={t}
                          template={t}
                          active={page.template === t}
                          onClick={() => updatePage(list.id, page.id, { template: t })}
                        />
                      ))}
                    </div>

                    <div className="max-w-[260px]">
                      <ListTileGrid
                        productIds={page.productIds}
                        template={page.template}
                        mode="edit"
                        scope={page.id}
                        onTileClick={() => setPagePicker(page.id)}
                        onRemove={(i) =>
                          updatePage(list.id, page.id, {
                            productIds: page.productIds.filter((_, idx) => idx !== i),
                          })
                        }
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addPage(list.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-divider py-3 text-sm font-medium text-text/70 transition-colors hover:border-accent hover:text-accent"
                >
                  <Plus className="h-4 w-4" /> Add page
                </button>
              </div>

              {/* Saved items tray */}
              <div>
                <p className="mb-2 text-sm font-medium text-text">Your saved items</p>
                <p className="mb-3 text-xs text-text/40">
                  Drag into a tile, or tap a tile to add. Drag tiles to reorder or move between pages.
                </p>
                {trayIds.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-divider/60 px-4 py-8 text-center text-sm text-text/50">
                    Save products with the heart to drag them in here.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {trayIds.map((id) => (
                      <DraggableTrayItem key={id} productId={id} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DragOverlay>
              {activeProduct && (
                <div className="relative aspect-square w-20 overflow-hidden rounded-xl bg-surface shadow-lg">
                  <Image src={activeProduct.images[0]} alt="" fill sizes="80px" className="object-cover" />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      ) : (
        /* ---------- Private / inner-circle collection ---------- */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text/50">
              {collectionProducts.length} {collectionProducts.length === 1 ? "item" : "items"}
            </p>
            <Button size="sm" onClick={() => setCollectionPicker(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add products
            </Button>
          </div>

          {collectionProducts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-divider/60 px-4 py-12 text-center text-sm text-text/50">
              This list is empty. Add products from your faves.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {collectionProducts.map((product) => (
                <div key={product.id} className="group relative">
                  <Link href={`/product/${product.id}`} className="block">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-surface">
                      <Image src={product.images[0]} alt={product.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-sm text-text">{product.name}</p>
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setProductIds(list.id, list.productIds.filter((id) => id !== product.id))
                    }
                    aria-label="Remove"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pickers */}
      {pagePicker && (
        <ProductPickerDialog
          onClose={() => setPagePicker(null)}
          inListIds={pages.find((p) => p.id === pagePicker)?.productIds ?? []}
          onSelect={(pid) => {
            const page = pages.find((p) => p.id === pagePicker);
            if (page && !page.productIds.includes(pid)) {
              updatePage(list.id, page.id, { productIds: [...page.productIds, pid] });
            }
          }}
        />
      )}
      {collectionPicker && (
        <ProductPickerDialog
          multi
          onClose={() => setCollectionPicker(false)}
          inListIds={list.productIds}
          onSelect={(pid) =>
            setProductIds(
              list.id,
              list.productIds.includes(pid)
                ? list.productIds.filter((id) => id !== pid)
                : [...list.productIds, pid],
            )
          }
        />
      )}
      {sharing && (
        <ShareListDialog list={list} onClose={() => setSharing(false)} onToast={showToast} />
      )}
      <ToastContainer />
    </div>
  );
}

function TemplateOption({
  template,
  active,
  onClick,
}: {
  template: TemplateId;
  active: boolean;
  onClick: () => void;
}) {
  const layout = TEMPLATE_LAYOUT[template];
  return (
    <button
      type="button"
      onClick={onClick}
      title={layout.label}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors",
        active ? "border-accent bg-accent/10" : "border-divider/60 hover:border-text/30",
      )}
    >
      <span className={cn("grid h-8 w-6 gap-0.5", layout.grid)}>
        {Array.from({ length: layout.tiles }).map((_, i) => (
          <span key={i} className={cn("rounded-[1px]", active ? "bg-accent" : "bg-text/25")} />
        ))}
      </span>
      <span className={cn("text-[9px] font-medium", active ? "text-accent" : "text-text/50")}>
        {template}
      </span>
    </button>
  );
}
