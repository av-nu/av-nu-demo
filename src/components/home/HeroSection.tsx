"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const HERO_IMAGE = "/products/_pool/curated-lifestyle-gLmmY_kGIdU-unsplash2.jpg";

export function HeroSection() {
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
    </section>
  );
}
