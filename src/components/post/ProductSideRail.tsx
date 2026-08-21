"use client";

import { FileText, Plus } from "lucide-react";

import { AddProductTool } from "@/components/post/tools/AddProductTool";

export function ProductSideRail({
  open,
  onClose,
  onOpen,
  onDrafts,
  onAdd,
  onAddMany,
  tagsOnly,
}: {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  onDrafts: () => void;
  onAdd: (productId: string) => void;
  onAddMany: (productIds: string[]) => void;
  tagsOnly: boolean;
}) {
  return (
    <>
      <aside className={`absolute bottom-0 right-0 top-[61px] z-30 hidden w-[360px] border-l border-divider/60 bg-bg shadow-xl md:block ${open ? "" : "pointer-events-none translate-x-full opacity-0"} transition-[transform,opacity] duration-200`} aria-hidden={!open}>
        {open && <><AddProductTool variant="rail" onAdd={onAdd} onAddMany={onAddMany} tagsOnly={tagsOnly} onClose={onClose} /><button type="button" onClick={onDrafts} className="absolute right-12 top-2 z-10 inline-flex h-8 items-center gap-1 rounded-full border border-divider/60 bg-bg px-2.5 text-[10px] font-semibold text-midnight/65 hover:bg-surface"><FileText className="h-3.5 w-3.5" />Drafts</button></>}
      </aside>

      <div className="md:hidden">
        {open ? (
          <aside className="fixed inset-y-[57px] right-0 z-[170] w-[min(88vw,380px)] border-l border-divider/60 bg-bg shadow-2xl">
            <AddProductTool variant="rail" onAdd={onAdd} onAddMany={onAddMany} tagsOnly={tagsOnly} onClose={onClose} />
          </aside>
        ) : (
          <button type="button" onClick={onOpen} className="fixed right-0 top-1/2 z-[160] flex -translate-y-1/2 items-center gap-2 rounded-l-xl bg-pink px-2 py-4 text-white shadow-lg [writing-mode:vertical-rl]" aria-label="Add products">
            <Plus className="h-4 w-4 rotate-90" />
            <span className="text-[11px] font-bold tracking-[0.08em]">Add Products</span>
          </button>
        )}
      </div>
    </>
  );
}
