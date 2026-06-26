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

const AUTH_KEY = "avnu-auth";

export type AuthUser = {
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  signUp: (input: AuthUser) => void;
  signIn: (input: AuthUser) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser, isHydrated] = useLocalStorage<AuthUser | null>(
    AUTH_KEY,
    null,
  );

  const signUp = useCallback(
    (input: AuthUser) => {
      setUser({ name: input.name.trim(), email: input.email.trim() });
    },
    [setUser],
  );

  const signIn = useCallback(
    (input: AuthUser) => {
      setUser({ name: input.name.trim(), email: input.email.trim() });
    },
    [setUser],
  );

  const signOut = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user?.email),
      isHydrated,
      signUp,
      signIn,
      signOut,
    }),
    [user, isHydrated, signUp, signIn, signOut],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
