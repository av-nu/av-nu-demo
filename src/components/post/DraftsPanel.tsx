"use client";

import Image from "next/image";
import { FileText, Trash2, X } from "lucide-react";

import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import { Portal } from "@/components/ui/Portal";
import { getProductById } from "@/lib/data";
import { postCoverPage } from "@/lib/post";
import type { PostDraft } from "@/hooks/usePostDrafts";

export function DraftsPanel({
  drafts,
  onResume,
  onDelete,
  onClose,
}: {
  drafts: PostDraft[];
  onResume: (draft: PostDraft) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Portal>
      <div className="fixed inset-0 z-[190] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
        <section className="flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-2xl sm:max-w-lg sm:rounded-3xl" onClick={(event) => event.stopPropagation()} aria-label="Drafts">
          <header className="flex items-center gap-3 border-b border-divider/60 px-4 py-3">
            <FileText className="h-4 w-4 text-accent" />
            <div className="min-w-0 flex-1"><h2 className="font-headline text-lg text-text">Drafts</h2><p className="text-xs text-text/50">Resume an unfinished post anytime.</p></div>
            <button type="button" onClick={onClose} aria-label="Close drafts" className="flex h-8 w-8 items-center justify-center rounded-full text-text/50 hover:bg-surface"><X className="h-4 w-4" /></button>
          </header>
          <div className="min-h-0 overflow-y-auto p-3">
            {drafts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-divider/70 px-4 py-10 text-center text-sm text-text/50">Meaningful edits will appear here automatically.</div>
            ) : (
              <ul className="space-y-2">
                {drafts.map((draft) => {
                  const cover = postCoverPage(draft.post);
                  const product = getProductById(draft.post.productIds[0] ?? "");
                  return (
                    <li key={draft.id} className="flex items-center gap-3 rounded-2xl border border-divider/60 bg-surface/30 p-2">
                      <button type="button" onClick={() => onResume(draft)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                          {product ? <Image src={product.images[0]} alt="" fill sizes="48px" className="object-cover" /> : <span className="pointer-events-none block"><EditorialRenderer design={cover.design} /></span>}
                        </span>
                        <span className="min-w-0"><span className="block truncate text-sm font-semibold text-text">{draft.title.trim() || draft.post.caption.trim() || "Untitled draft"}</span><span className="mt-1 block text-xs text-text/50">{draft.post.productIds.length} {draft.post.productIds.length === 1 ? "product" : "products"} · {new Date(draft.updatedAt).toLocaleDateString()}</span></span>
                      </button>
                      <button type="button" onClick={() => onDelete(draft.id)} aria-label="Delete draft" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text/40 hover:bg-pink/10 hover:text-pink"><Trash2 className="h-4 w-4" /></button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </Portal>
  );
}
