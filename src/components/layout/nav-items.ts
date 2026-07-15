import {
  Home,
  Search,
  Store,
  Heart,
  User,
  ShoppingBag,
  MoreHorizontal,
  Sparkles,
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
  { href: "/search", label: "Search", icon: Search },
  { href: "/window-shopping", label: "Window Shopping", icon: Store },
  { href: "/favorites", label: "My Faves", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
];

// Mobile-only nav items (includes More instead of some desktop items)
export const mobileNavItems: NavItem[] = [
  { href: "/", label: "Discover", icon: Home },
  { href: "/favorites", label: "My Faves", icon: Heart },
  { href: "/search", label: "Search", icon: Search },
  { href: "/window-shopping", label: "Window Shopping", icon: Store },
  { href: "/more", label: "More", icon: MoreHorizontal },
];
