"use client";

import { useToast } from "@/components/ui/Toast";
import { DiscoverFeed } from "@/components/home/DiscoverFeed";

export default function Home() {
  const { showToast, ToastContainer } = useToast();

  return (
    <div>
      <DiscoverFeed onToast={showToast} />
      <ToastContainer />
    </div>
  );
}
