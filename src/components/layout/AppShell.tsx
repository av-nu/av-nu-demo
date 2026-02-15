"use client";

import { memo, type ReactNode, useEffect, useLayoutEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { LayoutGroup } from "framer-motion";

import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { PageTransition } from "@/components/layout/PageTransition";
import { SideNav } from "@/components/layout/SideNav";
import { TopHeader } from "@/components/layout/TopHeader";
import { CartProvider } from "@/hooks/useCart";

const CartPopover = dynamic(
  () => import("@/components/cart/CartPopover").then((m) => m.CartPopover),
  { ssr: false },
);

export const AppShell = memo(function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    const main = document.querySelector("main");

    const scrollToTop = () => {
      try {
        window.scrollTo(0, 0);
      } catch {
        // no-op
      }

      if (main && "scrollTo" in main) {
        try {
          (main as HTMLElement).scrollTo({ top: 0, left: 0 });
        } catch {
          (main as HTMLElement).scrollTop = 0;
          (main as HTMLElement).scrollLeft = 0;
        }
      }
    };

    scrollToTop();
    const raf = window.requestAnimationFrame(scrollToTop);
    const t = window.setTimeout(scrollToTop, 50);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [pathname]);

  return (
    <CartProvider>
      <LayoutGroup>
        <div className="min-h-screen bg-bg">
          <SideNav collapsed={sideNavCollapsed} onToggle={() => setSideNavCollapsed(!sideNavCollapsed)} />
          <BottomTabBar />

          {/* Full-width top bar - matches logo header height */}
          <div className="hidden md:block md:fixed md:inset-x-0 md:top-0 md:z-40 md:h-[88px] md:bg-bg/80 md:backdrop-blur-sm" />

          {/* Persistent cart icon - top right */}
          {isMounted && (
            <div className="fixed right-4 top-4 z-50 md:right-8 md:top-6">
              <CartPopover />
            </div>
          )}

          <div className={`transition-[margin] duration-200 ease-in-out ${sideNavCollapsed ? "md:ml-[72px]" : "md:ml-64"}`}>
            <main className={`w-full px-4 pb-28 md:px-6 md:pb-12 ${pathname !== "/" ? "md:pt-[88px]" : ""}`}>
              <TopHeader />
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </div>
      </LayoutGroup>
    </CartProvider>
  );
});
