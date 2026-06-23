"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  RotateCcw,
  Receipt,
  Webhook,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ADMIN_ROLE_LABELS, useAdminRole, type AdminRole } from "@/hooks/useAdminRole";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: Package, exact: false },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw, exact: false },
  { href: "/admin/refunds", label: "Refunds", icon: Receipt, exact: false },
  { href: "/admin/webhooks", label: "Webhooks", icon: Webhook, exact: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { role, setRole } = useAdminRole();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen bg-surface text-text">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-divider/60 bg-bg md:flex">
        <div className="flex h-[72px] items-center gap-2 border-b border-divider/60 px-5">
          <span className="font-headline text-lg tracking-tight">av | nu</span>
          <span className="rounded bg-burgundy/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-burgundy">
            OMS
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(href, exact)
                  ? "bg-burgundy/10 text-burgundy"
                  : "text-text/70 hover:bg-surface hover:text-text",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-divider/60 p-4 text-[11px] text-text/40">
          Internal OMS · demo data
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col md:ml-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-divider/60 bg-bg/90 px-4 backdrop-blur md:px-8">
          <div className="md:hidden">
            <span className="font-headline text-base">av | nu OMS</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-xs text-text/50">
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
                className="rounded-lg border border-divider/60 bg-bg px-2 py-1.5 text-xs font-medium text-text focus:border-accent/50 focus:outline-none"
              >
                {(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ADMIN_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
              AV
            </span>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-divider/60 bg-bg px-3 py-2 md:hidden">
          {NAV.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
                isActive(href, exact)
                  ? "bg-burgundy/10 text-burgundy"
                  : "text-text/70",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
