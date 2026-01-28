"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useLocalStorage } from "./useLocalStorage";

const CART_KEY = "avnu-cart";

export type CartItem = {
  productId: string;
  brandId: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addToCart: (productId: string, brandId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  totalItems: number;
  isHydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems, isHydrated] = useLocalStorage<CartItem[]>(CART_KEY, []);

  const addToCart = useCallback(
    (productId: string, brandId: string, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === productId);
        if (existing) {
          return prev.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }
        return [...prev, { productId, brandId, quantity }];
      });
    },
    [setItems],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    },
    [setItems],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        ),
      );
    },
    [setItems, removeFromCart],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  const getItemQuantity = useCallback(
    (productId: string) => {
      const item = items.find((i) => i.productId === productId);
      return item?.quantity ?? 0;
    },
    [items],
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getItemQuantity,
      totalItems,
      isHydrated,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getItemQuantity,
      totalItems,
      isHydrated,
    ],
  );

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx) return ctx;

  // Fallback (in case a component is mounted outside CartProvider)
  const [items, setItems, isHydrated] = useLocalStorage<CartItem[]>(CART_KEY, []);

  const addToCart = useCallback(
    (productId: string, brandId: string, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === productId);
        if (existing) {
          return prev.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }
        return [...prev, { productId, brandId, quantity }];
      });
    },
    [setItems],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    },
    [setItems],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        ),
      );
    },
    [setItems, removeFromCart],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  const getItemQuantity = useCallback(
    (productId: string) => {
      const item = items.find((i) => i.productId === productId);
      return item?.quantity ?? 0;
    },
    [items],
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    totalItems,
    isHydrated,
  };
}
