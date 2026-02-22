"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

const routeConfig: Record<
  string,
  { title: string; subtitle?: string; showSearch?: boolean }
> = {
  "/": { title: "av | nu", subtitle: "A refined marketplace" },
  "/search": { title: "" },
  "/brands": { title: "" },
  "/favorites": { title: "" },
  "/cart": { title: "" },
  "/profile": { title: "" },
};

export const TopHeader = memo(function TopHeader() {
  const pathname = usePathname();

  if (pathname.startsWith("/brand/") || pathname.startsWith("/product/") || pathname.startsWith("/brand-preview/")) {
    return null;
  }

  const dynamicConfig =
    pathname.startsWith("/brand/") || pathname.startsWith("/product/")
      ? { title: "" }
      : null;

  const config = routeConfig[pathname] ?? dynamicConfig ?? { title: "" };

  return (
    <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-lg backdrop-saturate-150">
      <div className="flex min-h-[60px] items-center gap-4 px-4 py-3 md:px-0">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-1"
        >
          {config.showSearch ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
              <input
                type="text"
                placeholder="Search products, brands..."
                className="h-11 w-full rounded-xl border border-divider/60 bg-surface/50 pl-10 pr-4 text-sm text-text placeholder:text-text/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-200"
              />
            </div>
          ) : (
            <div>
  {pathname !== "/" && config.title && (
                <h1 className="font-headline text-xl tracking-tight text-text">
                  {config.title}
                </h1>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </header>
  );
});
