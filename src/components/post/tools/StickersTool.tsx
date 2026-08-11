"use client";

import { useState } from "react";

import { PostToolPanel } from "@/components/post/tools/PostToolPanel";
import { cn } from "@/lib/utils";

// A curated set rather than a full emoji database. emoji-mart's data file is
// around a megabyte, and bundled emoji artwork (OpenMoji in particular) carries
// share-alike terms; native glyphs cost nothing and render everywhere. Swap in a
// lazy-loaded picker later if search becomes necessary.
const EMOJI_GROUPS: Array<{ label: string; emoji: string[] }> = [
  {
    label: "Favourites",
    emoji: ["✨", "💛", "🤍", "🖤", "❤️", "🔥", "⭐️", "💫", "🌟", "💯", "👏", "🙌"],
  },
  {
    label: "Nature",
    emoji: ["🌿", "🌱", "🍃", "🌾", "🌸", "🌼", "🌻", "🌺", "🪴", "🌙", "☀️", "🌊"],
  },
  {
    label: "Home",
    emoji: ["🕯", "🫖", "☕️", "🍵", "🧺", "🪑", "🛋", "🖼", "📚", "🧸", "🧴", "🛁"],
  },
  {
    label: "Style",
    emoji: ["👜", "👗", "🧵", "🧶", "👟", "🕶", "💍", "🎨", "✂️", "📷", "🎧", "🥂"],
  },
  {
    label: "Marks",
    emoji: ["➡️", "⬅️", "⬆️", "⬇️", "✔️", "❓", "❗️", "💬", "🔖", "🏷", "📍", "🔗"],
  },
];

export function StickersTool({
  onAdd,
  onClose,
}: {
  onAdd: (value: string) => void;
  onClose: () => void;
}) {
  const [group, setGroup] = useState(EMOJI_GROUPS[0].label);
  const active = EMOJI_GROUPS.find((item) => item.label === group) ?? EMOJI_GROUPS[0];

  return (
    <PostToolPanel title="Stickers" onClose={onClose}>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EMOJI_GROUPS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setGroup(item.label)}
            aria-pressed={group === item.label}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
              group === item.label ? "border-navy bg-navy text-white" : "border-divider/70 text-midnight/65 hover:border-midnight/30",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-6 gap-2 sm:grid-cols-10">
        {active.emoji.map((emoji) => (
          <li key={emoji}>
            <button
              type="button"
              onClick={() => onAdd(emoji)}
              aria-label={`Add ${emoji} sticker`}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-divider/60 text-2xl transition-colors hover:border-accent hover:bg-accent/10"
            >
              {emoji}
            </button>
          </li>
        ))}
      </ul>
    </PostToolPanel>
  );
}
