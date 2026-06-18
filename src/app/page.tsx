"use client";

import { useToast } from "@/components/ui/Toast";
import { HeroSection } from "@/components/home/HeroSection";
import { WhatsNuCircles } from "@/components/home/WhatsNuCircles";
import { ShoppableFeed } from "@/components/home/ShoppableFeed";

export default function Home() {
  const { showToast, ToastContainer } = useToast();

  return (
    <div className="md:pt-6">
      <HeroSection />
      <WhatsNuCircles />
      <ShoppableFeed onShare={showToast} />
      <ToastContainer />
    </div>
  );
}
