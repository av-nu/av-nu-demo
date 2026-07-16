"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Send, ShoppingBag, Volume2, VolumeX, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockBrands } from "@/data/mockBrands";
import { mockProducts } from "@/data/mockProducts";

function productAt(index: number) {
  const product = mockProducts[index % mockProducts.length];
  return { id: product.id, name: product.name, price: product.price, image: product.images[0] };
}

const spotlightReels = [
  { id: "1", videoUrl: "/Spotlight/39e95057ed53db829cc7d82c80239d00.mp4", brandId: "ashwood-atelier", caption: "Morning rituals deserve beautiful objects", likes: 1243, comments: 89, products: [productAt(0), productAt(1)] },
  { id: "3", videoUrl: "/Spotlight/bbce981aa900fff9b34cb9b4a2ffff19.mp4", brandId: "citrus-and-clay", caption: "Handcrafted with intention", likes: 2156, comments: 134, products: [productAt(2), productAt(3)] },
  { id: "4", videoUrl: "/Spotlight/ce70a8b87a7f83ec5cf69ec54064aa01.mp4", brandId: "coastal-knitworks", caption: "Cozy textures for every season", likes: 1567, comments: 98, products: [productAt(4)] },
  { id: "5", videoUrl: "/Spotlight/ec4ead950131f9e1e73e937e1260d371.mp4", brandId: "ember-and-bloom", caption: "Bringing warmth to your space", likes: 1834, comments: 112, products: [productAt(5), productAt(6)] },
  { id: "2", videoUrl: "/Spotlight/993799343ac142ab7709ef951dd31fe1.mp4", brandId: "aurelith", caption: "Sound, refined to its essence", likes: 892, comments: 45, products: [productAt(7)] },
  { id: "6", videoUrl: "/Spotlight/f06ada50637c635f0c800e0be78fb11a.mp4", brandId: "forma-studio", caption: "Form follows function", likes: 945, comments: 67, products: [productAt(8)] },
  { id: "7", videoUrl: "/Spotlight/new1.mp4", brandId: "golden-grove", caption: "Natures finest ingredients", likes: 1102, comments: 73, products: [productAt(9), productAt(10)] },
  { id: "8", videoUrl: "/Spotlight/new2.mp4", brandId: "hearth-and-hide", caption: "Crafted to last generations", likes: 1456, comments: 91, products: [productAt(11)] },
];

type ReelType = (typeof spotlightReels)[0];

function ReelCard({ reel }: { reel: ReelType }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const brand = mockBrands.find((b) => b.id === reel.brandId);
  const brandUrl = "/brand/" + reel.brandId;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div ref={cardRef} className="group">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} src={reel.videoUrl} className="h-full w-full cursor-pointer object-cover" loop playsInline muted={isMuted} onClick={togglePlay} />
        <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="absolute right-3 top-3 rounded-full bg-black/40 p-2 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
          {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
        </button>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-divider bg-white">
        <button onClick={(e) => { e.stopPropagation(); setShowProducts(!showProducts); setShowFullCaption(false); }} className="flex h-16 w-full items-center justify-between px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-divider bg-surface">
              {brand?.logoMark ? (<Image src={brand.logoMark} alt={brand.name} width={32} height={32} className="h-full w-full object-contain p-0.5" />) : (<div className="flex h-full w-full items-center justify-center bg-accent text-xs font-bold text-white">{brand?.name.charAt(0)}</div>)}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-semibold text-text">{brand?.name}</span>
              {reel.products.length > 0 && <span className="text-xs text-text/50">{reel.products.length} {reel.products.length === 1 ? "product" : "products"}</span>}
            </div>
          </div>
          {reel.products.length > 0 && (<div className="flex flex-shrink-0 items-center gap-1 text-burgundy/70"><ShoppingBag className="h-4 w-4" />{showProducts ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}</div>)}
        </button>
        {showProducts && reel.products.length > 0 && (
          <div className="animate-in space-y-2 border-t border-divider/60 px-3 pb-3 pt-3 slide-in-from-bottom-4 duration-200">
            {reel.products.map((product) => (<Link key={product.id} href={brandUrl} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 rounded-lg bg-surface/70 p-2 transition-colors hover:bg-surface"><div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-divider"><Image src={product.image} alt={product.name} width={48} height={48} className="h-full w-full object-cover" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-text">{product.name}</p><p className="text-sm text-text/60">${product.price}</p></div><div className="flex-shrink-0 rounded-full bg-text px-3 py-1"><span className="text-xs font-medium text-bg">Shop</span></div></Link>))}
          </div>
        )}
        {!showProducts && (<div className="overflow-hidden px-4 pb-3"><button onClick={(e) => { e.stopPropagation(); setShowFullCaption(!showFullCaption); }} className="w-full text-left"><p className={showFullCaption ? "text-sm text-text/70" : "truncate text-sm text-text/70"}>{reel.caption}</p></button></div>)}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsLiked(!isLiked)} className="flex items-center gap-1"><Heart className={isLiked ? "h-5 w-5 fill-red-500 text-red-500" : "h-5 w-5 text-text/60"} /><span className="text-xs text-text/60">{isLiked ? reel.likes + 1 : reel.likes}</span></button>
          <button className="flex items-center gap-1"><MessageCircle className="h-5 w-5 text-text/60" /><span className="text-xs text-text/60">{reel.comments}</span></button>
          <button><Send className="h-5 w-5 text-text/60" /></button>
        </div>
        <Button asChild size="sm" variant="ghost" className="h-8 text-xs"><Link href={brandUrl}><ShoppingBag className="mr-1 h-3.5 w-3.5" />Shop</Link></Button>
      </div>
    </div>
  );
}

export default function SpotlightPage() {
  return (
    <div className="min-h-screen pb-24 pt-2 md:pb-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-4 font-headline text-2xl tracking-tight text-text md:text-3xl">Shop the Scene</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {spotlightReels.map((reel) => (<ReelCard key={reel.id} reel={reel} />))}
        </div>
      </div>
    </div>
  );
}
