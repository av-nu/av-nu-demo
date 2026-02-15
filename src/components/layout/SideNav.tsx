"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { navItems, type NavItem } from "@/components/layout/nav-items";

const NavLink = memo(function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={() => window.scrollTo(0, 0)}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center" : "gap-3",
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

      <span className={cn("relative z-10 flex items-center", collapsed ? "" : "gap-3")}>
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
        {!collapsed && <span>{item.label}</span>}
      </span>
    </Link>
  );
});

interface SideNavProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const SideNav = memo(function SideNav({ collapsed, onToggle }: SideNavProps) {
  const pathname = usePathname();

  const items = useMemo(() => navItems, []);

  // Logo header is always 200px wide (enough for logo + hamburger)
  const logoHeaderWidth = 200;

  return (
    <>
      {/* Fixed logo header - NEVER animates, always same size */}
      <div 
        style={{ width: logoHeaderWidth }}
        className="hidden md:flex md:fixed md:left-0 md:top-0 md:z-50 md:h-[88px] md:items-start md:justify-between md:px-5 md:pt-6"
      >
        <div>
          <img
            src="/logo.svg"
            alt="av | nu"
            width={100}
            height={28}
            className="h-7 w-auto"
            loading="eager"
            decoding="async"
          />
          <div className="mt-2 text-xs tracking-wide text-text/50 whitespace-nowrap">
            Find What's Nu
          </div>
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text/50 transition-colors hover:bg-surface/50 hover:text-text/70"
            title="Collapse sidebar"
          >
            <Menu className="h-5 w-5" strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* Collapsible nav sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex-col md:border-r md:border-divider/60 md:bg-bg"
      >
        {/* Spacer for fixed logo header */}
        <div className="h-[88px] shrink-0" />

        <nav className={cn("flex-1 space-y-1 py-2", collapsed ? "px-2" : "px-3")}>
          {/* Hamburger as first nav item when collapsed */}
          {collapsed && (
            <button
              onClick={onToggle}
              title="Expand sidebar"
              className="group relative flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium text-text/60 transition-all duration-200 hover:bg-surface/50 hover:text-text/90"
            >
              <span className="relative z-10 flex items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-text/50 transition-colors duration-200 group-hover:bg-surface/70 group-hover:text-text/70">
                  <Menu className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
              </span>
            </button>
          )}
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </motion.aside>
    </>
  );
});
