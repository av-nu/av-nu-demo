"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Custom event for cross-component sync
const STORAGE_EVENT = "avnu-storage-sync";

function dispatchStorageEvent(key: string) {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key } }));
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  const valueRef = useRef(storedValue);

  useEffect(() => {
    valueRef.current = storedValue;
  }, [storedValue]);

  const syncFromStorage = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(
        item === null ? initialValueRef.current : (JSON.parse(item) as T),
      );
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Read from localStorage on mount and sync across tabs/components
  useEffect(() => {
    setIsHydrated(false);

    // Ensure state is in sync (in case initial state was rendered before value existed)
    syncFromStorage();

    setIsHydrated(true);

    // Listen for changes from other components
    const handleStorageSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      if (customEvent.detail.key === key) {
        try {
          const item = window.localStorage.getItem(key);
          setStoredValue(
            item === null ? initialValueRef.current : (JSON.parse(item) as T),
          );
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    // Listen for changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          setStoredValue(
            e.newValue === null
              ? initialValueRef.current
              : (JSON.parse(e.newValue) as T),
          );
        } catch (error) {
          console.warn(`Error parsing storage event for "${key}":`, error);
        }
      }
    };

    window.addEventListener(STORAGE_EVENT, handleStorageSync);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", syncFromStorage);

    const handleVisibilityChange = () => {
      if (!document.hidden) syncFromStorage();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(STORAGE_EVENT, handleStorageSync);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", syncFromStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [key, syncFromStorage]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const prev = valueRef.current;
        const valueToStore = value instanceof Function ? value(prev) : value;

        valueRef.current = valueToStore;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Dispatch custom event to sync other components
        dispatchStorageEvent(key);
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  return [storedValue, setValue, isHydrated];
}
