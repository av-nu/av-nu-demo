"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  Pencil,
  Trash2,
  Check,
  X,
  Lock,
  Users,
  Globe2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { ShareListDialog } from "@/components/faves/ShareListDialog";
import { useFaveLists } from "@/hooks/useFaveLists";
import { useToast } from "@/components/ui/Toast";
import { getProductById } from "@/lib/data";
import { getContactById, getInnerCircle } from "@/data/social";
import { LIST_TYPE_META } from "@/data/faves";

const VIS_META = {
  private: { icon: Lock, label: "Private" },
  "inner-circle": { icon: Users, label: "Inner circle" },
  public: { icon: Globe2, label: "Public" },
} as const;

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { getList, isHydrated, updateList, deleteList } = useFaveLists();
  const { showToast, ToastContainer } = useToast();

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [sharing, setSharing] = useState(false);

  const list = getList(params.id);

  if (!isHydrated) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-surface" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-surface" />
          ))}
        </div>
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

  const products = list.productIds
    .map((id) => getProductById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getProductById>>[];

  const typeMeta = LIST_TYPE_META[list.type];
  const vis = VIS_META[list.visibility];
  const VisIcon = vis.icon;

  const recipients =
    list.visibility === "inner-circle"
      ? list.sharedWith.length > 0
        ? list.sharedWith
            .map((id) => getContactById(id)?.name)
            .filter(Boolean)
            .join(", ")
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

  return (
    <div className="space-y-8">
      {/* Back */}
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
        <span className={cn("text-xs font-medium uppercase tracking-wide", typeMeta.accent)}>
          {list.type}
        </span>

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
              <button
                type="button"
                onClick={saveEdit}
                aria-label="Save name"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Cancel"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text/50 hover:bg-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-headline text-3xl tracking-tight text-text">{list.name}</h1>
              <button
                type="button"
                onClick={startEdit}
                aria-label="Rename list"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text/40 transition-colors hover:bg-surface hover:text-text"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-text/50">
          <span>{products.length} {products.length === 1 ? "item" : "items"}</span>
          <span className="flex items-center gap-1">
            <VisIcon className="h-3.5 w-3.5" />
            {vis.label}
          </span>
          {recipients && <span className="text-text/40">· {recipients}</span>}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={() => setSharing(true)} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant="surface"
            onClick={handleDelete}
            className="gap-2 text-pink hover:text-pink"
          >
            <Trash2 className="h-4 w-4" />
            Delete list
          </Button>
        </div>
      </motion.div>

      {/* Products */}
      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-divider/60 px-4 py-12 text-center text-sm text-text/50">
          This list is empty. Tap the heart on a product and add it to “{list.name}”.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 8}
              onShare={showToast}
            />
          ))}
        </div>
      )}

      {sharing && (
        <ShareListDialog list={list} onClose={() => setSharing(false)} onToast={showToast} />
      )}
      <ToastContainer />
    </div>
  );
}
