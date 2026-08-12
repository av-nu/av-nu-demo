"use client";

import { useState } from "react";

import Link from "next/link";

import { resetDemoData } from "@/lib/demoReset";
import { 
  Info, 
  Truck, 
  Mail, 
  FileText, 
  ShoppingBag, 
  User,
  Heart,
  Bell,
  Users,
  RotateCcw,
  Sparkles,
  ChevronRight 
} from "lucide-react";

const moreLinks = [
  {
    href: "/profile",
    label: "Profile",
    description: "Your social profile & posts",
    icon: User,
  },
  {
    href: "/create",
    label: "Post",
    description: "Share a photo, video, or collage",
    icon: Sparkles,
  },
  {
    href: "/connections",
    label: "Connections",
    description: "Inner circle, followers & invitations",
    icon: Users,
  },
  {
    href: "/notifications",
    label: "Notifications",
    description: "Likes, comments & invites",
    icon: Bell,
  },
  {
    href: "/favorites",
    label: "My Faves",
    description: "Your lists & saved items",
    icon: Heart,
  },
  {
    href: "/cart",
    label: "Cart",
    description: "View your shopping cart",
    icon: ShoppingBag,
  },
  {
    href: "#",
    label: "About av | nu",
    description: "Our story and mission",
    icon: Info,
  },
  {
    href: "/returns",
    label: "Start a Return",
    description: "Find your purchase and start a return",
    icon: RotateCcw,
  },
  {
    href: "#",
    label: "Shipping & Returns",
    description: "Delivery info and policies",
    icon: Truck,
  },
  {
    href: "#",
    label: "Contact Us",
    description: "Get in touch with our team",
    icon: Mail,
  },
  {
    href: "#",
    label: "Terms & Privacy",
    description: "Legal information",
    icon: FileText,
  },
];

export default function MorePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-headline text-2xl tracking-tight text-text">
        More
      </h1>
      <p className="mt-1 text-sm text-text/50">
        Account, help, and info
      </p>

      <div className="mt-6 space-y-2">
        {moreLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-4 rounded-xl bg-surface/50 p-4 transition-colors hover:bg-surface"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg">
                <Icon className="h-5 w-5 text-text/60" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-text">{link.label}</p>
                <p className="text-sm text-text/50">{link.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-text/30" />
            </Link>
          );
        })}
      </div>

      <DemoResetCard />
    </div>
  );
}

/**
 * Returns the demo to its seeded state. Kept behind a confirmation because it
 * discards published posts and uploaded media, which cannot be recovered.
 */
function DemoResetCard() {
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  return (
    <div className="mt-8 rounded-xl border border-divider/60 bg-surface/30 p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg">
          <RotateCcw className="h-5 w-5 text-text/60" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-text">Reset demo data</p>
          <p className="text-sm text-text/50">
            Clears posts, faves, orders, and uploads in this browser, back to the seeded demo.
          </p>
        </div>
      </div>

      {confirming ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={resetting}
            onClick={async () => {
              setResetting(true);
              await resetDemoData();
              // A full reload is the simplest way to have every hook re-seed.
              window.location.href = "/";
            }}
            className="rounded-full bg-pink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pink/90 disabled:opacity-50"
          >
            {resetting ? "Resetting…" : "Yes, reset everything"}
          </button>
          <button
            type="button"
            disabled={resetting}
            onClick={() => setConfirming(false)}
            className="rounded-full border border-divider/70 px-4 py-2 text-sm font-semibold text-text/70 transition-colors hover:text-text"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 rounded-full border border-divider/70 px-4 py-2 text-sm font-semibold text-text/70 transition-colors hover:text-text"
        >
          Reset demo data
        </button>
      )}
    </div>
  );
}
