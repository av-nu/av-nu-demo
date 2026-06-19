"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ArrowDown, Sparkles } from "lucide-react";

import { PersonalizeDialog } from "@/components/personalize/PersonalizeDialog";
import { useToast } from "@/components/ui/Toast";

const HERO_IMAGE = "/products/_pool/curated-lifestyle-gLmmY_kGIdU-unsplash2.jpg";

export function HeroSection() {
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const { showToast, ToastContainer } = useToast();

  return (
    <section className="relative">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl"
      >
        {/* Hero image */}
        <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
          <Image
            src={HERO_IMAGE}
            alt="Discover something nu"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Readability overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

          {/* Hero copy */}
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
            <h1 className="max-w-xl font-headline text-3xl leading-tight text-white md:text-5xl">
              Discover something <span className="italic">nu</span>
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/85 md:text-base">
              Fresh finds from independent brands, curated for the way you live.
            </p>
          </div>
        </div>
      </motion.div>

      {/* CTA row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-stretch sm:gap-4"
      >
        {/* Start Browsing — bold filled pill */}
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="w-full sm:flex-1">
          <Link
            href="#nu-feed"
            className="group flex h-full w-full items-center justify-center gap-2.5 rounded-full bg-[#1b2a4a] px-6 py-3.5 text-white shadow-sm transition-all hover:bg-[#16223c] hover:shadow-md"
          >
            <ArrowDown
              className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-y-0.5"
              strokeWidth={2.2}
            />
            <span className="text-base font-semibold tracking-tight">Start Browsing</span>
          </Link>
        </motion.div>

        {/* Personalize my experience — playful outlined pill */}
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="w-full sm:flex-1">
          <button
            type="button"
            onClick={() => setPersonalizeOpen(true)}
            className="group flex h-full w-full items-center justify-center gap-2.5 rounded-full border-2 border-text/15 bg-bg py-2.5 pl-5 pr-4 text-text transition-colors hover:border-accent hover:text-accent"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-pink transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" strokeWidth={2} />
            <span className="text-base font-semibold tracking-tight">Personalize my experience</span>
            <ArrowRight
              className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
              strokeWidth={2.2}
            />
          </button>
        </motion.div>
      </motion.div>

      {personalizeOpen && (
        <PersonalizeDialog
          onClose={() => setPersonalizeOpen(false)}
          onToast={showToast}
        />
      )}
      <ToastContainer />
    </section>
  );
}
