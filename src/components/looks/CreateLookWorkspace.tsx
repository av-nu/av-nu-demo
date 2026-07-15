"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Film, Heart, ImagePlus, LoaderCircle, Lock, PanelRightOpen, Save, Send, Sparkles, WandSparkles, X } from "lucide-react";

import { LayflatPostPreview } from "@/components/looks/LayflatPostPreview";
import { LookbookSocialPostPreview } from "@/components/looks/LookbookSocialPostPreview";
import { EditorialBuilder } from "@/components/looks/editorial/EditorialBuilder";
import { EditorialColorPicker } from "@/components/looks/editorial/EditorialColorPicker";
import { ProductPickerDialog } from "@/components/faves/ProductPickerDialog";
import { LookProductTile } from "@/components/looks/LookProductTile";
import { SaveLookDialog } from "@/components/looks/SaveLookDialog";
import { ShareLookbookDialog } from "@/components/looks/ShareLookbookDialog";
import { useToast } from "@/components/ui/Toast";
import { mockProducts } from "@/data/mockProducts";
import { useAuth } from "@/hooks/useAuth";
import { useFaveLists } from "@/hooks/useFaveLists";
import { useSavedLooks } from "@/hooks/useSavedLooks";
import { socialService } from "@/lib/social";
import { createEditorialPage, createProductElement, editorialProductIds, normalizeEditorialPage, type EditorialPageDesign } from "@/lib/editorial";
import type { FaveVisibility } from "@/data/faves";
import { generateLook, refineLook, toggleLookLock, type LayflatStyle, type LookbookLayout, type LookbookMedia, type SavedLook } from "@/lib/lookEngine";

const promptChips = ["Summer dinner", "Wedding guest", "Vacation outfit", "Work look", "First date", "Brunch", "Minimalist", "Coastal", "Under $150"];
const refinementChips = ["More casual", "Dressier", "Lower price", "More colorful", "More neutral", "More minimalist", "Swap shoes", "Add accessories"];
const demoLookPrompts = ["A coastal dinner look", "Wedding guest under $200", "Easy Saturday brunch", "Polished work outfit", "Weekend city getaway", "Minimalist date night", "Garden party in spring", "Everyday neutrals"];
const layoutOptions: Array<{ value: LookbookLayout; label: string }> = [{ value: "layflat", label: "Layflat" }, { value: "grid", label: "Grid" }, { value: "editorial", label: "Editorial" }];
const layflatOptions: Array<{ value: LayflatStyle; label: string; description: string }> = [{ value: "classic", label: "Tailored", description: "Two hero pieces with smaller accessories" }, { value: "diagonal", label: "Weekend", description: "Relaxed separates with shoes below" }, { value: "stacked", label: "Tonal", description: "Large close-cropped pieces on a clean surface" }, { value: "orbit", label: "Styled", description: "A centered statement piece framed by the look" }];

type CreateLookWorkspaceProps = {
  savedLookId?: string;
};

function productFor(id: string) {
  return mockProducts.find((product) => product.id === id);
}

export function CreateLookWorkspace({ savedLookId }: CreateLookWorkspaceProps) {
  const { isAuthenticated } = useAuth();
  const { looks, isHydrated, getLook, saveLook, seedLookbook } = useSavedLooks();
  const { upsertLookbookPost } = useFaveLists();
  const { showToast, ToastContainer } = useToast();
  const [prompt, setPrompt] = useState("");
  const [look, setLook] = useState<SavedLook | null>(null);
  const [sourceImage, setSourceImage] = useState<string>();
  const [budget, setBudget] = useState("");
  const [refinement, setRefinement] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [lookbookOpen, setLookbookOpen] = useState(false);
  const [showLayflatPreview, setShowLayflatPreview] = useState(true);
  const [showSocialPostPreview, setShowSocialPostPreview] = useState(false);
  const [favesPickerOpen, setFavesPickerOpen] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [draggedProductId, setDraggedProductId] = useState<string>();
  const [expandedRailIds, setExpandedRailIds] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);
  const backgroundInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!savedLookId || look) return;
    const saved = getLook(savedLookId);
    if (!saved) return;
    setLook(saved);
    setPrompt(saved.prompt);
    setSourceImage(saved.sourceImage);
  }, [getLook, look, savedLookId]);

  useEffect(() => {
    if (!isHydrated) return;
    seedLookbook(demoLookPrompts.map((demoPrompt) => generateLook(demoPrompt)));
  }, [isHydrated, seedLookbook]);

  const generate = () => {
    if (!prompt.trim() && !sourceImage) {
      showToast("Add a vibe or inspiration image to begin", "error");
      return;
    }
    setGenerating(true);
    window.setTimeout(() => {
      const next = generateLook(prompt, { budget: Number(budget) || undefined, sourceImage });
      setLook(next);
      setActivePageIndex(0);
      setGenerating(false);
    }, 650);
  };

  const refine = (value: string) => {
    if (!look || !value.trim()) return;
    setGenerating(true);
    window.setTimeout(() => {
      const pages = look.pages?.length ? look.pages : [{ id: `page-${look.id}`, productIds: look.selectedProductIds }];
      const currentPage = pages[Math.min(activePageIndex, pages.length - 1)];
      if (!currentPage) return;
      const refined = refineLook({ ...look, selectedProductIds: currentPage.productIds }, value);
      if (look.layout === "editorial") {
        setLook({ ...refined, pages, selectedProductIds: pages[0]?.productIds ?? [] });
      } else {
        const nextPages = pages.map((page, index) => index === activePageIndex ? { ...page, productIds: refined.selectedProductIds } : page);
        setLook({ ...refined, pages: nextPages, selectedProductIds: nextPages[0]?.productIds ?? [] });
      }
      setRefinement("");
      setGenerating(false);
    }, 420);
  };

  const save = () => {
    if (!look) return;
    if (!isAuthenticated) {
      setSaveDialogOpen(true);
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      saveLook(look);
      setSaving(false);
      showToast("Look saved to your profile");
    }, 250);
  };

  const handleBackgroundImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string" || !look) return;
      setLook({ ...look, backgroundImage: reader.result, updatedAt: Date.now() });
    };
    reader.readAsDataURL(file);
  };

  const publishLookbook = (visibility: FaveVisibility, sharedWith: string[]) => {
    if (!look) return;
    const postListId = upsertLookbookPost(look, visibility, sharedWith);
    const next = { ...look, postListId, updatedAt: Date.now() };
    setLook(next);
    saveLook(next);
    if (visibility === "public") socialService.simulateEngagement({ id: postListId, label: look.title });
    setShareDialogOpen(false);
    showToast(visibility === "public" ? "Published to the home feed" : "Lookbook shared");
  };

  const handleImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choose an image file", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSourceImage(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  };

  const pages = look ? (look.pages?.length ? look.pages : [{ id: `page-${look.id}`, productIds: look.selectedProductIds }]) : [];
  const pageIndex = Math.min(activePageIndex, Math.max(pages.length - 1, 0));
  const activePage = pages[pageIndex];
  const activeProductIds = activePage?.productIds ?? [];
  const activeMedia = activePage?.media ?? [];
  const gridItemCount = Math.min(8, Math.max(1, activePage?.gridItemCount ?? Math.max(4, activeProductIds.length + activeMedia.length)));
  const pageCapacity = look?.layout === "grid" ? gridItemCount : 8;
  const selected = activeProductIds
    .map(productFor)
    .filter((product): product is NonNullable<ReturnType<typeof productFor>> => Boolean(product));
  const editorialProducts = look ? Array.from(new Set([...activeProductIds, ...look.rails.flatMap((rail) => rail.productIds)]))
    .map(productFor)
    .filter((product): product is NonNullable<ReturnType<typeof productFor>> => Boolean(product)) : [];

  const updateActivePageProducts = (productIds: string[], removeLocks = false) => {
    if (!look) return;
    const nextPages = pages.map((page, index) => index === pageIndex ? { ...page, productIds } : page);
    setLook({ ...look, pages: nextPages, selectedProductIds: nextPages[0]?.productIds ?? [], lockedProductIds: removeLocks ? look.lockedProductIds.filter((id) => id !== activeProductIds.find((id) => !productIds.includes(id))) : look.lockedProductIds, updatedAt: Date.now() });
  };

  const updateActivePageMedia = (media: LookbookMedia[]) => {
    if (!look) return;
    const nextPages = pages.map((page, index) => index === pageIndex ? { ...page, media } : page);
    setLook({ ...look, pages: nextPages, selectedProductIds: nextPages[0]?.productIds ?? [], updatedAt: Date.now() });
  };

  const handlePageMedia = (file?: File) => {
    if (!file || !look || look.layout === "editorial") return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      showToast("Choose an image or video file", "error");
      return;
    }
    if (activeProductIds.length + activeMedia.length >= pageCapacity) {
      showToast(`This page is set to ${pageCapacity} item${pageCapacity === 1 ? "" : "s"}. Choose a larger grid or add a page.`, "error");
      return;
    }
    if (file.type.startsWith("video/") && file.size > 15_000_000) {
      showToast("Video clips must be smaller than 15 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      updateActivePageMedia([...activeMedia, { id: `media-${Date.now()}`, type: file.type.startsWith("video/") ? "video" : "image", src: reader.result, name: file.name }]);
      if (mediaInput.current) mediaInput.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const setGridItemCount = (count: number) => {
    if (!look || !activePage) return;
    const productIds = activeProductIds.slice(0, count);
    const media = activeMedia.slice(0, Math.max(0, count - productIds.length));
    const removed = activeProductIds.length + activeMedia.length - productIds.length - media.length;
    const nextPages = pages.map((page, index) => index === pageIndex ? { ...page, gridItemCount: count, productIds, media } : page);
    setLook({ ...look, pages: nextPages, selectedProductIds: nextPages[0]?.productIds ?? [], updatedAt: Date.now() });
    if (removed > 0) showToast(`${removed} item${removed === 1 ? "" : "s"} removed to fit this grid.`);
  };

  const updateEditorialPage = (design: EditorialPageDesign) => {
    if (!look) return;
    const productIds = editorialProductIds(design);
    const nextPages = pages.map((page, index) => index === pageIndex ? { ...page, productIds, editorial: design } : page);
    setLook({ ...look, pages: nextPages, selectedProductIds: nextPages[0]?.productIds ?? [], updatedAt: Date.now() });
  };

  const setLayout = (layout: LookbookLayout) => {
    if (!look) return;
    if (layout !== "editorial") {
      setLook({ ...look, layout, updatedAt: Date.now() });
      return;
    }
    const nextPages = pages.map((page, index) => index === pageIndex ? { ...page, editorial: normalizeEditorialPage(page.editorial, page.productIds, look.title) } : page);
    setLook({ ...look, layout, pages: nextPages, selectedProductIds: nextPages[0]?.productIds ?? [], updatedAt: Date.now() });
    setShowLayflatPreview(false);
    setShowSocialPostPreview(false);
  };

  const addProduct = (productId: string) => {
    if (!look) return;
    if (look.layout === "editorial") {
      const design = normalizeEditorialPage(activePage?.editorial, activeProductIds, look.title);
      const maxZ = Math.max(0, ...design.elements.map((element) => element.zIndex));
      const element = { ...createProductElement(productId, design.elements.length), zIndex: maxZ + 1 };
      updateEditorialPage({ ...design, elements: [...design.elements, element] });
      return;
    }
    if (activeProductIds.includes(productId)) return;
    if (activeProductIds.length + activeMedia.length >= pageCapacity) {
      showToast(`This page is set to ${pageCapacity} item${pageCapacity === 1 ? "" : "s"}. Choose a larger grid or add a page.`, "error");
      return;
    }
    updateActivePageProducts([...activeProductIds, productId]);
  };

  const removeProduct = (productId: string) => {
    if (look?.layout === "editorial" && activePage?.editorial) {
      updateEditorialPage({ ...activePage.editorial, elements: activePage.editorial.elements.filter((element) => element.type !== "product" || element.productId !== productId) });
      return;
    }
    updateActivePageProducts(activeProductIds.filter((id) => id !== productId), true);
  };

  const addPage = () => {
    if (!look) return;
    const id = `page-${Date.now()}`;
    const nextPage = look.layout === "editorial" ? { id, productIds: [], editorial: createEditorialPage([], look.title, "collection-story") } : { id, productIds: [], gridItemCount: look.layout === "grid" ? 4 : 8 };
    const nextPages = [...pages, nextPage];
    setLook({ ...look, pages: nextPages, selectedProductIds: nextPages[0]?.productIds ?? [], updatedAt: Date.now() });
    setActivePageIndex(nextPages.length - 1);
    setShowLayflatPreview(false);
    setShowSocialPostPreview(false);
  };

  const duplicatePage = () => {
    if (!look || !activePage) return;
    const copy = { ...activePage, id: `page-${Date.now()}`, productIds: [...activePage.productIds], media: activePage.media?.map((item) => ({ ...item, id: `${item.id}-copy-${Date.now()}` })), editorial: activePage.editorial ? { ...activePage.editorial, elements: activePage.editorial.elements.map((element) => ({ ...element, id: `${element.id}-copy-${Date.now()}` })) } : undefined };
    const nextPages = [...pages.slice(0, pageIndex + 1), copy, ...pages.slice(pageIndex + 1)];
    setLook({ ...look, pages: nextPages, selectedProductIds: nextPages[0]?.productIds ?? [], updatedAt: Date.now() });
    setActivePageIndex(pageIndex + 1);
  };

  const movePage = (direction: -1 | 1) => {
    if (!look) return;
    const target = pageIndex + direction;
    if (target < 0 || target >= pages.length) return;
    const nextPages = [...pages];
    const [page] = nextPages.splice(pageIndex, 1);
    nextPages.splice(target, 0, page);
    setLook({ ...look, pages: nextPages, selectedProductIds: nextPages[0]?.productIds ?? [], updatedAt: Date.now() });
    setActivePageIndex(target);
  };

  const deletePage = () => {
    if (!look || pages.length <= 1) return;
    const nextPages = pages.filter((_, index) => index !== pageIndex);
    setLook({ ...look, pages: nextPages, selectedProductIds: nextPages[0]?.productIds ?? [], updatedAt: Date.now() });
    setActivePageIndex(Math.min(pageIndex, nextPages.length - 1));
  };

  const reorderProduct = (targetId: string) => {
    if (!draggedProductId || draggedProductId === targetId) return;
    const from = activeProductIds.indexOf(draggedProductId);
    const to = activeProductIds.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = [...activeProductIds];
    next.splice(from, 1);
    next.splice(to, 0, draggedProductId);
    updateActivePageProducts(next);
    setDraggedProductId(undefined);
  };

  const loadSavedLook = (savedLook: SavedLook) => {
    setLook(savedLook);
    setPrompt(savedLook.prompt);
    setSourceImage(savedLook.sourceImage);
    setActivePageIndex(0);
    setExpandedRailIds([]);
    window.history.replaceState(null, "", `/create-a-look/${savedLook.id}`);
    setLookbookOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const lookbookContent = (compact = false) => {
    const visibleLooks = compact ? looks.filter((savedLook) => savedLook.id !== look?.id) : looks;

    return (
    <>
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink/10 text-pink"><BookOpen className="h-4 w-4" /></span>
          <div>
            <h2 className="font-headline text-lg tracking-tight text-text">{compact ? "Other Lookbooks" : "Lookbook"}</h2>
            <p className="text-xs text-text/45">{compact ? "Choose another saved look" : "Saved looks"}</p>
          </div>
        </div>
        <span className="rounded-full bg-bg px-2 py-1 text-[10px] font-semibold text-text/50">{visibleLooks.length}</span>
      </div>
      {visibleLooks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-divider/60 px-3 py-5 text-center text-xs leading-relaxed text-text/45">{compact ? "No other saved Lookbooks yet." : "Save a look to build your collection."}</p>
      ) : (
        <div className={`${compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-2"} overflow-y-auto pr-1`}>
          {visibleLooks.map((savedLook) => {
            const cover = savedLook.sourceImage ?? productFor(savedLook.selectedProductIds[0] ?? "")?.images[0];
            const isActive = savedLook.id === look?.id;
            return (
              <button
                key={savedLook.id}
                type="button"
                onClick={() => loadSavedLook(savedLook)}
                aria-pressed={isActive}
                className={`group w-full overflow-hidden rounded-xl border text-left transition-colors ${isActive ? "border-accent bg-accent/5" : "border-transparent hover:border-divider/80 hover:bg-bg"}`}
              >
                <div className="relative aspect-[4/3] bg-bg">
                  {cover ? <Image src={cover} alt="" fill sizes={compact ? "50vw" : "192px"} className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized={cover.startsWith("data:")} /> : null}
                  {isActive && <span className="absolute left-2 top-2 rounded-full bg-bg/90 px-2 py-1 text-[10px] font-semibold text-accent shadow-sm">Open</span>}
                </div>
                <p className="truncate px-2.5 py-2 font-headline text-sm text-text">{savedLook.title}</p>
              </button>
            );
          })}
        </div>
      )}
    </>
    );
  };

  const activeLookEditor = look ? (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-accent/35 bg-bg p-4 shadow-sm sm:p-7">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-xl lg:max-w-none lg:flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Editing Lookbook</p>
          <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-text/45">Title</label>
          <input value={look.title} onChange={(event) => setLook({ ...look, title: event.target.value, updatedAt: Date.now() })} aria-label="Lookbook title" className="mt-1 w-full rounded-xl border border-divider/60 bg-surface/30 px-3 py-2 font-headline text-2xl tracking-tight text-text transition-colors hover:border-text/30 focus:border-accent/50 focus:outline-none sm:text-3xl" />
          <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-text/45">Description</label>
          <textarea value={look.description} onChange={(event) => setLook({ ...look, description: event.target.value, updatedAt: Date.now() })} aria-label="Lookbook description" rows={2} className="mt-1 w-full resize-none rounded-xl border border-divider/60 bg-surface/30 px-3 py-2 text-sm leading-relaxed text-text/70 transition-colors hover:border-text/30 focus:border-accent/50 focus:outline-none" />
        </div>
        <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto">
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-burgundy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setShareDialogOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-divider/70 px-4 py-2.5 text-sm font-semibold text-text/70 hover:bg-surface"><Send className="h-4 w-4" />Share</button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {pages.map((page, index) => <button key={page.id} type="button" onClick={() => { setActivePageIndex(index); setShowSocialPostPreview(false); }} aria-pressed={pageIndex === index} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${pageIndex === index ? "bg-text text-bg" : "border border-divider/70 text-text/60 hover:bg-surface"}`}>Page {index + 1} · {page.productIds.length + (page.media?.length ?? 0)}{look.layout === "editorial" ? " items" : `/${look.layout === "grid" ? (page.gridItemCount ?? 4) : 8}`}</button>)}
        <button type="button" onClick={addPage} className="rounded-full border border-accent/40 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/5">+ Add page</button>
        <button type="button" onClick={() => setFavesPickerOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-pink/35 px-3 py-1.5 text-xs font-semibold text-pink hover:bg-pink/5"><Heart className="h-3.5 w-3.5" />Add from Faves</button>
        {look.layout !== "editorial" && <><button type="button" onClick={() => mediaInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-full border border-divider/70 px-3 py-1.5 text-xs font-semibold text-text/65 hover:bg-surface"><ImagePlus className="h-3.5 w-3.5" />Add image or video</button><input ref={mediaInput} type="file" accept="image/*,video/*" onChange={(event) => handlePageMedia(event.target.files?.[0])} className="sr-only" /></>}
        {look.layout === "editorial" && <div className="flex items-center gap-1 rounded-full border border-divider/60 p-1"><button type="button" onClick={() => movePage(-1)} disabled={pageIndex === 0} className="rounded-full px-2 py-1 text-[10px] font-semibold text-text/55 disabled:opacity-30">←</button><button type="button" onClick={duplicatePage} className="rounded-full px-2 py-1 text-[10px] font-semibold text-text/55">Duplicate</button><button type="button" onClick={() => movePage(1)} disabled={pageIndex === pages.length - 1} className="rounded-full px-2 py-1 text-[10px] font-semibold text-text/55 disabled:opacity-30">→</button><button type="button" onClick={deletePage} disabled={pages.length <= 1} className="rounded-full px-2 py-1 text-[10px] font-semibold text-pink disabled:opacity-30">Delete</button></div>}
        <button type="button" onClick={() => setLookbookOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-divider/70 px-3 py-1.5 text-xs font-semibold text-text/65 hover:bg-surface xl:hidden"><PanelRightOpen className="h-3.5 w-3.5" />Other Lookbooks <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px]">{Math.max(looks.length - 1, 0)}</span></button>
      </div>
      {look.layout === "editorial" ? (
        <div className="mt-5 min-w-0 space-y-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text/45">Post layout</p><div className="mt-2 flex flex-wrap gap-2">{layoutOptions.map((option) => <button key={option.value} type="button" onClick={() => setLayout(option.value)} aria-pressed={(look.layout ?? "layflat") === option.value} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${((look.layout ?? "layflat") === option.value) ? "bg-text text-bg" : "border border-divider/70 text-text/60 hover:bg-surface"}`}>{option.label}</button>)}</div></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setShowSocialPostPreview(false); setShowLayflatPreview(false); }} aria-pressed={!showLayflatPreview && !showSocialPostPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!showLayflatPreview && !showSocialPostPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Edit canvas</button><button type="button" onClick={() => { setShowSocialPostPreview(false); setShowLayflatPreview(true); }} aria-pressed={!showSocialPostPreview && showLayflatPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!showSocialPostPreview && showLayflatPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Preview design</button><button type="button" onClick={() => { setShowSocialPostPreview(true); setShowLayflatPreview(true); }} aria-pressed={showSocialPostPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${showSocialPostPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Preview social post</button></div>
          {showSocialPostPreview ? <div className="mx-auto w-full max-w-lg"><LookbookSocialPostPreview title={look.title} products={selected} layout="editorial" editorialDesign={normalizeEditorialPage(activePage?.editorial, activeProductIds, look.title)} /></div> : showLayflatPreview ? <div className="mx-auto w-full max-w-2xl"><LayflatPostPreview products={selected} title={look.title} layout="editorial" editorialDesign={normalizeEditorialPage(activePage?.editorial, activeProductIds, look.title)} /></div> : <EditorialBuilder key={activePage?.id} title={look.title} design={normalizeEditorialPage(activePage?.editorial, activeProductIds, look.title)} products={editorialProducts} onChangeAction={updateEditorialPage} />}
        </div>
      ) : (
      <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:items-start">
        <div className="contents">
          <div className="order-1 xl:col-start-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text/45">Post layout</p>
            <div className="mt-2 flex flex-wrap gap-2">{layoutOptions.map((option) => <button key={option.value} type="button" onClick={() => setLayout(option.value)} aria-pressed={(look.layout ?? "layflat") === option.value} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${((look.layout ?? "layflat") === option.value) ? "bg-text text-bg" : "border border-divider/70 text-text/60 hover:bg-surface"}`}>{option.label}</button>)}</div>
          </div>
          {look.layout === "layflat" && <div className="order-1 xl:col-start-1"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text/45">Styled overhead arrangement</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{layflatOptions.map((option, optionIndex) => <button key={option.value} type="button" onClick={() => { const nextPages = pages.map((page, index) => index === pageIndex ? { ...page, layflatStyle: option.value } : page); setLook({ ...look, pages: nextPages, updatedAt: Date.now() }); }} aria-pressed={(activePage?.layflatStyle ?? "classic") === option.value} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${(activePage?.layflatStyle ?? "classic") === option.value ? "border-text bg-text text-bg" : "border-divider/70 bg-bg text-text/65"}`}><span className="relative h-12 w-12 shrink-0 rounded-lg bg-surface"><span className={`absolute h-7 w-4 rounded-sm bg-accent/45 ${optionIndex % 2 ? "left-2 top-2 rotate-6" : "left-1.5 top-1.5 -rotate-3"}`} /><span className={`absolute h-8 w-4 rounded-sm bg-burgundy/35 ${optionIndex > 1 ? "right-1.5 top-1 rotate-3" : "right-2 bottom-1 -rotate-6"}`} /><span className="absolute bottom-1 left-5 h-2 w-2 rounded-full bg-pink/60" /></span><span><span className="block text-xs font-semibold">{option.label}</span><span className={`mt-0.5 block text-[10px] leading-relaxed ${(activePage?.layflatStyle ?? "classic") === option.value ? "text-bg/65" : "text-text/40"}`}>{option.description}</span></span></button>)}</div></div>}
          {look.layout === "grid" && <div className="order-1 xl:col-start-1"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text/45">Images on this page</p><p className="mt-1 text-[11px] text-text/45">Choose a layout capacity from 1 to 8.</p></div><span className="font-headline text-2xl text-text">{gridItemCount}</span></div><div className="mt-3 grid grid-cols-8 gap-1.5">{Array.from({ length: 8 }, (_, index) => index + 1).map((count) => <button key={count} type="button" onClick={() => setGridItemCount(count)} aria-pressed={gridItemCount === count} className={`aspect-square rounded-lg text-xs font-semibold ${gridItemCount === count ? "bg-text text-bg" : "border border-divider/70 bg-bg text-text/55 hover:border-text/30"}`}>{count}</button>)}</div></div>}
          <div className="order-1 xl:col-start-1 space-y-2">
            <EditorialColorPicker label="Background" value={look.backgroundColor ?? "#F7F4EE"} action={(color) => setLook({ ...look, backgroundColor: color, updatedAt: Date.now() })} />
            <button type="button" onClick={() => backgroundInput.current?.click()} className="rounded-full border border-divider/70 px-3 py-1.5 text-xs font-semibold text-text/60 hover:bg-surface">Upload image</button><input ref={backgroundInput} type="file" accept="image/*" onChange={(event) => handleBackgroundImage(event.target.files?.[0])} className="sr-only" />
          </div>
          <div className="order-3 flex min-h-[280px] w-full min-w-0 max-w-md flex-col justify-self-center overflow-hidden rounded-2xl border border-divider/60 bg-surface/30 p-4 xl:col-start-1 xl:max-w-none xl:justify-self-stretch">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Refine</p>
            <form onSubmit={(event) => { event.preventDefault(); refine(refinement); }} className="mt-3 flex w-full min-w-0 flex-1 flex-col gap-3">
              <textarea value={refinement} onChange={(event) => setRefinement(event.target.value)} placeholder="Describe how you want to change this look." className="min-h-28 w-full min-w-0 flex-1 resize-none rounded-xl border border-divider/60 bg-bg px-4 py-3 text-sm leading-relaxed text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none" />
              <div className="flex justify-end"><button type="submit" disabled={!refinement.trim() || generating} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{generating ? "Refining..." : "Refine look"}</button></div>
            </form>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{refinementChips.map((chip) => <button key={chip} type="button" onClick={() => refine(chip)} className="shrink-0 rounded-full border border-divider/60 bg-bg px-3 py-1.5 text-xs font-semibold text-text/60 hover:border-accent/40 hover:text-accent">{chip}</button>)}</div>
          </div>
        </div>
        <div className="order-2 w-full min-w-0 max-w-md justify-self-center xl:col-start-2 xl:row-start-1 xl:row-span-3 xl:max-w-full xl:justify-self-stretch">
          {showSocialPostPreview ? <LookbookSocialPostPreview title={look.title} products={selected} layout={look.layout} backgroundColor={look.backgroundColor} backgroundImage={look.backgroundImage} media={activeMedia} layflatStyle={activePage?.layflatStyle} gridItemCount={gridItemCount} /> : showLayflatPreview ? <LayflatPostPreview products={selected} title={look.title} layout={look.layout} backgroundColor={look.backgroundColor} backgroundImage={look.backgroundImage} media={activeMedia} layflatStyle={activePage?.layflatStyle} gridItemCount={gridItemCount} /> : <><p className="mb-3 text-xs font-medium text-text/50">Drag products to arrange this page. Uploaded media stays unlinked.</p><div className="grid gap-3 sm:grid-cols-2">{selected.map((product) => <div key={product.id} draggable onDragStart={() => setDraggedProductId(product.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderProduct(product.id)} className="cursor-grab active:cursor-grabbing"><LookProductTile product={product} selected locked={look.lockedProductIds.includes(product.id)} onLock={() => setLook(toggleLookLock(look, product.id))} onRemove={() => removeProduct(product.id)} /></div>)}{activeMedia.map((item) => <article key={item.id} className="relative overflow-hidden rounded-2xl border border-divider/60 bg-bg"><div className="relative aspect-[4/5] bg-surface">{item.type === "video" ? <video src={item.src} controls playsInline className="h-full w-full object-cover" /> : <Image src={item.src} alt={item.name} fill sizes="220px" className="object-cover" unoptimized />}</div><div className="flex items-center justify-between gap-2 p-3"><span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-text/60">{item.type === "video" && <Film className="h-3.5 w-3.5" />}{item.name}</span><button type="button" onClick={() => updateActivePageMedia(activeMedia.filter((media) => media.id !== item.id))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink/10 text-pink" aria-label={`Remove ${item.name}`}><X className="h-3.5 w-3.5" /></button></div></article>)}</div></>}
          <div className="mt-4 flex flex-wrap justify-center gap-2 xl:justify-start"><button type="button" onClick={() => { setShowSocialPostPreview(true); setShowLayflatPreview(true); }} aria-pressed={showSocialPostPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${showSocialPostPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Preview social post</button><button type="button" onClick={() => { setShowSocialPostPreview(false); setShowLayflatPreview(true); }} aria-pressed={!showSocialPostPreview && showLayflatPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!showSocialPostPreview && showLayflatPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Preview design</button><button type="button" onClick={() => { setShowSocialPostPreview(false); setShowLayflatPreview(false); }} aria-pressed={!showLayflatPreview && !showSocialPostPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!showLayflatPreview && !showSocialPostPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Edit products</button></div>
          <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-text/45 xl:justify-start xl:text-left"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Lock a piece to preserve it while refining. Use the minus icon to remove a piece.</p>
        </div>
      </div>
      )}
    </section>
  ) : null;

  const lookbook = (
    <aside className="hidden xl:block">
      <div className="sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-divider/60 bg-surface/30 p-3">
        {lookbookContent()}
      </div>
    </aside>
  );

  return (
    <div className="mx-auto max-w-[1400px] pb-8 lg:px-6">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <main className="min-w-0 space-y-10">
      {activeLookEditor}
      {!look && <section className="overflow-hidden rounded-3xl border border-divider/60 bg-surface/30 p-5 sm:p-8">
        <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pink/10 px-3 py-1 text-xs font-semibold text-pink">
              <Sparkles className="h-3.5 w-3.5" />
              Your inspiration, shoppable
            </span>
            <h1 className="mt-4 font-headline text-4xl tracking-tight text-text sm:text-5xl">Lookbook</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text/60 sm:text-base">
              Create a shoppable look from a vibe or inspiration image, then save it to your Lookbook.
            </p>
          </div>
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleImage(event.dataTransfer.files[0]);
            }}
            className="relative min-h-44 overflow-hidden rounded-2xl border border-dashed border-divider bg-bg/60 p-4"
          >
            {sourceImage ? (
              <>
                <Image src={sourceImage} alt="Your inspiration" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/20" />
                <button type="button" onClick={() => setSourceImage(undefined)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-bg/90 text-text shadow-sm">
                  <X className="h-4 w-4" />
                </button>
                <p className="absolute bottom-3 left-3 rounded-full bg-bg/90 px-3 py-1.5 text-xs font-semibold text-text shadow-sm">Using your inspiration image</p>
              </>
            ) : (
              <button type="button" onClick={() => fileInput.current?.click()} className="flex min-h-36 w-full flex-col items-center justify-center gap-2 text-center text-text/50 transition-colors hover:text-accent">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent"><ImagePlus className="h-5 w-5" /></span>
                <span className="text-sm font-semibold text-text/70">Add an inspiration image</span>
                <span className="text-xs">Drop it here or browse your device</span>
              </button>
            )}
            <input ref={fileInput} type="file" accept="image/*" onChange={(event) => handleImage(event.target.files?.[0])} className="sr-only" />
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-divider/60 bg-bg p-3 sm:p-4">
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} placeholder="Try: a polished summer dinner look, under $150" className="w-full resize-none bg-transparent px-2 text-base text-text placeholder:text-text/35 focus:outline-none" />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider/50 pt-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-text/50">Budget</label>
              <input value={budget} onChange={(event) => setBudget(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Any" className="h-8 w-20 rounded-lg border border-divider/60 bg-surface px-2 text-xs text-text focus:border-accent/50 focus:outline-none" />
            </div>
            <button type="button" onClick={generate} disabled={generating} className="inline-flex items-center gap-2 rounded-xl bg-burgundy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-burgundy/90 disabled:opacity-50">
              {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
              {generating ? "Finding pieces..." : "Build my look"}
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {promptChips.map((chip) => <button key={chip} type="button" onClick={() => setPrompt(chip)} className="shrink-0 rounded-full border border-divider/60 bg-bg px-3 py-1.5 text-xs font-medium text-text/60 transition-colors hover:border-accent/40 hover:text-accent">{chip}</button>)}
        </div>
      </section>}

      {look && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 space-y-9">
          <section className="space-y-6">
            {look.rails.map((rail) => (
              <div key={rail.id}>
                <div className="mb-3 flex items-center justify-between"><h2 className="font-headline text-xl tracking-tight text-text">{rail.title}</h2>{rail.productIds.length > 5 && <button type="button" onClick={() => setExpandedRailIds((current) => current.includes(rail.id) ? current.filter((id) => id !== rail.id) : [...current, rail.id])} className="inline-flex items-center gap-1 text-sm font-semibold text-accent">{expandedRailIds.includes(rail.id) ? "Show less" : "See all"} <ChevronRight className={`h-4 w-4 transition-transform ${expandedRailIds.includes(rail.id) ? "rotate-90" : ""}`} /></button>}</div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {rail.productIds.slice(0, expandedRailIds.includes(rail.id) ? rail.productIds.length : 5).map((id) => {
                    const product = productFor(id);
                    if (!product) return null;
                    const isSelected = activeProductIds.includes(id);
                    return <LookProductTile key={id} product={product} selected={isSelected} onAdd={isSelected ? undefined : () => addProduct(id)} onRemove={isSelected ? () => removeProduct(id) : undefined} />;
                  })}
                </div>
              </div>
            ))}
          </section>
        </motion.div>
      )}
      </main>
      {lookbook}
      </div>


      {lookbookOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 xl:hidden" onClick={() => setLookbookOpen(false)}>
          <aside className="absolute bottom-0 right-0 top-0 w-[min(88vw,390px)] overflow-y-auto bg-bg p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Your saved collection</p>
              <button type="button" onClick={() => setLookbookOpen(false)} aria-label="Close Lookbook" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text/60"><X className="h-4 w-4" /></button>
            </div>
            {lookbookContent(true)}
          </aside>
        </div>
      )}

      {favesPickerOpen && look && <ProductPickerDialog multi inListIds={activeProductIds} onClose={() => setFavesPickerOpen(false)} onSelect={addProduct} />}
      {saveDialogOpen && <SaveLookDialog onClose={() => setSaveDialogOpen(false)} onCreatedAccount={() => { setSaveDialogOpen(false); if (look) { saveLook(look); showToast("Account created — look saved to your profile"); } }} />}
      {shareDialogOpen && look && <ShareLookbookDialog title={look.title} onClose={() => setShareDialogOpen(false)} onShare={publishLookbook} />}
      <ToastContainer />
    </div>
  );
}
