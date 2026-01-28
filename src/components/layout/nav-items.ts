import {
  Home,
  Search,
  Store,
  Heart,
  User,
  ShoppingBag,
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
