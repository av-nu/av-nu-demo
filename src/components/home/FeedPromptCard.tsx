"use client";

import { Lightbulb, MessageCircle, Sparkles, Wand2 } from "lucide-react";

const PROMPTS = [
  { title: "Create a post", subtitle: "Bring a favorite find to life", icon: Sparkles, color: "bg-accent" },
  { title: "Share inspiration", subtitle: "Show us what you are loving", icon: Lightbulb, color: "bg-guide" },
  { title: "Start a conversation", subtitle: "Tell the community what you think", icon: MessageCircle, color: "bg-navy" },
  { title: "Make it yours", subtitle: "Build a thoughtful edit", icon: Wand2, color: "bg-burgundy" },
] as const;

export function FeedPromptCard({ index, onClick }: { index: number; onClick: () => void }) {
  const prompt = PROMPTS[index % PROMPTS.length];
  const Icon = prompt.icon;

  return (
    <button type="button" onClick={onClick} className={`group flex aspect-square w-full flex-col justify-between rounded-2xl p-4 text-left text-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg ${prompt.color}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-base font-semibold leading-tight">{prompt.title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-white/80">{prompt.subtitle}</span>
      </span>
    </button>
  );
}
