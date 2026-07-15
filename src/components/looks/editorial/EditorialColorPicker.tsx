import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { useLocalStorage } from "@/hooks/useLocalStorage";

const RECENT_COLORS_KEY = "avnu-editorial-recent-colors";
const FAVORITE_COLORS_KEY = "avnu-editorial-favorite-colors";
const DEFAULT_COLOR = "#000000";

function normalizeHex(value: string) {
  const compact = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(compact)) {
    return `#${compact.split("").map((character) => `${character}${character}`).join("")}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(compact)) return `#${compact}`.toUpperCase();
  return null;
}

function ColorRow({ label, colors, onSelect }: { label: string; colors: string[]; onSelect: (color: string) => void }) {
  if (colors.length === 0) return null;
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-text/35">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onSelect(color)}
            aria-label={`Use ${color}`}
            title={color}
            className="h-6 w-6 rounded-full border border-divider/70 shadow-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

export function EditorialColorPicker({
  label,
  value,
  action,
  allowTransparent = false,
}: {
  label: string;
  value: string;
  action: (color: string) => void;
  allowTransparent?: boolean;
}) {
  const transparent = value === "transparent";
  const normalizedValue = normalizeHex(value) ?? DEFAULT_COLOR;
  const [draft, setDraft] = useState(normalizedValue);
  const [recentColors, setRecentColors] = useLocalStorage<string[]>(RECENT_COLORS_KEY, []);
  const [favoriteColors, setFavoriteColors] = useLocalStorage<string[]>(FAVORITE_COLORS_KEY, []);

  useEffect(() => {
    if (!transparent) setDraft(normalizedValue);
  }, [normalizedValue, transparent]);

  const chooseColor = (color: string) => {
    const normalized = normalizeHex(color);
    if (!normalized) return;
    setDraft(normalized);
    action(normalized);
    setRecentColors((current) => [normalized, ...current.filter((item) => item !== normalized)].slice(0, 5));
  };

  const commitDraft = () => {
    const normalized = normalizeHex(draft);
    if (normalized) chooseColor(normalized);
    else setDraft(normalizedValue);
  };

  const isFavorite = favoriteColors.includes(normalizedValue);

  return (
    <div className="min-w-0 space-y-2.5 rounded-xl border border-divider/60 bg-surface/25 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text/45">{label}</p>
        {!transparent && (
          <button
            type="button"
            onClick={() => setFavoriteColors((current) => isFavorite ? current.filter((color) => color !== normalizedValue) : [normalizedValue, ...current.filter((color) => color !== normalizedValue)])}
            aria-label={isFavorite ? `Remove ${normalizedValue} from favorite colors` : `Save ${normalizedValue} to favorite colors`}
            title={isFavorite ? "Remove favorite color" : "Save favorite color"}
            className={`flex h-7 w-7 items-center justify-center rounded-full border ${isFavorite ? "border-pink/40 bg-pink/10 text-pink" : "border-divider/70 bg-bg text-text/40"}`}
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={normalizedValue}
          onChange={(event) => chooseColor(event.target.value)}
          aria-label={`${label} color selector`}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-divider/70 bg-bg p-1"
        />
        <label className="min-w-0 flex-1">
          <span className="sr-only">{label} hex code</span>
          <input
            value={transparent ? "TRANSPARENT" : draft}
            disabled={transparent}
            onChange={(event) => setDraft(event.target.value.toUpperCase())}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                setDraft(normalizedValue);
                event.currentTarget.blur();
              }
            }}
            placeholder="#000000"
            maxLength={7}
            className="h-10 w-full rounded-lg border border-divider/70 bg-bg px-3 font-mono text-xs uppercase text-text focus:border-accent/50 focus:outline-none disabled:text-text/35"
          />
        </label>
        {allowTransparent && (
          <button
            type="button"
            onClick={() => transparent ? chooseColor(normalizedValue) : action("transparent")}
            aria-pressed={transparent}
            className={`h-10 rounded-lg border px-2 text-[10px] font-semibold ${transparent ? "border-text bg-text text-bg" : "border-divider/70 bg-bg text-text/55"}`}
          >
            None
          </button>
        )}
      </div>

      <ColorRow label="Recent" colors={recentColors.slice(0, 5)} onSelect={chooseColor} />
      <ColorRow label="Favorites" colors={favoriteColors} onSelect={chooseColor} />
    </div>
  );
}
