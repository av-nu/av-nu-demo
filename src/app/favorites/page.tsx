"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Plus, Search, Shirt, Gift, Layers } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { FaveListCard } from "@/components/faves/FaveListCard";
import { CreateListDialog } from "@/components/faves/CreateListDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { useFaveLists } from "@/hooks/useFaveLists";
import { useToast } from "@/components/ui/Toast";
import { getProductById } from "@/lib/data";
import type { FaveList, FaveListType } from "@/data/faves";

const RECENT_LIMIT = 5;

const CREATE_OPTIONS: {
  type: FaveListType;
  label: string;
  icon: typeof Shirt;
  iconClass: string;
}[] = [
  { type: "Looks", label: "Create Look", icon: Shirt, iconClass: "text-pink" },
  { type: "Gift List", label: "Create Gift List", icon: Gift, iconClass: "text-accent" },
  { type: "Sets", label: "Create Set", icon: Layers, iconClass: "text-burgundy" },
];

function CreateTypeButtons({ onPick }: { onPick: (type: FaveListType) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {CREATE_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => onPick(opt.type)}
            className="group flex items-center gap-3 rounded-2xl border border-divider/60 bg-surface/30 p-4 text-left transition-colors hover:border-accent/50 hover:bg-surface/60"
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg shadow-sm",
                opt.iconClass,
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-sm font-semibold text-text">
                <Plus className="h-3.5 w-3.5 text-text/40 transition-colors group-hover:text-accent" />
                {opt.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 -z-10 scale-150">
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-2xl" />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink/10 blur-xl" />
        </div>
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-divider/30" />
          <div className="absolute inset-2 rounded-full border border-divider/20" />
          <div className="absolute inset-4 rounded-full border border-divider/10" />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
            <Heart className="h-7 w-7 text-text/30" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <h2 className="font-headline text-2xl tracking-tight text-text">Start your Faves</h2>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-text/50">
        Tap the heart on anything you love to save it here and organize it into Looks, Gift Lists, and Sets.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">Explore products</Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/brands">Browse brands</Link>
        </Button>
      </div>
    </motion.div>
  );
}

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { lists, isHydrated } = useFaveLists();
  const { showToast, ToastContainer } = useToast();

  const [query, setQuery] = useState("");
  const [showAllLists, setShowAllLists] = useState(false);
  const [createType, setCreateType] = useState<FaveListType | null>(null);

  const q = query.trim().toLowerCase();

  // Filter lists by name OR by a product name within the list.
  const filteredLists = useMemo(() => {
    if (!q) return lists;
    return lists.filter((list: FaveList) => {
      if (list.name.toLowerCase().includes(q)) return true;
      if (list.type.toLowerCase().includes(q)) return true;
      return list.productIds.some((id) =>
        getProductById(id)?.name.toLowerCase().includes(q),
      );
    });
  }, [lists, q]);

  const savedProducts = useMemo(() => {
    const products = favorites
      .map((id) => getProductById(id))
      .filter(Boolean) as NonNullable<ReturnType<typeof getProductById>>[];
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [favorites, q]);

  const visibleLists = showAllLists
    ? filteredLists
    : filteredLists.slice(0, RECENT_LIMIT);

  const hasAnything = lists.length > 0 || favorites.length > 0;

  if (isHydrated && !hasAnything) {
    return (
      <div className="space-y-8">
        <Header />
        <CreateTypeButtons onPick={setCreateType} />
        <hr className="border-divider/60" />
        <EmptyState />
        {createType && (
          <CreateListDialog
            initialType={createType}
            onClose={() => setCreateType(null)}
            onCreated={() => showToast("List created")}
          />
        )}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header />

      {/* Create a typed list */}
      <CreateTypeButtons onPick={setCreateType} />

      <hr className="border-divider/60" />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lists and saved items..."
          className="h-11 w-full rounded-xl border border-divider/60 bg-surface/50 pl-10 pr-4 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Lists */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-lg tracking-tight text-text">
            Your lists{filteredLists.length > 0 && (
              <span className="ml-2 text-sm font-normal text-text/40">{filteredLists.length}</span>
            )}
          </h2>
          {filteredLists.length > RECENT_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAllLists((v) => !v)}
              className="text-sm font-medium text-accent hover:underline"
            >
              {showAllLists ? "Show less" : `Show all (${filteredLists.length})`}
            </button>
          )}
        </div>

        {filteredLists.length === 0 ? (
          <p className="rounded-xl border border-dashed border-divider/60 px-4 py-8 text-center text-sm text-text/50">
            {q ? "No lists match your search." : "No lists yet — create one to organize your faves."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleLists.map((list) => (
              <FaveListCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </section>

      {/* Saved items (umbrella) */}
      <section>
        <h2 className="mb-4 font-headline text-lg tracking-tight text-text">
          Saved items
          <span className="ml-2 text-sm font-normal text-text/40">{savedProducts.length}</span>
        </h2>

        {savedProducts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-divider/60 px-4 py-8 text-center text-sm text-text/50">
            {q ? "No saved items match your search." : "Tap the heart on a product to save it here."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {savedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 8}
                onShare={showToast}
              />
            ))}
          </div>
        )}
      </section>

      {createType && (
        <CreateListDialog
          initialType={createType}
          onClose={() => setCreateType(null)}
          onCreated={() => showToast("List created")}
        />
      )}
      <ToastContainer />
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="font-headline text-3xl tracking-tight text-text">My Faves</h1>
      <p className="mt-1 text-sm text-text/50">Your saved items and curated lists</p>
    </div>
  );
}
