"use client";

import { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  userRating?: number | null;
  onRate?: (rating: number) => void;
  size?: "sm" | "md";
  showUserRating?: boolean;
}

export const StarRating = memo(function StarRating({
  rating,
  userRating,
  onRate,
  size = "sm",
  showUserRating = true,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [animatingStars, setAnimatingStars] = useState<number[]>([]);

  const displayRating = hoverRating ?? userRating ?? rating;
  const isInteractive = !!onRate;

  const handleClick = useCallback(
    (starIndex: number, isHalf: boolean) => {
      if (!onRate) return;

      const newRating = isHalf ? starIndex + 0.5 : starIndex + 1;
      onRate(newRating);

      const starsToAnimate = [];
      for (let i = 0; i <= starIndex; i++) {
        starsToAnimate.push(i);
      }
      setAnimatingStars(starsToAnimate);

      setTimeout(() => setAnimatingStars([]), 400);
    },
    [onRate],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
      if (!isInteractive) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isHalf = x < rect.width / 2;

      setHoverRating(isHalf ? starIndex + 0.5 : starIndex + 1);
    },
    [isInteractive],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverRating(null);
  }, []);

  const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const fillAmount = Math.min(1, Math.max(0, displayRating - starIndex));
          const isAnimating = animatingStars.includes(starIndex);

          return (
            <motion.button
              key={starIndex}
              type="button"
              disabled={!isInteractive}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const isHalf = x < rect.width / 2;
                handleClick(starIndex, isHalf);
              }}
              onMouseMove={(e) => handleMouseMove(e, starIndex)}
              animate={
                isAnimating
                  ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, -10, 10, 0],
                    }
                  : { scale: 1 }
              }
              transition={{ duration: 0.3, ease: "easeOut" }}
              whileTap={isInteractive ? { scale: 0.9 } : undefined}
              className={cn(
                "relative",
                isInteractive && "cursor-pointer",
                !isInteractive && "cursor-default",
              )}
            >
              <Star
                className={cn(starSize, "text-text/20")}
                strokeWidth={1.5}
              />

              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillAmount * 100}%` }}
              >
                <Star
                  className={cn(
                    starSize,
                    userRating ? "fill-accent text-accent" : "fill-accent/70 text-accent/70",
                  )}
                  strokeWidth={1.5}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <span className="text-xs text-text/50">
        {rating.toFixed(1)}
        {showUserRating && userRating && (
          <span className="ml-1 text-accent">★ {userRating.toFixed(1)}</span>
        )}
      </span>
    </div>
  );
});
