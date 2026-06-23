import { cn } from "@/lib/utils";
import { type BadgeTone, humanizeStatus, statusTone } from "@/data/oms";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-text/8 text-text/70 ring-text/10",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  pending: "bg-text/8 text-text/60 ring-text/10",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "success" && "bg-emerald-500",
          tone === "info" && "bg-sky-500",
          tone === "warning" && "bg-amber-500",
          tone === "danger" && "bg-rose-500",
          (tone === "neutral" || tone === "pending") && "bg-text/40",
        )}
      />
      {label ?? humanizeStatus(status)}
    </span>
  );
}

/** Labeled status field for detail panels: small caption + badge. */
export function StatusField({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-text/50">{label}</span>
      <StatusBadge status={status} />
    </div>
  );
}
