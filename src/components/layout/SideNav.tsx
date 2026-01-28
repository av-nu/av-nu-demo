"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { navItems, type NavItem } from "@/components/layout/nav-items";

const NavLink = memo(function NavLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={() => window.scrollTo(0, 0)}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "text-text"
          : "text-text/60 hover:text-text/90 hover:bg-surface/50",
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute inset-0 rounded-xl bg-surface"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
          }}
        />
      )}

      <span className="relative z-10 flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200",
            isActive
              ? "bg-accent/15 text-accent"
              : "bg-transparent text-text/50 group-hover:bg-surface/70 group-hover:text-text/70",
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
        </span>
        <span>{item.label}</span>
      </span>
    </Link>
  );
});

export const SideNav = memo(function SideNav() {
  const pathname = usePathname();

  const items = useMemo(() => navItems, []);

  return (
    <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col md:border-r md:border-divider/60 md:bg-bg">
      <div className="px-6 pt-8 pb-6">
        <img
          src="/logo.svg"
          alt="av | nu"
          width={100}
          height={28}
          className="h-7 w-auto"
          loading="eager"
          decoding="async"
        />
        <div className="mt-2 text-xs tracking-wide text-text/50">
          Find What's Nu
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      <div className="border-t border-divider/40 px-6 py-5">
        <div className="text-[11px] uppercase tracking-[0.12em] text-text/40">
          Editorial marketplace UI
        </div>
      </div>
    </aside>
  );
});
