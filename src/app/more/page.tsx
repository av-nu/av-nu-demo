"use client";

import Link from "next/link";
import { 
  Info, 
  Truck, 
  Mail, 
  FileText, 
  ShoppingBag, 
  User,
  Heart,
  ChevronRight 
} from "lucide-react";

const moreLinks = [
  {
    href: "/profile",
    label: "Profile",
    description: "Your account settings",
    icon: User,
  },
  {
    href: "/favorites",
    label: "Favorites",
    description: "Your saved items",
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
    </div>
  );
}
