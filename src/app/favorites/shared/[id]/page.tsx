"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFaveLists } from "@/hooks/useFaveLists";
import { useRequireAuth } from "@/components/auth/AccountInvitationDialog";
import { useToast } from "@/components/ui/Toast";
import { sharedWithMe } from "@/data/faves";
import { getContactById } from "@/data/social";
import { getProductById } from "@/lib/data";
import { DEFAULT_TEMPLATE } from "@/data/listTemplates";

export default function SharedListDetailPage() {
  const params = useParams<{ id: string }>();
  const shared = sharedWithMe.find((item) => item.id === params.id);
  const { createListWithProducts } = useFaveLists();
  const { showToast, ToastContainer } = useToast();
  const { requireAuth, invitation } = useRequireAuth();
  const [saved, setSaved] = useState(false);

  if (!shared) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="font-headline text-2xl text-text">Shared list not found</h1>
        <p className="mt-2 text-sm text-text/50">This shared list may no longer be available.</p>
        <Button asChild className="mt-6">
          <Link href="/favorites">Back to Favorites</Link>
        </Button>
      </div>
    );
  }

  const author = getContactById(shared.authorId);
  const products = shared.productIds
    .map((id) => getProductById(id))
    .filter((product): product is NonNullable<ReturnType<typeof getProductById>> => Boolean(product));

  const handleSave = () => {
    if (saved) return;
    requireAuth("save this shared list", () => {
      createListWithProducts(shared.name, shared.productIds, DEFAULT_TEMPLATE);
      setSaved(true);
      showToast(`Saved "${shared.name}" to Favorites`);
    });
  };

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm">
        <Link href="/favorites" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Favorites
        </Link>
      </Button>

      <header className="max-w-2xl">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white ${author?.color ?? "bg-accent"}`}
          >
            {author?.initials ?? "AV"}
          </span>
          <p className="text-sm text-text/60">{author?.name ?? "A friend"} shared with you</p>
        </div>
        <h1 className="mt-4 font-headline text-3xl tracking-tight text-text">{shared.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text/50">
          <span>
            {shared.productIds.length} {shared.productIds.length === 1 ? "item" : "items"}
          </span>
          <span aria-hidden="true">·</span>
          <span>Read-only shared list</span>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saved}
          className="mt-5 gap-2"
          variant={saved ? "surface" : "default"}
        >
          <Bookmark className={saved ? "h-4 w-4 fill-current" : "h-4 w-4"} />
          {saved ? "Saved to Favorites" : "Save to Favorites"}
        </Button>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-headline text-lg tracking-tight text-text">Products</h2>
          <span className="text-sm text-text/50">
            {shared.productIds.length} {shared.productIds.length === 1 ? "item" : "items"}
          </span>
        </div>
        {products.length === 0 ? (
          <p className="rounded-xl border border-dashed border-divider/60 px-4 py-8 text-center text-sm text-text/50">
            No products are available in this shared list.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group overflow-hidden rounded-2xl border border-divider/60 bg-surface/30 transition-colors hover:border-text/20"
              >
                <div className="relative aspect-square overflow-hidden bg-surface">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-medium text-text">{product.name}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <ToastContainer />
      {invitation}
    </div>
  );
}
