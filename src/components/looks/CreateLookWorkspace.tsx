"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, BookOpen, BookPlus, Film, GripVertical, ImagePlus, PanelRightOpen, Plus, Save, Send, X } from "lucide-react";

import { GuideCreationFlow, type GuideCreationResult } from "@/components/looks/GuideCreationFlow";
import { LayflatPostPreview } from "@/components/looks/LayflatPostPreview";
import { LookbookSocialPostPreview } from "@/components/looks/LookbookSocialPostPreview";
import { EditorialBuilder } from "@/components/looks/editorial/EditorialBuilder";
import { EditorialColorPicker } from "@/components/looks/editorial/EditorialColorPicker";
import { ProductPickerDialog } from "@/components/faves/ProductPickerDialog";
import { GuideProductOrder } from "@/components/looks/GuideProductOrder";
import { SaveLookDialog } from "@/components/looks/SaveLookDialog";
import { ShareLookbookDialog } from "@/components/looks/ShareLookbookDialog";
import { useToast } from "@/components/ui/Toast";
import { mockProducts } from "@/data/mockProducts";
import { curatedGuideLooks } from "@/data/curatedGuides";
import { useAuth } from "@/hooks/useAuth";
import { useFaveLists } from "@/hooks/useFaveLists";
import { useSavedLooks } from "@/hooks/useSavedLooks";
import { socialService } from "@/lib/social";
import { createEditorialPage, createProductElement, editorialProductIds, normalizeEditorialPage, type EditorialPageDesign } from "@/lib/editorial";
import { type FaveVisibility } from "@/data/faves";
import { generateLook, refineLook, type LayflatStyle, type LookbookLayout, type LookbookMedia, type SavedLook } from "@/lib/lookEngine";

const refinementChips = ["More casual", "Dressier", "Lower price", "More colorful", "More neutral", "More minimalist", "Swap shoes", "Add accessories"];
const GUIDE_DRAFT_KEY = "avnu-create-guide-draft";
const layoutOptions: Array<{ value: LookbookLayout; label: string }> = [{ value: "editorial", label: "Editorial" }, { value: "grid", label: "Grid" }, { value: "featured", label: "Featured" }];
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
  const { lists, upsertLookbookPost } = useFaveLists();
  const { showToast, ToastContainer } = useToast();
  const [prompt, setPrompt] = useState("");
  const [look, setLook] = useState<SavedLook | null>(null);
  const [sourceImage, setSourceImage] = useState<string>();
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [refinement, setRefinement] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [lookbookOpen, setLookbookOpen] = useState(false);
  const [showLayflatPreview, setShowLayflatPreview] = useState(false);
  const [showSocialPostPreview, setShowSocialPostPreview] = useState(false);
  const [favesPickerOpen, setFavesPickerOpen] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const mediaInput = useRef<HTMLInputElement>(null);
  const backgroundInput = useRef<HTMLInputElement>(null);
  const draftRestorationRef = useRef(false);

  useEffect(() => {
    if (!savedLookId || look) return;
    const saved = getLook(savedLookId);
    if (!saved) return;
    setLook(saved);
    setPrompt(saved.prompt);
    setSelectedRecommendations(saved.recommendations ?? []);
    setSourceImage(saved.sourceImage);
  }, [getLook, look, savedLookId]);

  useEffect(() => {
    if (savedLookId || look || new URLSearchParams(window.location.search).get("restoreDraft") !== "1") return;
    const serialized = window.sessionStorage.getItem(GUIDE_DRAFT_KEY);
    if (!serialized) return;
    try {
      const draft = JSON.parse(serialized) as { look?: SavedLook; prompt?: string; recommendations?: string[]; sourceImage?: string; activePageIndex?: number };
      if (!draft.look) return;
      draftRestorationRef.current = true;
      setLook(draft.look);
      setPrompt(draft.prompt ?? draft.look.prompt);
      setSelectedRecommendations(draft.recommendations ?? draft.look.recommendations ?? []);
      setSourceImage(draft.sourceImage);
      setActivePageIndex(draft.activePageIndex ?? 0);
      window.sessionStorage.removeItem(GUIDE_DRAFT_KEY);
    } catch {
      window.sessionStorage.removeItem(GUIDE_DRAFT_KEY);
    }
  }, [look, savedLookId]);

  useEffect(() => {
    if (savedLookId || !look) return;
    if (draftRestorationRef.current) {
      draftRestorationRef.current = false;
      return;
    }
    try {
      window.sessionStorage.setItem(GUIDE_DRAFT_KEY, JSON.stringify({ look, prompt, recommendations: selectedRecommendations, sourceImage, activePageIndex }));
    } catch {
      return;
    }
  }, [activePageIndex, look, prompt, savedLookId, selectedRecommendations, sourceImage]);

  useEffect(() => {
    if (!isHydrated) return;
    seedLookbook(curatedGuideLooks);
  }, [isHydrated, seedLookbook]);

  const startEditor = (result: GuideCreationResult) => {
    const next = generateLook(result.prompt || "My favorite pieces", {
      budget: result.budget,
      sourceImage: result.sourceImage,
      recommendations: result.recommendations,
    });
    const editorTitle = "Title";
    const pageId = `page-${next.id}`;
    const editorialTemplate = createEditorialPage([], editorTitle, "collection-story");
    const blankEditorial = { ...editorialTemplate, elements: editorialTemplate.elements.filter((element) => element.type === "text" && element.name === "Headline") };
    const page = result.layout === "editorial"
      ? { id: pageId, productIds: [], editorial: blankEditorial }
      : { id: pageId, productIds: result.productIds, gridItemCount: result.layout === "grid" ? Math.min(8, Math.max(4, result.productIds.length)) : 8 };
    setPrompt(result.prompt);
    setSelectedRecommendations(result.recommendations);
    setSourceImage(result.sourceImage);
    setLook({ ...next, title: editorTitle, description: "", layout: result.layout, selectedProductIds: result.layout === "editorial" ? [] : result.productIds, availableProductIds: result.productIds, lockedProductIds: [], rails: result.rails, pages: [page] });
    setActivePageIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  const availableProducts = Array.from(new Set(look?.availableProductIds ?? look?.selectedProductIds ?? []))
    .map(productFor)
    .filter((product): product is NonNullable<ReturnType<typeof productFor>> => Boolean(product));
  const favoriteProductIds = lists.find((list) => list.name === "My Favorite Products")?.productIds ?? [];
  const favoriteProducts = Array.from(new Set([...favoriteProductIds, ...activeProductIds]))
    .map(productFor)
    .filter((product): product is NonNullable<ReturnType<typeof productFor>> => Boolean(product));
  const promptProducts = look ? Array.from(new Set(look.rails.flatMap((rail) => rail.productIds)))
    .map(productFor)
    .filter((product): product is NonNullable<ReturnType<typeof productFor>> => Boolean(product)) : [];
  const browsePromptResults = () => undefined;
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

  const addProductAt = (productId: string, x: number, y: number) => {
    if (!look || look.layout !== "editorial" || activeProductIds.includes(productId)) return;
    const design = normalizeEditorialPage(activePage?.editorial, activeProductIds, look.title);
    const maxZ = Math.max(0, ...design.elements.map((element) => element.zIndex));
    const productIndex = design.elements.filter((element) => element.type === "product").length;
    const element = { ...createProductElement(productId, productIndex), x, y, zIndex: maxZ + 1 };
    updateEditorialPage({ ...design, elements: [...design.elements, element] });
  };

  const addProducts = (productIds: string[]) => {
    if (!look) return;
    const availableIds = productIds.filter((id) => !activeProductIds.includes(id));
    if (look.layout === "editorial") {
      const design = normalizeEditorialPage(activePage?.editorial, activeProductIds, look.title);
      const maxZ = Math.max(0, ...design.elements.map((element) => element.zIndex));
      const elements = availableIds.map((productId, index) => ({ ...createProductElement(productId, design.elements.length + index), zIndex: maxZ + index + 1 }));
      updateEditorialPage({ ...design, elements: [...design.elements, ...elements] });
      return;
    }
    const availableCapacity = Math.max(0, pageCapacity - activeProductIds.length - activeMedia.length);
    const idsToAdd = availableIds.slice(0, availableCapacity);
    if (idsToAdd.length === 0) {
      showToast(`This page already has its maximum of ${pageCapacity} items.`, "error");
      return;
    }
    updateActivePageProducts([...activeProductIds, ...idsToAdd]);
    showToast(`${idsToAdd.length} product${idsToAdd.length === 1 ? "" : "s"} added to this Guide`);
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

  const loadSavedLook = (savedLook: SavedLook) => {
    setLook(savedLook);
    setPrompt(savedLook.prompt);
    setSelectedRecommendations(savedLook.recommendations ?? []);
    setSourceImage(savedLook.sourceImage);
    setActivePageIndex(0);
    window.history.replaceState(null, "", `/create/${savedLook.id}`);
    setLookbookOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const lookbookContent = (compact = false) => {
    const visibleLooks = compact ? looks.filter((savedLook) => savedLook.id !== look?.id) : looks;

    return (
    <>
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-burgundy/10 text-burgundy"><BookOpen className="h-4 w-4" /></span>
          <div>
            <h2 className="font-headline text-lg tracking-tight text-text">{compact ? "Other Guides" : "Guides"}</h2>
            <p className="text-xs text-text/45">{compact ? "Choose another saved look" : "Saved looks"}</p>
          </div>
        </div>
        <span className="rounded-full bg-bg px-2 py-1 text-[10px] font-semibold text-text/50">{visibleLooks.length}</span>
      </div>
      {visibleLooks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-divider/60 px-3 py-5 text-center text-xs leading-relaxed text-text/45">{compact ? "No other saved Guides yet." : "Save a look to build your collection."}</p>
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
                className={`group w-full overflow-hidden rounded-xl border text-left transition-colors ${isActive ? "border-ember bg-ember/5" : "border-transparent hover:border-divider/80 hover:bg-bg"}`}
              >
                <div className="relative aspect-[4/3] bg-bg">
                  {cover ? <Image src={cover} alt="" fill sizes={compact ? "50vw" : "192px"} className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized={cover.startsWith("data:")} /> : null}
                  {isActive && <span className="absolute left-2 top-2 rounded-full bg-bg/90 px-2 py-1 text-[10px] font-semibold text-ember shadow-sm">Open</span>}
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

  const renderSelectedProductSource = () => {
    if (!look || look.layout !== "editorial" || availableProducts.length === 0) return null;
    return <section className="rounded-2xl border border-ember/25 bg-ember/5 p-3 sm:p-4">
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember"><GripVertical className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-text">Selected pieces</p><p className="mt-1 text-[11px] leading-relaxed text-text/55">Drag a piece onto the canvas, or tap + to place it automatically.</p></div></div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {availableProducts.map((product) => {
          const onCanvas = activeProductIds.includes(product.id);
          return <button key={product.id} type="button" draggable={!onCanvas} disabled={onCanvas} onClick={() => addProduct(product.id)} onDragStart={(event) => { event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("application/x-avnu-product", product.id); }} className={`group relative w-28 shrink-0 overflow-hidden rounded-xl border bg-bg text-left transition-colors ${onCanvas ? "border-ember/40 opacity-60" : "border-divider/70 hover:border-ember/50"}`}>
            <span className="relative block aspect-[4/5] overflow-hidden bg-surface"><Image src={product.images[0]} alt={product.name} fill sizes="112px" className="object-cover transition-transform duration-300 group-hover:scale-105" /><span className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full ${onCanvas ? "bg-ember text-white" : "bg-bg/90 text-ember"}`}>{onCanvas ? <span className="text-xs font-bold">✓</span> : <Plus className="h-3.5 w-3.5" />}</span></span>
            <span className="block truncate px-2 py-2 text-[10px] font-semibold text-text/75">{product.name}</span><span className="block px-2 pb-2 text-[9px] text-text/45">{onCanvas ? "On canvas" : "Drag or add"}</span>
          </button>;
        })}
      </div>
    </section>;
  };

  const activeLookEditor = look ? (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-ember/35 bg-bg p-4 shadow-sm sm:p-7">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-xl lg:max-w-none lg:flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Editing Guide</p>
          <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-text/45">Title</label>
          <input value={look.title} onChange={(event) => setLook({ ...look, title: event.target.value, updatedAt: Date.now() })} aria-label="Lookbook title" className="mt-1 w-full rounded-xl border border-divider/60 bg-surface/30 px-3 py-2 font-headline text-2xl tracking-tight text-text transition-colors hover:border-text/30 focus:border-ember/50 focus:outline-none sm:text-3xl" />
          <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-text/45">Description</label>
          <textarea value={look.description} onChange={(event) => setLook({ ...look, description: event.target.value, updatedAt: Date.now() })} aria-label="Lookbook description" rows={2} className="mt-1 w-full resize-none rounded-xl border border-divider/60 bg-surface/30 px-3 py-2 text-sm leading-relaxed text-text/70 transition-colors hover:border-text/30 focus:border-ember/50 focus:outline-none" />
        </div>
        <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto">
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setShareDialogOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-divider/70 px-4 py-2.5 text-sm font-semibold text-text/70 hover:bg-surface"><Send className="h-4 w-4" />Share</button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {pages.map((page, index) => <button key={page.id} type="button" onClick={() => { setActivePageIndex(index); setShowSocialPostPreview(false); }} aria-pressed={pageIndex === index} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${pageIndex === index ? "bg-text text-bg" : "border border-divider/70 text-text/60 hover:bg-surface"}`}>Page {index + 1} · {page.productIds.length + (page.media?.length ?? 0)}{look.layout === "editorial" ? " items" : `/${look.layout === "grid" ? (page.gridItemCount ?? 4) : 8}`}</button>)}
        <button type="button" onClick={addPage} className="rounded-full border border-ember/40 px-3 py-1.5 text-xs font-semibold text-ember hover:bg-ember/5">+ Add page</button>
        <button type="button" onClick={() => setFavesPickerOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-burgundy/35 px-3 py-1.5 text-xs font-semibold text-burgundy hover:bg-burgundy/5"><BookPlus className="h-3.5 w-3.5" />Add products</button>
        {look.layout !== "editorial" && <><button type="button" onClick={() => mediaInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-full border border-divider/70 px-3 py-1.5 text-xs font-semibold text-text/65 hover:bg-surface"><ImagePlus className="h-3.5 w-3.5" />Add image or video</button><input ref={mediaInput} type="file" accept="image/*,video/*" onChange={(event) => handlePageMedia(event.target.files?.[0])} className="sr-only" /></>}
        {look.layout === "editorial" && <div className="flex items-center gap-1 rounded-full border border-divider/60 p-1"><button type="button" onClick={() => movePage(-1)} disabled={pageIndex === 0} className="rounded-full px-2 py-1 text-[10px] font-semibold text-text/55 disabled:opacity-30">←</button><button type="button" onClick={duplicatePage} className="rounded-full px-2 py-1 text-[10px] font-semibold text-text/55">Duplicate</button><button type="button" onClick={() => movePage(1)} disabled={pageIndex === pages.length - 1} className="rounded-full px-2 py-1 text-[10px] font-semibold text-text/55 disabled:opacity-30">→</button><button type="button" onClick={deletePage} disabled={pages.length <= 1} className="rounded-full px-2 py-1 text-[10px] font-semibold text-burgundy disabled:opacity-30">Delete</button></div>}
        <button type="button" onClick={() => setLookbookOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-divider/70 px-3 py-1.5 text-xs font-semibold text-text/65 hover:bg-surface xl:hidden"><PanelRightOpen className="h-3.5 w-3.5" />Other Lookbooks <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px]">{Math.max(looks.length - 1, 0)}</span></button>
      </div>
      {look.layout === "editorial" ? (
        <div className="mt-5 min-w-0 space-y-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text/45">Post layout</p><div className="mt-2 flex flex-wrap gap-2">{layoutOptions.map((option) => <button key={option.value} type="button" onClick={() => setLayout(option.value)} aria-pressed={(look.layout ?? "editorial") === option.value} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${((look.layout ?? "editorial") === option.value) ? "bg-text text-bg" : "border border-divider/70 text-text/60 hover:bg-surface"}`}>{option.label}</button>)}</div></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setShowSocialPostPreview(false); setShowLayflatPreview(false); }} aria-pressed={!showLayflatPreview && !showSocialPostPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!showLayflatPreview && !showSocialPostPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Edit canvas</button><button type="button" onClick={() => { setShowSocialPostPreview(false); setShowLayflatPreview(true); }} aria-pressed={!showSocialPostPreview && showLayflatPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!showSocialPostPreview && showLayflatPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Preview design</button><button type="button" onClick={() => { setShowSocialPostPreview(true); setShowLayflatPreview(true); }} aria-pressed={showSocialPostPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${showSocialPostPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Preview social post</button></div>
          {showSocialPostPreview ? <div className="mx-auto w-full max-w-lg"><LookbookSocialPostPreview title={look.title} description={look.description} products={selected} layout="editorial" editorialDesign={normalizeEditorialPage(activePage?.editorial, activeProductIds, look.title)} /></div> : showLayflatPreview ? <div className="mx-auto w-full max-w-2xl"><LayflatPostPreview products={selected} title={look.title} description={look.description} layout="editorial" editorialDesign={normalizeEditorialPage(activePage?.editorial, activeProductIds, look.title)} /></div> : <div className="space-y-3"><div className="rounded-xl border border-ember/25 bg-ember/5 px-3 py-3"><p className="text-xs font-semibold text-text">Start with your prompt results</p><p className="mt-1 text-[11px] leading-relaxed text-text/55">Your prompt matched products below. Browse them first, then add only the pieces that belong on this Guide page.</p><button type="button" onClick={browsePromptResults} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ember px-3 py-1.5 text-[10px] font-semibold text-white">Browse Product Results <ArrowDown className="h-3 w-3" /></button></div>{renderSelectedProductSource()}<EditorialBuilder key={activePage?.id} title={look.title} design={normalizeEditorialPage(activePage?.editorial, activeProductIds, look.title)} products={favoriteProducts} promptProducts={promptProducts} onChangeAction={updateEditorialPage} onAddPromptProduct={addProduct} onDropProduct={addProductAt} onBrowsePromptResults={browsePromptResults} /></div>}
        </div>
      ) : (
      <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] xl:items-start">
        <div className="contents">
          <div className="order-1 xl:col-start-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text/45">Post layout</p>
            <div className="mt-2 flex flex-wrap gap-2">{layoutOptions.map((option) => <button key={option.value} type="button" onClick={() => setLayout(option.value)} aria-pressed={(look.layout ?? "editorial") === option.value} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${((look.layout ?? "editorial") === option.value) ? "bg-text text-bg" : "border border-divider/70 text-text/60 hover:bg-surface"}`}>{option.label}</button>)}</div>
          </div>
          {look.layout === "layflat" && <div className="order-1 xl:col-start-1"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text/45">Styled overhead arrangement</p><div className="mt-2 grid gap-2 xl:grid-cols-2">{layflatOptions.map((option, optionIndex) => <button key={option.value} type="button" onClick={() => { const nextPages = pages.map((page, index) => index === pageIndex ? { ...page, layflatStyle: option.value } : page); setLook({ ...look, pages: nextPages, updatedAt: Date.now() }); }} aria-pressed={(activePage?.layflatStyle ?? "classic") === option.value} className={`flex min-w-0 items-start gap-2 rounded-xl border p-2 text-left ${(activePage?.layflatStyle ?? "classic") === option.value ? "border-text bg-text text-bg" : "border-divider/70 bg-bg text-text/65"}`}><span className="relative h-9 w-9 shrink-0 rounded-lg bg-surface"><span className={`absolute h-7 w-4 rounded-sm bg-ember/45 ${optionIndex % 2 ? "left-2 top-2 rotate-6" : "left-1.5 top-1.5 -rotate-3"}`} /><span className={`absolute h-8 w-4 rounded-sm bg-burgundy/35 ${optionIndex > 1 ? "right-1.5 top-1 rotate-3" : "right-2 bottom-1 -rotate-6"}`} /><span className="absolute bottom-1 left-5 h-2 w-2 rounded-full bg-burgundy/60" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{option.label}</span><span className={`mt-0.5 line-clamp-2 block text-[9px] leading-relaxed ${(activePage?.layflatStyle ?? "classic") === option.value ? "text-bg/65" : "text-text/40"}`}>{option.description}</span></span></button>)}</div></div>}
          {look.layout === "grid" && <div className="order-1 xl:col-start-1"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text/45">Images on this page</p><p className="mt-1 text-[11px] text-text/45">Choose a layout capacity from 1 to 8.</p></div><span className="font-headline text-2xl text-text">{gridItemCount}</span></div><div className="mt-3 grid grid-cols-8 gap-1.5">{Array.from({ length: 8 }, (_, index) => index + 1).map((count) => <button key={count} type="button" onClick={() => setGridItemCount(count)} aria-pressed={gridItemCount === count} className={`aspect-square rounded-lg text-xs font-semibold ${gridItemCount === count ? "bg-text text-bg" : "border border-divider/70 bg-bg text-text/55 hover:border-text/30"}`}>{count}</button>)}</div></div>}
          <div className="order-1 xl:col-start-1 space-y-2">
            <EditorialColorPicker label="Background" value={look.backgroundColor ?? "#FFFDF9"} action={(color) => setLook({ ...look, backgroundColor: color, updatedAt: Date.now() })} />
            <button type="button" onClick={() => backgroundInput.current?.click()} className="rounded-full border border-divider/70 px-3 py-1.5 text-xs font-semibold text-text/60 hover:bg-surface">Upload image</button><input ref={backgroundInput} type="file" accept="image/*" onChange={(event) => handleBackgroundImage(event.target.files?.[0])} className="sr-only" />
          </div>
          <div className="order-3 flex min-h-[280px] w-full min-w-0 max-w-md flex-col justify-self-center overflow-hidden rounded-2xl border border-divider/60 bg-surface/30 p-4 xl:col-start-1 xl:max-w-none xl:justify-self-stretch">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">Refine</p>
            <form onSubmit={(event) => { event.preventDefault(); refine(refinement); }} className="mt-3 flex w-full min-w-0 flex-1 flex-col gap-3">
              <textarea value={refinement} onChange={(event) => setRefinement(event.target.value)} placeholder="Describe how you want to change this look." className="min-h-28 w-full min-w-0 flex-1 resize-none rounded-xl border border-divider/60 bg-bg px-4 py-3 text-sm leading-relaxed text-text placeholder:text-text/40 focus:border-ember/50 focus:outline-none" />
              <div className="flex justify-end"><button type="submit" disabled={!refinement.trim() || generating} className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{generating ? "Refining..." : "Refine look"}</button></div>
            </form>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{refinementChips.map((chip) => <button key={chip} type="button" onClick={() => refine(chip)} className="shrink-0 rounded-full border border-divider/60 bg-bg px-3 py-1.5 text-xs font-semibold text-text/60 hover:border-ember/40 hover:text-ember">{chip}</button>)}</div>
          </div>
        </div>
        <div className="order-2 w-full min-w-0 max-w-md justify-self-center xl:col-start-2 xl:row-start-1 xl:row-span-3 xl:max-w-full xl:justify-self-stretch">
          {showSocialPostPreview ? <LookbookSocialPostPreview title={look.title} description={look.description} products={selected} layout={look.layout} backgroundColor={look.backgroundColor} backgroundImage={look.backgroundImage} media={activeMedia} layflatStyle={activePage?.layflatStyle} gridItemCount={gridItemCount} /> : showLayflatPreview ? <LayflatPostPreview products={selected} title={look.title} description={look.description} layout={look.layout} backgroundColor={look.backgroundColor} backgroundImage={look.backgroundImage} media={activeMedia} layflatStyle={activePage?.layflatStyle} gridItemCount={gridItemCount} /> : <><GuideProductOrder products={selected} onChangeAction={updateActivePageProducts} /><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setFavesPickerOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white"><BookPlus className="h-4 w-4" />Add products</button><button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save guide"}</button></div><div className="mt-3 grid gap-3 sm:grid-cols-2">{activeMedia.map((item) => <article key={item.id} className="relative overflow-hidden rounded-2xl border border-divider/60 bg-bg"><div className="relative aspect-[4/5] bg-surface">{item.type === "video" ? <video src={item.src} controls playsInline className="h-full w-full object-cover" /> : <Image src={item.src} alt={item.name} fill sizes="220px" className="object-cover" unoptimized />}</div><div className="flex items-center justify-between gap-2 p-3"><span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-text/60">{item.type === "video" && <Film className="h-3.5 w-3.5" />}{item.name}</span><button type="button" onClick={() => updateActivePageMedia(activeMedia.filter((media) => media.id !== item.id))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-burgundy/10 text-burgundy" aria-label={`Remove ${item.name}`}><X className="h-3.5 w-3.5" /></button></div></article>)}</div></>}
          <div className="mt-4 flex flex-wrap justify-center gap-2 xl:justify-start"><button type="button" onClick={() => { setShowSocialPostPreview(true); setShowLayflatPreview(true); }} aria-pressed={showSocialPostPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${showSocialPostPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Preview social post</button><button type="button" onClick={() => { setShowSocialPostPreview(false); setShowLayflatPreview(true); }} aria-pressed={!showSocialPostPreview && showLayflatPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!showSocialPostPreview && showLayflatPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Preview design</button><button type="button" onClick={() => { setShowSocialPostPreview(false); setShowLayflatPreview(false); }} aria-pressed={!showLayflatPreview && !showSocialPostPreview} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!showLayflatPreview && !showSocialPostPreview ? "bg-text text-bg" : "border border-divider/70 text-text/60"}`}>Edit products</button></div>
          <p className="mt-3 text-center text-xs leading-relaxed text-text/45 xl:text-left">Use Make featured to choose the hero product, then move supporting products into their display order.</p>
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
      {!look && <GuideCreationFlow lists={lists} onComplete={startEditor} />}
      </main>
      {lookbook}
      </div>


      {lookbookOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 xl:hidden" onClick={() => setLookbookOpen(false)}>
          <aside className="absolute bottom-0 right-0 top-0 w-[min(88vw,390px)] overflow-y-auto bg-bg p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Your saved collection</p>
              <button type="button" onClick={() => setLookbookOpen(false)} aria-label="Close Lookbook" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text/60"><X className="h-4 w-4" /></button>
            </div>
            {lookbookContent(true)}
          </aside>
        </div>
      )}

      {favesPickerOpen && look && <ProductPickerDialog multi inListIds={activeProductIds} onClose={() => setFavesPickerOpen(false)} onSelect={addProduct} onConfirm={addProducts} />}
      {saveDialogOpen && <SaveLookDialog onClose={() => setSaveDialogOpen(false)} onCreatedAccount={() => { setSaveDialogOpen(false); if (look) { saveLook(look); showToast("Account created — look saved to your profile"); } }} />}
      {shareDialogOpen && look && <ShareLookbookDialog title={look.title} onClose={() => setShareDialogOpen(false)} onShare={publishLookbook} />}
      <ToastContainer />
    </div>
  );
}
