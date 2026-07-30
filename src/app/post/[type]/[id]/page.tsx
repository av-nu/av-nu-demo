"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, MessageCircle, Send, ShoppingBag } from "lucide-react";

import { FeaturedGuideArtwork } from "@/components/home/FeaturedGuideArtwork";
import { FaveButton } from "@/components/faves/FaveButton";
import { ListTileGrid } from "@/components/faves/ListTileGrid";
import { useToast } from "@/components/ui/Toast";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { buildSpotlightRows } from "@/data/spotlight";
import { communityLists, flattenPages } from "@/data/faves";
import { contacts, getContactById } from "@/data/social";
import { getBrandById, getProductById } from "@/lib/data";
import { getVideoPoster } from "@/lib/utils";

const interestsByAuthor: Record<string, string[]> = {
  "c-mara": ["Slow living", "Ceramics", "Handmade"],
  "c-priya": ["Interiors", "Gifting", "Color"],
  "f-aria": ["Fashion", "Layering", "Cozy"],
  "c-jonah": ["Coffee", "Denim", "Design"],
  "c-sof": ["Travel", "Packing", "Totes"],
};

export default function SocialPostPage({ params }: { params: { type: string; id: string } }) {
  const { showToast, ToastContainer } = useToast();
  const { getRelationship, follow, unfollow } = useSocialGraph();
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [localComments, setLocalComments] = useState<string[]>([]);
  const videos = useMemo(() => buildSpotlightRows(16), []);
  const videoIndex = videos.findIndex((row) => row.id === params.id);
  const video = params.type === "video" ? videos[videoIndex] : undefined;
  const list = params.type === "list" ? communityLists.find((item) => item.id === params.id) : undefined;
  const author = video ? contacts[Math.max(0, videoIndex) % contacts.length] : list ? getContactById(list.authorId) : undefined;
  const products = video ? [video.featured, ...video.products] : list ? flattenPages(list.pages).map(getProductById).filter((product): product is NonNullable<typeof product> => Boolean(product)) : [];
  const interests = interestsByAuthor[author?.id ?? ""] ?? ["Independent brands", "Thoughtful finds", "Good design"];
  const followingAuthor = author ? getRelationship(author.id).iFollow : false;
  const caption = list?.caption ?? (video ? `${video.title} — a closer look at the scene, and the pieces I'd style it with.` : "");
  const seededComments = list?.comments.map((item) => ({ name: item.authorName, text: item.text })) ?? [{ name: "Mara Ellis", text: "Love how you styled this." }, { name: "Priya Nair", text: "Adding this to my list immediately." }];

  if (!video && !list) return <div className="py-20 text-center"><h1 className="font-headline text-3xl">Post not found</h1><Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent"><ArrowLeft className="h-4 w-4" />Back to Discover</Link></div>;

  const submitComment = () => {
    if (!comment.trim()) return;
    setLocalComments((value) => [...value, comment.trim()]);
    setComment("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 py-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-text/55 hover:text-text"><ArrowLeft className="h-4 w-4" />Back to Discover</Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="overflow-hidden rounded-3xl bg-text">
          {video ? <video src={video.videoUrl} poster={getVideoPoster(video.videoUrl)} preload="metadata" controls autoPlay playsInline className="max-h-[82vh] min-h-[520px] w-full bg-black object-contain" /> : list?.format === "featured" ? <div className="flex min-h-[520px] items-center justify-center bg-pink/10 p-4 sm:p-8"><FeaturedGuideArtwork guide={list} productIds={products.map((product) => product.id)} author={author} className="w-full max-w-lg" /></div> : list ? <div className="bg-pink/10 p-4 sm:p-8"><div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"><ListTileGrid productIds={list.pages[0].productIds} template={list.pages[0].template} /></div></div> : null}
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-divider/60 bg-bg p-5">
            <div className="flex items-center gap-3"><Link href={author ? `/u/${author.id}` : "#"} className={`flex h-12 w-12 items-center justify-center rounded-full text-xs font-semibold text-white ${author?.color ?? "bg-accent"}`}>{author?.initials ?? "AV"}</Link><div className="min-w-0 flex-1"><Link href={author ? `/u/${author.id}` : "#"} className="font-semibold text-text">{author?.name ?? "av | nu creator"}</Link><p className="text-xs text-text/45">@{author?.handle ?? "creator"}</p></div><button type="button" onClick={() => author && (followingAuthor ? unfollow(author.id) : follow(author.id))} className={`rounded-full border px-4 py-2 text-xs font-semibold ${followingAuthor ? "border-text bg-text text-bg" : "border-divider"}`}>{followingAuthor ? "Following" : "Follow"}</button></div>
            <p className="mt-4 text-sm leading-relaxed text-text/65">{author?.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2">{interests.map((interest) => <span key={interest} className="rounded-full bg-pink/10 px-3 py-1.5 text-[10px] font-semibold text-burgundy">{interest}</span>)}</div>
          </section>

          <section className="space-y-4 px-1"><h1 className="font-headline text-3xl leading-tight text-text">{list?.name ?? video?.title}</h1><p className="text-sm leading-relaxed text-text/65">{caption}</p><div className="flex items-center gap-8 border-y border-divider/60 py-4"><button type="button" onClick={() => setLiked((value) => !value)} className={`flex items-center gap-3 text-sm font-semibold ${liked ? "text-pink" : "text-text/60"}`}><Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />{(list?.likes ?? 184) + Number(liked)}</button><span className="flex items-center gap-2 text-sm text-text/60"><MessageCircle className="h-5 w-5" />{seededComments.length + localComments.length}</span><button type="button" onClick={async () => { await navigator.clipboard.writeText(window.location.href); showToast("Post link copied"); }} className="ml-auto text-text/60"><Send className="h-5 w-5" /></button></div></section>

          <section><h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-text/45"><ShoppingBag className="h-4 w-4" />Featured products</h2><div className="space-y-2">{products.slice(0, 6).map((product) => { const brand = getBrandById(product.brandId); return <article key={product.id} className="flex items-center gap-3 rounded-2xl border border-divider/55 bg-bg p-2"><Link href={`/product/${product.id}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface"><Image src={product.images[0]} alt={product.name} fill sizes="80px" className="object-cover" /></Link><div className="min-w-0 flex-1"><div className="flex items-center gap-2">{brand && <span className="relative h-5 w-5 overflow-hidden rounded bg-surface"><Image src={brand.logoMark} alt="" fill sizes="20px" className="object-contain" /></span>}<span className="truncate text-[10px] uppercase tracking-wide text-text/40">{brand?.name}</span></div><Link href={`/product/${product.id}`} className="mt-1 block truncate text-sm font-semibold">{product.name}</Link><span className="text-xs text-text/55">${product.price}</span></div><FaveButton product={product} onToast={showToast} /></article>; })}</div></section>
        </aside>
      </div>

      <section className="mx-auto max-w-3xl rounded-3xl border border-divider/60 bg-bg p-5 sm:p-7"><h2 className="font-headline text-2xl">Comments</h2><div className="mt-5 space-y-5">{seededComments.map((item, index) => <div key={`${item.name}-${index}`} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-[10px] font-semibold">{item.name.split(" ").map((part) => part[0]).join("")}</span><div><p className="text-xs font-semibold">{item.name}</p><p className="mt-1 text-sm text-text/65">{item.text}</p></div></div>)}{localComments.map((text, index) => <div key={`${text}-${index}`} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-semibold text-white">Y</span><div><p className="text-xs font-semibold">You</p><p className="mt-1 text-sm text-text/65">{text}</p></div></div>)}</div><form onSubmit={(event) => { event.preventDefault(); submitComment(); }} className="mt-6 flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment…" className="h-11 flex-1 rounded-full border border-divider bg-surface/40 px-4 text-sm focus:border-accent/50 focus:outline-none" /><button type="submit" disabled={!comment.trim()} className="rounded-full bg-text px-5 text-xs font-semibold text-white disabled:opacity-40">Post</button></form></section>
      <ToastContainer />
    </div>
  );
}
