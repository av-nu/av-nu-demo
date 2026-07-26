"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Heart, ImagePlus, ListFilter, LoaderCircle, MoreHorizontal, Plus, Sparkles, X } from "lucide-react";

import type { FaveList } from "@/data/faves";
import { flattenPages } from "@/data/faves";
import { getProductById } from "@/lib/data";
import { generateLook, type LookRail, type LookbookLayout } from "@/lib/lookEngine";

const promptChips = ["Summer dinner", "Wedding guest", "Vacation outfit", "Work look", "First date", "Brunch", "Minimalist", "Coastal", "Under $150"];
const formatOptions: Array<{ value: Extract<LookbookLayout, "editorial" | "grid" | "featured">; label: string; description: string }> = [
  { value: "editorial", label: "Editorial", description: "Build a layered story with type, imagery, and a point of view." },
  { value: "grid", label: "Grid", description: "Arrange a clean collection of products and media." },
  { value: "featured", label: "Featured", description: "Lead with one hero piece and supporting products." },
];

type CreationSource = "faves" | "prompt";
type FlowStep = "source" | "format" | "picker";

export type GuideCreationResult = {
  source: CreationSource;
  layout: Extract<LookbookLayout, "editorial" | "grid" | "featured">;
  prompt: string;
  recommendations: string[];
  budget?: number;
  sourceImage?: string;
  productIds: string[];
  rails: LookRail[];
};

type GuideCreationFlowProps = {
  lists: FaveList[];
  onComplete: (result: GuideCreationResult) => void;
};

function productFor(id: string) {
  return getProductById(id);
}

function productIdsForList(list?: FaveList) {
  return list ? Array.from(new Set([...list.productIds, ...flattenPages(list.pages)])) : [];
}

export function GuideCreationFlow({ lists, onComplete }: GuideCreationFlowProps) {
  const defaultList = lists.find((list) => list.name === "My Favorite Products") ?? lists[0];
  const [step, setStep] = useState<FlowStep>("source");
  const [source, setSource] = useState<CreationSource>();
  const [layout, setLayout] = useState<Extract<LookbookLayout, "editorial" | "grid" | "featured">>();
  const [activeListId, setActiveListId] = useState(defaultList?.id ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [budget, setBudget] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [sourceImage, setSourceImage] = useState<string>();
  const [promptRails, setPromptRails] = useState<LookRail[]>([]);
  const [buildingResults, setBuildingResults] = useState(false);
  const [openRailId, setOpenRailId] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeListId && defaultList?.id) setActiveListId(defaultList.id);
  }, [activeListId, defaultList?.id]);

  const activeList = lists.find((list) => list.id === activeListId);
  const listProducts = productIdsForList(activeList)
    .map(productFor)
    .filter((product): product is NonNullable<ReturnType<typeof productFor>> => Boolean(product));
  const promptProducts = Array.from(new Set(promptRails.flatMap((rail) => rail.productIds)))
    .map(productFor)
    .filter((product): product is NonNullable<ReturnType<typeof productFor>> => Boolean(product));
  const selectedProducts = selectedIds
    .map(productFor)
    .filter((product): product is NonNullable<ReturnType<typeof productFor>> => Boolean(product));
  const products = source === "faves" ? listProducts : promptProducts;
  const canContinue = selectedIds.length > 0;
  const stepNumber = step === "source" ? 1 : step === "format" ? 2 : 3;
  const openRail = promptRails.find((rail) => rail.id === openRailId);

  const chooseSource = (value: CreationSource) => {
    setSource(value);
    setPromptRails([]);
    setOpenRailId(undefined);
    setStep("format");
  };

  const chooseFormat = (value: Extract<LookbookLayout, "editorial" | "grid" | "featured">) => {
    setLayout(value);
    setStep("picker");
  };

  const toggleRecommendation = (value: string) => {
    setRecommendations((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const buildPromptResults = () => {
    if (!prompt.trim() && recommendations.length === 0 && !sourceImage) return;
    setBuildingResults(true);
    window.setTimeout(() => {
      const generated = generateLook(prompt, { budget: Number(budget) || undefined, sourceImage, recommendations });
      setPromptRails(generated.rails);
      setBuildingResults(false);
    }, 420);
  };

  const handleImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setSourceImage(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  };

  const toggleProduct = (productId: string) => {
    setSelectedIds((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
  };

  const removeSelected = (productId: string) => setSelectedIds((current) => current.filter((id) => id !== productId));

  const complete = () => {
    if (!source || !layout || !canContinue) return;
    onComplete({
      source,
      layout,
      prompt: source === "prompt" ? prompt.trim() : "",
      recommendations,
      budget: Number(budget) || undefined,
      sourceImage,
      productIds: selectedIds,
      rails: source === "prompt" ? promptRails : [],
    });
  };

  const renderStepHeader = () => (
    <div className="border-b border-divider/60 px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {step !== "source" && <button type="button" onClick={() => setStep(step === "picker" ? "format" : "source")} aria-label="Go back" className="flex h-8 w-8 items-center justify-center rounded-full border border-divider/70 text-text/60 hover:bg-surface"><ArrowLeft className="h-4 w-4" /></button>}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Create a Guide</p>
            <p className="mt-1 text-sm font-semibold text-text">{step === "source" ? "Choose your starting point" : step === "format" ? "Choose a format" : source === "faves" ? "Choose your pieces" : "Find your pieces"}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-text/50">Step {stepNumber} of 3</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-1.5" aria-label="Guide creation progress">
        {[1, 2, 3].map((item) => <span key={item} className={`h-1 rounded-full ${item <= stepNumber ? "bg-accent" : "bg-divider/70"}`} />)}
      </div>
    </div>
  );

  const renderSourceStep = () => (
    <div className="p-4 sm:p-6">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-pink/10 px-3 py-1 text-xs font-semibold text-pink"><Sparkles className="h-3.5 w-3.5" />A more considered way to create</span>
        <h1 className="mt-4 font-headline text-3xl tracking-tight text-text sm:text-5xl">Make a Guide in a few simple steps.</h1>
        <p className="mt-3 text-sm leading-relaxed text-text/60 sm:text-base">Start with pieces you already love, or describe the mood and we’ll help you find a point of view.</p>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => chooseSource("faves")} className="group rounded-2xl border border-divider/70 bg-bg p-4 text-left transition-colors hover:border-pink/50 hover:bg-pink/5 sm:p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink/10 text-pink"><Heart className="h-5 w-5" /></span>
          <span className="mt-5 block font-headline text-xl text-text">My Faves</span>
          <span className="mt-1 block text-xs leading-relaxed text-text/55">Choose from products and lists you’ve already saved.</span>
          <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-pink">Start with saved pieces <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
        </button>
        <button type="button" onClick={() => chooseSource("prompt")} className="group rounded-2xl border border-divider/70 bg-bg p-4 text-left transition-colors hover:border-accent/50 hover:bg-accent/5 sm:p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Sparkles className="h-5 w-5" /></span>
          <span className="mt-5 block font-headline text-xl text-text">Start from a Prompt</span>
          <span className="mt-1 block text-xs leading-relaxed text-text/55">Describe an occasion, feeling, or style direction to browse matching pieces.</span>
          <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-accent">Find a direction <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
        </button>
      </div>
    </div>
  );

  const renderFormatStep = () => (
    <div className="p-4 sm:p-6">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{source === "faves" ? "My Faves" : "Prompt"}</p>
        <h2 className="mt-2 font-headline text-3xl tracking-tight text-text">How do you want to shape it?</h2>
        <p className="mt-2 text-sm leading-relaxed text-text/55">You can change the format later in the editor, so choose the starting canvas that feels right.</p>
      </div>
      <div className="mt-7 grid gap-3">
        {formatOptions.map((option) => <button key={option.value} type="button" onClick={() => chooseFormat(option.value)} className={`group flex items-start gap-4 rounded-2xl border p-4 text-left transition-colors hover:border-accent/50 hover:bg-accent/5 sm:p-5 ${layout === option.value ? "border-accent bg-accent/5" : "border-divider/70 bg-bg"}`}>
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${option.value === "editorial" ? "border-pink/30 bg-pink/10" : option.value === "grid" ? "border-accent/30 bg-accent/10" : "border-burgundy/25 bg-burgundy/10"}`}><span className={`grid ${option.value === "editorial" ? "grid-cols-2" : option.value === "grid" ? "grid-cols-3" : "grid-cols-2"} gap-1`}>{Array.from({ length: option.value === "featured" ? 3 : 6 }, (_, index) => <span key={index} className={`rounded-sm ${option.value === "featured" && index === 0 ? "col-span-2 row-span-2 h-8 bg-burgundy/55" : "h-3 bg-text/20"}`} />)}</span></span>
          <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="font-headline text-xl text-text">{option.label}</span><ArrowRight className="h-4 w-4 shrink-0 text-text/35 transition-transform group-hover:translate-x-1" /></span><span className="mt-1 block text-xs leading-relaxed text-text/55">{option.description}</span></span>
        </button>)}
      </div>
    </div>
  );

  const renderSelectedRail = () => (
    <aside className="sticky top-3 flex max-h-[calc(100vh-11rem)] min-h-28 flex-col items-center rounded-2xl border border-divider/60 bg-surface/40 p-2 sm:p-2.5">
      <div className="flex w-full flex-col items-center border-b border-divider/60 pb-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent"><Check className="h-4 w-4" /></span><span className="mt-1 text-center text-[9px] font-semibold uppercase tracking-[0.1em] text-text/45">Added</span><span className="text-sm font-semibold text-text">{selectedIds.length}</span></div>
      <div className="mt-2 flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto pr-0.5">
        {selectedProducts.length === 0 ? <p className="px-1 py-4 text-center text-[9px] leading-relaxed text-text/40">Tap pieces to add them here</p> : selectedProducts.map((product) => <button key={product.id} type="button" onClick={() => removeSelected(product.id)} aria-label={`Remove ${product.name}`} className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-divider/70 bg-bg"><Image src={product.images[0]} alt="" fill sizes="48px" className="object-cover" /><span className="absolute inset-0 flex items-center justify-center bg-text/60 opacity-0 transition-opacity group-hover:opacity-100"><X className="h-3.5 w-3.5 text-bg" /></span></button>)}
      </div>
    </aside>
  );

  const renderProductCard = (product: NonNullable<ReturnType<typeof productFor>>, inMoreOptions = false) => {
    const selected = selectedIds.includes(product.id);
    return <button key={product.id} type="button" onClick={() => toggleProduct(product.id)} aria-pressed={selected} className={`group relative ${inMoreOptions ? "w-full" : "w-[132px] shrink-0 sm:w-[156px]"} overflow-hidden rounded-2xl border bg-bg text-left transition-all ${selected ? "border-accent ring-2 ring-accent/20" : "border-divider/70 hover:border-accent/40"}`}>
      <div className={`relative overflow-hidden bg-surface ${inMoreOptions ? "h-52 sm:h-64" : "aspect-[4/5]"}`}><Image src={product.images[0]} alt={product.name} fill sizes={inMoreOptions ? "(max-width: 640px) 42vw, 280px" : "156px"} className="object-cover transition-transform duration-300 group-hover:scale-105" /><span className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full shadow-sm ${selected ? "bg-accent text-white" : "bg-bg/90 text-text/45"}`}>{selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" />}</span></div>
      <span className="block truncate px-3 pt-3 text-xs font-semibold text-text">{product.name}</span><span className="block px-3 pb-3 pt-1 text-xs text-text/55">${product.price}</span>
    </button>;
  };

  const renderFavesPicker = () => (
    <div className="space-y-5">
      <div><p className="text-xs leading-relaxed text-text/55">Pick a list to browse. Your added pieces stay with you if you switch lists.</p><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{lists.map((list) => <button key={list.id} type="button" onClick={() => setActiveListId(list.id)} aria-pressed={activeListId === list.id} className={`flex min-w-36 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left ${activeListId === list.id ? "border-pink bg-pink/10 text-pink" : "border-divider/70 bg-bg text-text/60 hover:border-pink/40"}`}><ListFilter className="h-3.5 w-3.5 shrink-0" /><span className="min-w-0"><span className="block truncate text-xs font-semibold">{list.name}</span><span className="block text-[10px] opacity-60">{productIdsForList(list).length} pieces</span></span></button>)}</div></div>
      {activeList && <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text/40">Browsing {activeList.name}</p>}
      {products.length > 0 ? <div className="flex gap-3 overflow-x-auto pb-3 snap-x">{products.map((product) => renderProductCard(product))}</div> : <div className="rounded-2xl border border-dashed border-divider/70 px-4 py-12 text-center"><Heart className="mx-auto h-7 w-7 text-pink/40" /><p className="mt-3 text-sm font-semibold text-text/65">This list is empty</p><p className="mt-1 text-xs text-text/45">Choose another list above, or save products to this list first.</p></div>}
    </div>
  );

  const renderPromptPicker = () => (
    <div className="space-y-5">
      <div className="rounded-2xl border border-accent/25 bg-accent/5 p-3 sm:p-4">
        <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Sparkles className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-text">Describe the collection you want to browse</p><p className="mt-1 text-xs leading-relaxed text-text/55">We’ll organize matching products into scrollable style and outfit categories.</p></div></div>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} placeholder="Try: a polished summer dinner look, under $150" className="mt-4 w-full resize-none rounded-xl border border-divider/60 bg-bg px-3 py-3 text-sm text-text placeholder:text-text/35 focus:border-accent/50 focus:outline-none" />
        <div className="mt-3 flex items-center gap-2"><label className="text-xs font-medium text-text/50">Budget</label><input value={budget} onChange={(event) => setBudget(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Any" className="h-8 w-20 rounded-lg border border-divider/60 bg-bg px-2 text-xs text-text focus:border-accent/50 focus:outline-none" /><button type="button" onClick={() => fileInput.current?.click()} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-divider/70 px-2.5 py-1.5 text-[10px] font-semibold text-text/60 hover:bg-bg"><ImagePlus className="h-3.5 w-3.5" />Inspiration</button><input ref={fileInput} type="file" accept="image/*" onChange={(event) => handleImage(event.target.files?.[0])} className="sr-only" /></div>
        {sourceImage && <div className="mt-3 flex items-center gap-2 rounded-lg bg-bg px-2 py-1.5 text-[10px] font-semibold text-text/60"><Image src={sourceImage} alt="" width={28} height={28} className="h-7 w-7 rounded object-cover" unoptimized /><span className="min-w-0 flex-1 truncate">Inspiration image added</span><button type="button" onClick={() => setSourceImage(undefined)} aria-label="Remove inspiration image"><X className="h-3.5 w-3.5" /></button></div>}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{promptChips.map((chip) => <button key={chip} type="button" onClick={() => toggleRecommendation(chip)} aria-pressed={recommendations.includes(chip)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${recommendations.includes(chip) ? "border-accent bg-accent text-white" : "border-divider/60 bg-bg text-text/60 hover:border-accent/40"}`}>{chip}</button>)}</div>
        <button type="button" onClick={buildPromptResults} disabled={buildingResults || (!prompt.trim() && recommendations.length === 0 && !sourceImage)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{buildingResults ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}{buildingResults ? "Finding pieces..." : promptRails.length > 0 ? "Refresh product results" : "Show product results"}</button>
      </div>
      {promptRails.length === 0 ? <div className="rounded-2xl border border-dashed border-divider/70 px-4 py-10 text-center text-xs leading-relaxed text-text/45">Your product categories will appear here after you build the prompt.</div> : <div className="space-y-6">{promptRails.map((rail) => { const visibleIds = rail.productIds.slice(0, 10); return <section key={rail.id}><div className="mb-2 flex items-center justify-between gap-3"><div><h3 className="font-headline text-xl tracking-tight text-text">{rail.displayTitle ?? rail.title}</h3><p className="text-[10px] text-text/40">Showing the first {Math.min(10, rail.productIds.length)} pieces</p></div><div className="flex shrink-0 items-center gap-2"><span className="text-[10px] font-semibold text-text/35">{rail.productIds.length} pieces</span>{rail.productIds.length > 10 && <button type="button" onClick={() => setOpenRailId(rail.id)} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-bg px-2.5 py-1.5 text-[10px] font-semibold text-accent hover:bg-accent/5">More options <MoreHorizontal className="h-3.5 w-3.5" /></button>}</div></div><div className="flex snap-x gap-3 overflow-x-auto pb-2" aria-label={`${rail.displayTitle ?? rail.title} product results`}>{visibleIds.map((id) => { const product = productFor(id); return product ? renderProductCard(product) : null; })}</div></section>; })}</div>}
    </div>
  );

  const renderMoreOptionsModal = () => {
    if (!openRail) return null;
    return <div className="fixed inset-0 z-50 flex items-end justify-center bg-text/45 p-0 sm:items-center sm:p-6" onClick={() => setOpenRailId(undefined)}>
      <section role="dialog" aria-modal="true" aria-labelledby="more-options-title" onClick={(event) => event.stopPropagation()} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-bg shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-divider/60 px-4 py-4 sm:px-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">More options</p><h2 id="more-options-title" className="mt-1 font-headline text-2xl tracking-tight text-text">{openRail.displayTitle ?? openRail.title}</h2><p className="mt-1 text-xs text-text/50">Browse all {openRail.productIds.length} pieces. Your selections stay added when you close this panel.</p></div><button type="button" onClick={() => setOpenRailId(undefined)} aria-label="Close more options" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-divider/70 text-text/60 hover:bg-surface"><X className="h-4 w-4" /></button></div>
        <div className="grid min-h-0 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 sm:gap-4 sm:p-6">{openRail.productIds.map((id) => { const product = productFor(id); return product ? renderProductCard(product, true) : null; })}</div>
        <div className="border-t border-divider/60 bg-surface/40 px-4 py-3 text-right sm:px-6"><button type="button" onClick={() => setOpenRailId(undefined)} className="rounded-xl bg-burgundy px-4 py-2.5 text-sm font-semibold text-white">Done</button></div>
      </section>
    </div>;
  };

  const renderPickerStep = () => (
    <div className="p-3 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text/40">{formatOptions.find((option) => option.value === layout)?.label} format</p><h2 className="mt-1 font-headline text-2xl tracking-tight text-text">{source === "faves" ? "Choose the pieces for your story" : "Browse by style, then add what fits"}</h2></div><span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">{selectedIds.length} selected</span></div>
      <div className="grid grid-cols-[60px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-5"><div>{renderSelectedRail()}</div><div className="min-w-0">{source === "faves" ? renderFavesPicker() : renderPromptPicker()}</div></div>
      <div className="sticky bottom-0 z-10 -mx-3 mt-5 flex items-center justify-between gap-3 border-t border-divider/60 bg-bg/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6"><button type="button" onClick={() => setStep("format")} className="text-xs font-semibold text-text/55 hover:text-text">Back to format</button><button type="button" onClick={complete} disabled={!canContinue} className="inline-flex items-center gap-2 rounded-xl bg-burgundy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Continue to editor <ArrowRight className="h-4 w-4" /></button></div>
    </div>
  );

  return <><section className="overflow-hidden rounded-3xl border border-divider/60 bg-surface/30 shadow-sm"><div>{renderStepHeader()}</div>{step === "source" ? renderSourceStep() : step === "format" ? renderFormatStep() : renderPickerStep()}</section>{renderMoreOptionsModal()}</>;
}
