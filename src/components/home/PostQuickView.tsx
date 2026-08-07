"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Film, MessageCircle, ShoppingBag, UserPlus, X } from "lucide-react";

import { FeaturedGuideArtwork } from "@/components/home/FeaturedGuideArtwork";
import { Avatar } from "@/components/social/Avatar";
import { SocialPostActions } from "@/components/social/SocialPostActions";
import { SavePostDialog } from "@/components/social/SavePostDialog";
import { SharePostDialog } from "@/components/social/SharePostDialog";
import { Portal } from "@/components/ui/Portal";
import { useSavedPostGroups } from "@/hooks/useSavedPostGroups";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { getBrandById } from "@/lib/data";
import { getProductById } from "@/lib/data";
import { getVideoPoster } from "@/lib/utils";
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
    ? `${post.data.title} — a closer look at the scene, and the pieces I'd style it with.`
    : post.data.caption;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm lg:items-center lg:p-5"
        >
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-y-auto overscroll-contain rounded-none bg-bg shadow-2xl lg:h-[760px] lg:max-h-[94vh] lg:max-w-5xl lg:flex-row lg:overflow-hidden lg:rounded-3xl"
          >
            <button type="button" onClick={onClose} aria-label="Close post" className="absolute right-3 top-3 z-[80] flex h-10 w-10 items-center justify-center rounded-full border border-divider/70 bg-bg/95 text-midnight/70 shadow-sm backdrop-blur hover:bg-surface hover:text-midnight"><X className="h-5 w-5" /></button>
            <div className="sticky top-0 z-40 flex shrink-0 items-center border-b border-divider/60 bg-bg/95 px-5 py-3 backdrop-blur-md lg:hidden">
              <span className="text-sm font-semibold text-text">Post</span>
            </div>
            <div className="relative flex h-[52dvh] min-h-[320px] max-h-[520px] w-full shrink-0 items-center justify-center overflow-hidden bg-text lg:h-full lg:max-h-none lg:min-h-0 lg:w-[56%] lg:shrink">
              {post.kind === "video" ? (
                <video src={post.data.videoUrl} poster={getVideoPoster(post.data.videoUrl)} preload="metadata" controls autoPlay playsInline className="h-full w-full object-contain" />
              ) : post.data.format === "featured" ? (
                <div className="flex h-full w-full items-center justify-center bg-surface lg:px-8">
                  <FeaturedGuideArtwork guide={post.data} productIds={products.map((product) => product.id)} author={author} className="h-full w-auto max-w-full" />
                </div>
              ) : currentPage ? (
                <div className="relative flex h-full w-full items-center justify-center bg-surface lg:p-8">
                  {currentPage.editorial ? (
                    <div className="flex h-full max-w-full aspect-square items-center justify-center bg-white p-4 text-center text-sm text-text/60 shadow-lg lg:rounded-2xl">Editorial Guide preview</div>
                  ) : (
                    <div className="grid h-full max-w-full aspect-square grid-cols-2 overflow-hidden bg-white shadow-lg lg:rounded-2xl">
                      {currentPage.productIds.slice(0, 4).map((productId) => {
                        const product = getProductById(productId);
                        return product ? <div key={product.id} className="relative min-h-0 min-w-0"><Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 640px) 45vw, 28vw" className="object-cover" /></div> : null;
                      })}
                    </div>
                  )}
                  {pages.length > 1 && (
                    <div className="absolute inset-x-5 top-1/2 flex -translate-y-1/2 justify-between">
                      <button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-bg/90 text-text shadow disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="h-5 w-5" /></button>
                      <button type="button" disabled={page === pages.length - 1} onClick={() => setPage((current) => Math.min(pages.length - 1, current + 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-bg/90 text-text shadow disabled:opacity-30" aria-label="Next page"><ChevronRight className="h-5 w-5" /></button>
                    </div>
                  )}
                </div>
              ) : null}
              <SocialPostActions className="absolute inset-x-0 bottom-0 z-10 lg:hidden" overlay liked={liked} saved={isSaved} onLike={() => setLiked((current) => !current)} onComment={() => document.getElementById("post-quick-view-comment")?.focus()} onSave={() => setSaveOpen(true)} onShare={() => setShareOpen(true)} />
            </div>

            <div className="flex shrink-0 flex-col overflow-visible lg:min-h-0 lg:flex-1 lg:shrink lg:overflow-hidden">
              <div className="flex items-center gap-3 border-b border-divider/60 px-5 py-4">
                {author ? <Link href={`/u/${author.id}`} className="shrink-0"><Avatar user={author} size="md" /></Link> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">AV</span>}
                <div className="min-w-0 flex-1">
                  <Link href={author ? `/u/${author.id}` : "#"} className="block truncate text-sm font-semibold text-text hover:underline">{author?.name ?? "av | nu creator"}</Link>
                  <p className="truncate text-xs text-text/50">@{author?.handle ?? "creator"}</p>
                </div>
                {author && (
                  <button type="button" onClick={() => relationship?.iFollow ? unfollow(author.id) : follow(author.id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-divider px-3 py-1.5 text-xs font-semibold text-text/70 transition-colors hover:bg-surface">
                    {relationship?.iFollow ? <><Check className="h-3.5 w-3.5" />Following</> : <><UserPlus className="h-3.5 w-3.5" />Follow</>}
                  </button>
                )}
              </div>

              <div className="px-5 py-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain"> <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${post.kind === "video" ? "bg-moment/90 text-midnight" : post.data.format === "featured" ? "bg-guide/90 text-midnight" : "bg-list/90 text-midnight"}`}>{post.kind === "video" ? "Moment" : post.data.format === "featured" ? "Guide" : "List"}</span>
                    {post.kind === "video" && <Film className="h-4 w-4 text-text/40" />}
                  </div>
                  <h2 className="mt-3 font-headline text-2xl leading-tight text-text">{post.kind === "video" ? post.data.featured.name : post.data.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-text/65">{caption}</p>
                  {author?.bio && <p className="mt-3 rounded-xl bg-surface/60 p-3 text-xs leading-relaxed text-text/60">{author.bio}</p>}
                </div>

                <SocialPostActions className="hidden lg:flex" liked={liked} saved={isSaved} onLike={() => setLiked((current) => !current)} onComment={() => document.getElementById("post-quick-view-comment")?.focus()} onSave={() => setSaveOpen(true)} onShare={() => setShareOpen(true)} />

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
                  <form onSubmit={(event) => { event.preventDefault(); addComment(); }} className="mt-3 flex gap-2"><input id="post-quick-view-comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment…" className="h-10 min-w-0 flex-1 rounded-full border border-divider bg-surface/40 px-4 text-sm focus:border-accent/50 focus:outline-none" /><button type="submit" disabled={!comment.trim()} className="rounded-full bg-text px-4 text-xs font-semibold text-bg disabled:opacity-40">Post</button></form>
                </section>
              </div>
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
