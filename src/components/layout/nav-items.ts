import {
  Home,
  Search,
  Store,
  Heart,
  User,
  ShoppingBag,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/brands", label: "Brands", icon: Store },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
];

// Mobile-only nav items (includes More instead of some desktop items)
export const mobileNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/brands", label: "Brands", icon: Store },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/more", label: "More", icon: MoreHorizontal },
];
