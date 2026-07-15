import { AlertTriangle, Eye } from "lucide-react";

import { cn } from "@/lib/utils";
import { RETURN_TIER_LABELS, type ReturnTier } from "@/data/oms";

/**
 * Compact pill flagging a shopper / address / product / brand's return tier.
 * Renders nothing for "normal" so it only draws attention when it matters.
 */
export function ReturnTierBadge({
  tier,
  className,
}: {
  tier: ReturnTier;
  className?: string;
}) {
  if (tier === "normal") return null;
  const isAbuser = tier === "abuser";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        isAbuser
          ? "bg-red-100 text-red-700"
          : "bg-amber-100 text-amber-700",
        className,
      )}
    >
      {isAbuser ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Eye className="h-3 w-3" />
      )}
      {RETURN_TIER_LABELS[tier]}
    </span>
  );
}
