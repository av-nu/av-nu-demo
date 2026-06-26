"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { ProductCard } from "@/components/product/ProductCard";
import { getRecommendedProducts } from "@/lib/data";

/**
 * Purchase-based recommendation grid. Products are scored against the items in
 * the order (shared subcategory / category / brand) and the purchased items are
 * excluded so suggestions feel fresh but related.
 */
export function Recommendations({
  purchasedProductIds,
  limit = 4,
}: {
  purchasedProductIds: string[];
  limit?: number;
}) {
  const products = useMemo(
    () => getRecommendedProducts(purchasedProductIds, limit),
    [purchasedProductIds, limit],
  );

  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-pink" />
        <h2 className="font-headline text-xl tracking-tight text-text">
          You might also love
        </h2>
      </div>
      <p className="mb-5 text-sm text-text/50">
        Hand-picked to pair with what you just bought.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
