"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Product } from "@/data/mockProducts";
import { searchProducts, type ProductFilters } from "@/lib/data";

const SIMULATED_DELAY_MS = 400;
const EMPTY_FILTERS: ProductFilters = {};

type UseInfiniteProductsOptions = {
  pageSize?: number;
  filters?: ProductFilters;
  query?: string;
};

export function useInfiniteProducts(options: UseInfiniteProductsOptions = {}) {
  const pageSize = options.pageSize ?? 12;
  const filters = options.filters ?? EMPTY_FILTERS;
  const query = options.query ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const isFetchingRef = useRef(false);

  const fetchPage = useCallback(
    async (pageNum: number, reset = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsLoading(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

        const result = searchProducts(query, filters, pageNum, pageSize);

        setProducts((prev) => (reset ? result.items : [...prev, ...result.items]));
        setHasMore(result.hasMore);
        setPage(pageNum);
        setIsInitialLoad(false);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [query, filters, pageSize],
  );

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPage(page + 1);
    }
  }, [isLoading, hasMore, page, fetchPage]);

  const reset = useCallback(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setIsInitialLoad(true);
    fetchPage(1, true);
  }, [fetchPage]);

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  return {
    products,
    isLoading,
    isInitialLoad,
    hasMore,
    loadMore,
    reset,
  };
}
