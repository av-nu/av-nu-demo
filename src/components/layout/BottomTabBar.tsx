"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { mobileNavItems, type NavItem } from "@/components/layout/nav-items";

const TabItem = memo(function TabItem({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;
  const isFavorites = item.href === "/favorites";

  return (
    <Link
      href={item.href}
      onClick={() => window.scrollTo(0, 0)}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium tracking-wide transition-colors duration-200",
        isActive ? "text-text" : "text-text/50",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && (
        <motion.div
          layoutId="tab-active-indicator"
          className="absolute -top-0.5 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-accent"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
          }}
        />
      )}

      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
          isActive
            ? isFavorites
              ? "text-pink"
              : "text-accent"
            : "text-text/45",
        )}
      >
        <Icon
          className="h-[22px] w-[22px]"
          strokeWidth={isActive ? 2.2 : 1.6}
        />
      </span>

      <span className="truncate">{item.label}</span>
    </Link>
  );
});

export const BottomTabBar = memo(function BottomTabBar() {
  const pathname = usePathname();

  const items = useMemo(() => mobileNavItems, []);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-divider/50 bg-bg/95 backdrop-blur-lg backdrop-saturate-150 md:hidden">
      <div className="safe-area-inset-bottom mx-auto grid max-w-lg grid-cols-5 px-1">
        {items.map((item) => (
          <TabItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </div>
    </nav>
  );
});
