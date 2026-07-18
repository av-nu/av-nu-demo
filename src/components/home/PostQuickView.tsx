"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Check, ChevronLeft, ChevronRight, Film, Heart, MessageCircle, Send, ShoppingBag, UserPlus, X } from "lucide-react";

import { SavePostDialog } from "@/components/social/SavePostDialog";
import { SharePostDialog } from "@/components/social/SharePostDialog";
import { Portal } from "@/components/ui/Portal";
import { useSavedPostGroups } from "@/hooks/useSavedPostGroups";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { getBrandById } from "@/lib/data";
import { getProductById } from "@/lib/data";
import type { CommunityList } from "@/data/faves";
import type { Contact } from "@/data/social";
import type { SpotlightRow } from "@/data/spotlight";

export type DiscoverPost =
  | { kind: "video"; id: string; data: SpotlightRow; author: Contact }
  | { kind: "list"; id: string; data: CommunityList; author: Contact | undefined };

export function PostQuickView({ post, onClose }: { post: DiscoverPost; onClose: () => void }) {
  const [liked, setLiked] = useState(false);
  const [page, setPage] = useState(0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>(() => post.kind === "list" ? post.data.comments.map((item) => item.text) : []);
  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { getRelationship, follow, unfollow } = useSocialGraph();
  const { groups } = useSavedPostGroups();
  const author = post.author;
  const products = post.kind === "video"
    ? [post.data.featured, ...post.data.products]
    : post.data.pages.flatMap((currentPage) => currentPage.productIds.map(getProductById).filter((product): product is NonNullable<ReturnType<typeof getProductById>> => Boolean(product)));
  const pages = post.kind === "list" ? post.data.pages : [];
  const currentPage = pages[page];
  const relationship = author ? getRelationship(author.id) : undefined;
  const isSaved = groups.some((group) => group.postIds.includes(post.id));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const addComment = () => {
    if (!comment.trim()) return;
    setComments((current) => [...current, comment.trim()]);
    setComment("");
  };

  const caption = post.kind === "video"
    ? `A closer look at ${post.data.featured.name}, how it moves, and the pieces I would style with it.`
    : post.data.caption;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
        >
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-2xl sm:max-w-5xl sm:flex-row sm:rounded-3xl"
          >
            <div className="relative flex min-h-0 items-center justify-center bg-text sm:w-[56%]">
              {post.kind === "video" ? (
                <video src={post.data.videoUrl} controls autoPlay playsInline className="max-h-[58vh] w-full object-contain sm:max-h-[94vh]" />
              ) : currentPage ? (
                <div className="relative w-full max-w-2xl bg-surface p-3 sm:p-8">
                  <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
                    {currentPage.editorial ? (
                      <div className="p-4 text-center text-sm text-text/60">Editorial Guide preview</div>
                    ) : (
                      <div className="grid grid-cols-2">
                        {currentPage.productIds.slice(0, 4).map((productId) => {
                          const product = getProductById(productId);
                          return product ? <Image key={product.id} src={product.images[0]} alt={product.name} width={320} height={320} className="aspect-square object-cover" /> : null;
                        })}
                      </div>
                    )}
                  </div>
                  {pages.length > 1 && (
                    <div className="absolute inset-x-5 top-1/2 flex -translate-y-1/2 justify-between">
                      <button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-bg/90 text-text shadow disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="h-5 w-5" /></button>
                      <button type="button" disabled={page === pages.length - 1} onClick={() => setPage((current) => Math.min(pages.length - 1, current + 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-bg/90 text-text shadow disabled:opacity-30" aria-label="Next page"><ChevronRight className="h-5 w-5" /></button>
                    </div>
                  )}
                </div>
              ) : null}
              <button type="button" onClick={onClose} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white sm:hidden" aria-label="Close post"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="flex items-center gap-3 border-b border-divider/60 px-5 py-4">
                <Link href={author ? `/u/${author.id}` : "#"} className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-white ${author?.color ?? "bg-accent"}`}>
                  {author?.initials ?? "AV"}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={author ? `/u/${author.id}` : "#"} className="block truncate text-sm font-semibold text-text hover:underline">{author?.name ?? "av | nu creator"}</Link>
                  <p className="truncate text-xs text-text/50">@{author?.handle ?? "creator"}</p>
                </div>
                {author && (
                  <button type="button" onClick={() => relationship?.iFollow ? unfollow(author.id) : follow(author.id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-divider px-3 py-1.5 text-xs font-semibold text-text/70 transition-colors hover:bg-surface">
                    {relationship?.iFollow ? <><Check className="h-3.5 w-3.5" />Following</> : <><UserPlus className="h-3.5 w-3.5" />Follow</>}
                  </button>
                )}
                <button type="button" onClick={onClose} className="hidden h-9 w-9 items-center justify-center rounded-full text-text/50 hover:bg-surface hover:text-text sm:flex" aria-label="Close post"><X className="h-5 w-5" /></button>
              </div>

              <div className="flex-1 space-y-5 px-5 py-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${post.kind === "video" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>{post.kind === "video" ? "Moment" : "List"}</span>
                    {post.kind === "video" && <Film className="h-4 w-4 text-text/40" />}
                  </div>
                  <h2 className="mt-3 font-headline text-2xl leading-tight text-text">{post.kind === "video" ? post.data.featured.name : post.data.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-text/65">{caption}</p>
                  {author?.bio && <p className="mt-3 rounded-xl bg-surface/60 p-3 text-xs leading-relaxed text-text/60">{author.bio}</p>}
                </div>

                <div className="flex items-center gap-4 border-y border-divider/60 py-3">
                  <button type="button" onClick={() => setLiked((current) => !current)} className={`inline-flex items-center gap-1.5 text-sm font-semibold ${liked ? "text-pink" : "text-text/60"}`}><Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />{liked ? "Liked" : "Like"}</button>
                  <button type="button" onClick={() => setSaveOpen(true)} className={`inline-flex items-center gap-1.5 text-sm font-semibold ${isSaved ? "text-accent" : "text-text/60"}`}><Bookmark className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />{isSaved ? "Saved" : "Save"}</button>
                  <button type="button" onClick={() => setShareOpen(true)} className="ml-auto text-text/50 hover:text-text" aria-label="Share post"><Send className="h-5 w-5" /></button>
                </div>

                <section>
                  <h3 className="flex items-center gap-2 font-headline text-lg text-text"><ShoppingBag className="h-4 w-4 text-burgundy" />Shop this post</h3>
                  <div className="mt-3 space-y-2">
                    {products.slice(0, 5).map((product) => {
                      const brand = getBrandById(product.brandId);
                      return <Link key={product.id} href={`/product/${product.id}`} className="flex items-center gap-3 rounded-xl border border-divider/60 p-2 transition-colors hover:bg-surface"><Image src={product.images[0]} alt={product.name} width={52} height={52} className="h-13 w-13 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text">{product.name}</span><span className="block text-xs text-text/50">{brand?.name} · ${product.price}</span></span><ShoppingBag className="h-4 w-4 shrink-0 text-burgundy/60" /></Link>;
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="flex items-center gap-2 font-headline text-lg text-text"><MessageCircle className="h-4 w-4 text-burgundy" />Comments</h3>
                  <div className="mt-3 space-y-3">
                    {comments.map((item, index) => <p key={`${item}-${index}`} className="rounded-xl bg-surface/60 px-3 py-2 text-sm text-text/70">{item}</p>)}
                    {comments.length === 0 && <p className="text-sm text-text/45">Be the first to share a thought.</p>}
                  </div>
                  <form onSubmit={(event) => { event.preventDefault(); addComment(); }} className="mt-3 flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment…" className="h-10 min-w-0 flex-1 rounded-full border border-divider bg-surface/40 px-4 text-sm focus:border-accent/50 focus:outline-none" /><button type="submit" disabled={!comment.trim()} className="rounded-full bg-text px-4 text-xs font-semibold text-bg disabled:opacity-40">Post</button></form>
                </section>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      {saveOpen && <SavePostDialog postId={post.id} onClose={() => setSaveOpen(false)} />}
      {shareOpen && <SharePostDialog postTitle={post.kind === "video" ? post.data.featured.name : post.data.name} onClose={() => setShareOpen(false)} />}
    </Portal>
  );
}
