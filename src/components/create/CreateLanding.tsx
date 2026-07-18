import Image from "next/image";
import Link from "next/link";
import { BookOpen, Camera, ListChecks, Plus, Sparkles } from "lucide-react";

import { communityLists, flattenPages } from "@/data/faves";
import { getProductById } from "@/lib/data";

const creationCards = [
  {
    href: "/create/moment",
    title: "Moment",
    description: "Share how you use a product, a review, or a moment worth remembering.",
    icon: Camera,
    className: "bg-[#edf5eb]",
  },
  {
    href: "/create/guide",
    title: "Guide",
    description: "Build a shoppable story with a point of view and the pieces people need.",
    icon: BookOpen,
    className: "bg-[#f4e9fa]",
  },
  {
    href: "/create/list",
    title: "List",
    description: "Create a private list or share a thoughtful collection with a friend.",
    icon: ListChecks,
    className: "bg-[#fff7df]",
  },
];

export function CreateLanding() {
  const inspiration = communityLists.slice(0, 8).map((list) => {
    const productId = flattenPages(list.pages)[0];
    return { list, image: productId ? getProductById(productId)?.images[0] : undefined };
  });

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <header className="mx-auto max-w-2xl py-8 text-center sm:py-12">
        <span className="inline-flex items-center gap-2 rounded-full bg-pink/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-burgundy">
          <Sparkles className="h-3.5 w-3.5" /> Your point of view
        </span>
        <h1 className="mt-4 font-headline text-4xl tracking-tight text-text sm:text-5xl">Let&apos;s get creative</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-text/60 sm:text-base">
          Share your favorite finds with the community through a moment, a guide, or a list.
        </p>
      </header>

      <section aria-labelledby="creation-options" className="grid gap-4 md:grid-cols-3">
        <h2 id="creation-options" className="sr-only">Choose what to create</h2>
        {creationCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group flex min-h-64 flex-col items-center justify-between rounded-[2rem] border border-divider/70 p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${card.className}`}
            >
              <Icon className="h-12 w-12 text-text/25" strokeWidth={1.2} />
              <span>
                <span className="block font-headline text-3xl tracking-tight text-text">{card.title}</span>
                <span className="mt-2 block text-sm leading-relaxed text-text/65">{card.description}</span>
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-text/25 text-text/60 transition-colors group-hover:border-burgundy group-hover:text-burgundy">
                <Plus className="h-6 w-6" />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="mt-14" aria-labelledby="community-creations">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="community-creations" className="font-headline text-2xl tracking-tight text-text">See what others are creating</h2>
            <p className="mt-1 text-sm text-text/50">Ideas, guides, and lists from people in the community.</p>
          </div>
          <Link href="/" className="shrink-0 text-sm font-semibold text-burgundy hover:underline">Explore Discover</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {inspiration.map(({ list, image }) => (
            <Link key={list.id} href={`/post/list/${list.id}`} className="group overflow-hidden rounded-2xl border border-divider/60 bg-white transition-shadow hover:shadow-md">
              <div className="relative aspect-[1.35] bg-surface">
                {image && <Image src={image} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 font-headline text-sm leading-tight text-text">{list.name}</p>
                <p className="mt-1 text-[11px] text-text/50">{list.likes.toLocaleString()} likes</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
