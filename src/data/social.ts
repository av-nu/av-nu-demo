// Lightweight mock social graph for the demo. There is no backend, so the
// "current user", their inner circle, and followers are all simulated here.
// The live relationship state (follows, invitations, inner circle) is owned by
// the SocialService (see src/lib/social); this file only seeds the directory of
// people and their static profile details.

export type Contact = {
  id: string;
  name: string;
  initials: string;
  /** Tailwind background class used for the avatar chip. */
  color: string;
  avatarUrl?: string;
  /** Seed circle used to initialize the social graph on first run. */
  circle: "inner" | "follower" | "suggested";
  handle: string;
  bio: string;
};

export const currentUser = {
  id: "me",
  name: "You",
  initials: "Y",
  handle: "you",
  avatarUrl: "/demo-profiles/openart-gpt-image-2-1_1785988748101_ccdf99b3.webp",
};

export const contacts: Contact[] = [
  // Inner circle — people you share private lists with
  { id: "c-mara", name: "Mara Ellis", initials: "ME", color: "bg-pink", avatarUrl: "/demo-profiles/openart-gpt-image-2-1_1785988748101_ccdf99b3.webp", circle: "inner", handle: "maraellis", bio: "Slow living + ceramics. Always reaching for something handmade." },
  { id: "c-jonah", name: "Jonah Reed", initials: "JR", color: "bg-accent", avatarUrl: "/demo-profiles/openart-gpt-image-2-1_1785988798727_5c13f084.webp", circle: "inner", handle: "jonahreed", bio: "Gift-giver in chief. Coffee, denim, and good design." },
  { id: "c-priya", name: "Priya Nair", initials: "PN", color: "bg-burgundy", avatarUrl: "/demo-profiles/openart-gpt-image-2-1_1785988876415_171036cc.webp", circle: "inner", handle: "priyanair", bio: "Home stylist. Housewarmings are my love language." },
  { id: "c-leo", name: "Leo Watanabe", initials: "LW", color: "bg-pink", avatarUrl: "/demo-profiles/openart-gpt-image-2-1_1785988969599_5a20b70b.webp", circle: "inner", handle: "leowat", bio: "Minimalist with a soft spot for textiles." },
  { id: "c-sof", name: "Sofia Marin", initials: "SM", color: "bg-accent", avatarUrl: "/demo-profiles/openart-gpt-image-2-1_1785988981580_0a4b8cb8.webp", circle: "inner", handle: "sofiamarin", bio: "Travel, packing lists, and the perfect tote." },
  { id: "c-deni", name: "Deni Carter", initials: "DC", color: "bg-burgundy", avatarUrl: "/demo-profiles/openart-gpt-image-2-1_1785989004576_ab358fd2.webp", circle: "inner", handle: "denicarter", bio: "Maker. Plant person. Candle hoarder." },

  // Followers — can see your public lists only
  { id: "f-aria", name: "Aria Blume", initials: "AB", color: "bg-accent", avatarUrl: "/demo-profiles/openart-gpt-image-2-1_1785989026215_8b751c80.webp", circle: "follower", handle: "ariablume", bio: "Layering staples and cozy knits." },
  { id: "f-theo", name: "Theo Park", initials: "TP", color: "bg-pink", avatarUrl: "/demo-profiles/openart-gpt-image-2-1_1785989149668_38624ee7.webp", circle: "follower", handle: "theopark", bio: "Outerwear obsessive." },
  { id: "f-noor", name: "Noor Haddad", initials: "NH", color: "bg-burgundy", avatarUrl: "/demo-profiles/openart-gpt-image-2-1_1785989205413_5dc0f4ba.webp", circle: "follower", handle: "noorhaddad", bio: "Apothecary + slow beauty." },
  { id: "f-quin", name: "Quinn Avery", initials: "QA", color: "bg-accent", avatarUrl: "/demo-profiles/openart-gpt-image-2-1_1785989224448_1e7e2012.webp", circle: "follower", handle: "quinnavery", bio: "Weekend market wanderer." },
  { id: "f-isla", name: "Isla Romero", initials: "IR", color: "bg-pink", circle: "follower", handle: "islaromero", bio: "Color, clay, and citrus." },

  // Suggested — people you don't follow yet (for discovery / follow demos)
  { id: "s-nina", name: "Nina Okafor", initials: "NO", color: "bg-burgundy", circle: "suggested", handle: "ninaokafor", bio: "Vintage finds and warm neutrals." },
  { id: "s-rafa", name: "Rafael Cruz", initials: "RC", color: "bg-accent", circle: "suggested", handle: "rafacruz", bio: "Leather goods and lasting basics." },
  { id: "s-yuki", name: "Yuki Tan", initials: "YT", color: "bg-pink", circle: "suggested", handle: "yukitan", bio: "Studio potter. Wabi-sabi everything." },
];

export function getInnerCircle(): Contact[] {
  return contacts.filter((c) => c.circle === "inner");
}

export function getFollowers(): Contact[] {
  return contacts.filter((c) => c.circle === "follower");
}

export function getContactById(id: string): Contact | undefined {
  return contacts.find((c) => c.id === id);
}

export function getContactByHandle(handle: string): Contact | undefined {
  return contacts.find((c) => c.handle === handle);
}
