import {
  Home,
  Search,
  Store,
  Heart,
  User,
  ShoppingBag,
  Sparkles,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Discover", icon: Home },
  { href: "/create-a-look", label: "Lookbook", icon: Sparkles },
  { href: "/window-shopping", label: "Brands", icon: Store },
  { href: "/favorites", label: "My Faves", icon: Heart },
  { href: "/search", label: "Search", icon: Search },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
];

// Mobile-only nav items (includes More instead of some desktop items)
export const mobileNavItems: NavItem[] = [
  { href: "/", label: "Discover", icon: Home },
  { href: "/create-a-look", label: "Lookbook", icon: Sparkles },
  { href: "/favorites", label: "My Faves", icon: Heart },
  { href: "/window-shopping", label: "Brands", icon: Store },
  { href: "/search", label: "Search", icon: Search },
  { href: "/more", label: "More", icon: MoreHorizontal },
];
