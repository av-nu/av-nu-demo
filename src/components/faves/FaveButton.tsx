"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Product } from "@/data/mockProducts";
import { useRequireAuth } from "@/components/auth/AccountInvitationDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { SaveToListDialog } from "@/components/faves/SaveToListDialog";

type FaveButtonVariant = "card" | "plain";

interface FaveButtonProps {
  product: Product;
  onToast?: (message: string) => void;
  /** Extra classes for positioning (e.g. absolute placement). */
  className?: string;
  variant?: FaveButtonVariant;
}

export function FaveButton({
  product,
  onToast,
  className,
  variant = "card",
}: FaveButtonProps) {
  const { isFavorite } = useFavorites();
  const { requireAuth, invitation } = useRequireAuth();
  const [open, setOpen] = useState(false);
  const saved = isFavorite(product.id);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth("save this product", () => setOpen(true));
  }, [requireAuth]);

  return (
    <>
      <motion.button
        type="button"
        aria-label={saved ? "Edit saved lists" : "Save to a list"}
        onClick={handleClick}
        whileTap={{ scale: 0.85 }}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors",
          variant === "card"
            ? cn(
                "h-8 w-8 backdrop-blur-sm",
                saved
                  ? "bg-accent/20 text-accent"
                  : "bg-bg/80 text-text/60 hover:bg-bg hover:text-accent",
              )
            : cn(
                "h-8 w-8",
                saved
                  ? "bg-accent/15 text-accent"
                  : "text-text/50 hover:bg-surface hover:text-accent",
              ),
          className,
        )}
      >
        <Plus className={cn("h-4 w-4 transition-all", saved && "stroke-[2.5]")} />
      </motion.button>

      {open && (
        <SaveToListDialog
          product={product}
          onClose={() => setOpen(false)}
          onToast={onToast}
        />
      )}
      {invitation}
    </>
  );
}
