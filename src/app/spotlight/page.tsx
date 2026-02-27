"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Send, ShoppingBag, Volume2, VolumeX, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockBrands } from "@/data/mockBrands";

const spotlightReels = [
  { id: "1", videoUrl: "/Spotlight/39e95057ed53db829cc7d82c80239d00.mp4", brandId: "ashwood-atelier", caption: "Morning rituals deserve beautiful objects", likes: 1243, comments: 89, products: [{ id: "p1", name: "Ceramic Pour-Over Set", price: 68, image: "/products/_pool/ela-de-pure-5eoYsqzmDW4-unsplash.jpg" }, { id: "p2", name: "Stoneware Mug", price: 32, image: "/products/_pool/twinewood-studio-7ZaRKlsIK6w-unsplash.jpg" }] },
  { id: "3", videoUrl: "/Spotlight/bbce981aa900fff9b34cb9b4a2ffff19.mp4", brandId: "citrus-and-clay", caption: "Handcrafted with intention", likes: 2156, comments: 134, products: [{ id: "p4", name: "Hand-thrown Vase", price: 85, image: "/products/_pool/behnam-norouzi-y0K8EMigxV4-unsplash.jpg" }, { id: "p5", name: "Terracotta Planter", price: 45, image: "/products/_pool/andrej-lisakov-fOo4p1SFbrk-unsplash.jpg" }] },
  { id: "4", videoUrl: "/Spotlight/ce70a8b87a7f83ec5cf69ec54064aa01.mp4", brandId: "coastal-knitworks", caption: "Cozy textures for every season", likes: 1567, comments: 98, products: [{ id: "p6", name: "Chunky Knit Throw", price: 128, image: "/products/_pool/daiga-ellaby-Fs9Vw1OYHJU-unsplash.jpg" }] },
  { id: "5", videoUrl: "/Spotlight/ec4ead950131f9e1e73e937e1260d371.mp4", brandId: "ember-and-bloom", caption: "Bringing warmth to your space", likes: 1834, comments: 112, products: [{ id: "p7", name: "Soy Candle Trio", price: 54, image: "/products/_pool/daiga-ellaby-eKBG7QgDQq0-unsplash.jpg" }, { id: "p8", name: "Reed Diffuser", price: 38, image: "/products/_pool/the-nix-company-tR-fqLlBg5c-unsplash.jpg" }] },
  { id: "2", videoUrl: "/Spotlight/993799343ac142ab7709ef951dd31fe1.mp4", brandId: "aurelith", caption: "Sound, refined to its essence", likes: 892, comments: 45, products: [{ id: "p3", name: "Wireless Speaker", price: 189, image: "/products/_pool/simon-reza-DNEIasg9HaY-unsplash.jpg" }] },
  { id: "6", videoUrl: "/Spotlight/f06ada50637c635f0c800e0be78fb11a.mp4", brandId: "forma-studio", caption: "Form follows function", likes: 945, comments: 67, products: [{ id: "p9", name: "Minimalist Desk Lamp", price: 145, image: "/products/_pool/james-lewis-GeXsUpTSYFg-unsplash.jpg" }] },
  { id: "7", videoUrl: "/Spotlight/new1.mp4", brandId: "golden-grove", caption: "Natures finest ingredients", likes: 1102, comments: 73, products: [{ id: "p10", name: "Botanical Face Oil", price: 62, image: "/products/_pool/mockup-free-BBUbUMxC_rc-unsplash.jpg" }, { id: "p11", name: "Herbal Body Butter", price: 34, image: "/products/_pool/karolina-grabowska-fpz3RrJtoh8-unsplash.jpg" }] },
  { id: "8", videoUrl: "/Spotlight/new2.mp4", brandId: "hearth-and-hide", caption: "Crafted to last generations", likes: 1456, comments: 91, products: [{ id: "p12", name: "Leather Tote Bag", price: 195, image: "/products/_pool/matus-gocman-_VD-KDdnoOM-unsplash.jpg" }] },
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
        <video ref={videoRef} src={reel.videoUrl} className="h-full w-full object-cover cursor-pointer" loop playsInline muted={isMuted} onClick={togglePlay} />
        <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="absolute right-3 top-3 rounded-full bg-black/40 p-2 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent overflow-hidden rounded-b-xl">
          <button onClick={(e) => { e.stopPropagation(); setShowProducts(!showProducts); setShowFullCaption(false); }} className="flex w-full items-center justify-between px-4 py-3 h-16">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="h-8 w-8 overflow-hidden rounded-full border border-white/50 bg-white flex-shrink-0">
                {brand?.logoMark ? (<Image src={brand.logoMark} alt={brand.name} width={32} height={32} className="h-full w-full object-contain p-0.5" />) : (<div className="flex h-full w-full items-center justify-center bg-accent text-white text-xs font-bold">{brand?.name.charAt(0)}</div>)}
              </div>
              <div className="text-left min-w-0 flex-1">
                <span className="font-semibold text-white text-sm block truncate">{brand?.name}</span>
                {reel.products.length > 0 && <span className="text-xs text-white/70">{reel.products.length} {reel.products.length === 1 ? "product" : "products"}</span>}
              </div>
            </div>
            {reel.products.length > 0 && (<div className="flex items-center gap-1 text-white/80 flex-shrink-0"><ShoppingBag className="h-4 w-4" />{showProducts ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}</div>)}
          </button>
          {showProducts && reel.products.length > 0 && (
            <div className="px-3 pb-3 space-y-2 animate-in slide-in-from-bottom-4 duration-200">
              {reel.products.map((product) => (<Link key={product.id} href={brandUrl} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 rounded-lg bg-white/10 backdrop-blur-sm p-2 transition-colors hover:bg-white/20"><div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-white/20"><Image src={product.image} alt={product.name} width={48} height={48} className="h-full w-full object-cover" /></div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{product.name}</p><p className="text-sm text-white/80">${product.price}</p></div><div className="flex-shrink-0 rounded-full bg-white px-3 py-1"><span className="text-xs font-medium text-text">Shop</span></div></Link>))}
            </div>
          )}
          {!showProducts && (<div className="px-4 pb-3 overflow-hidden"><button onClick={(e) => { e.stopPropagation(); setShowFullCaption(!showFullCaption); }} className="text-left w-full"><p className={showFullCaption ? "text-sm text-white/90" : "text-sm text-white/90 truncate"}>{reel.caption}</p></button></div>)}
        </div>
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
