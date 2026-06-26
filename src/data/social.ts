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
};

export const contacts: Contact[] = [
  // Inner circle — people you share private lists with
  { id: "c-mara", name: "Mara Ellis", initials: "ME", color: "bg-pink", circle: "inner", handle: "maraellis", bio: "Slow living + ceramics. Always reaching for something handmade." },
  { id: "c-jonah", name: "Jonah Reed", initials: "JR", color: "bg-accent", circle: "inner", handle: "jonahreed", bio: "Gift-giver in chief. Coffee, denim, and good design." },
  { id: "c-priya", name: "Priya Nair", initials: "PN", color: "bg-burgundy", circle: "inner", handle: "priyanair", bio: "Home stylist. Housewarmings are my love language." },
  { id: "c-leo", name: "Leo Watanabe", initials: "LW", color: "bg-pink", circle: "inner", handle: "leowat", bio: "Minimalist with a soft spot for textiles." },
  { id: "c-sof", name: "Sofia Marin", initials: "SM", color: "bg-accent", circle: "inner", handle: "sofiamarin", bio: "Travel, packing lists, and the perfect tote." },
  { id: "c-deni", name: "Deni Carter", initials: "DC", color: "bg-burgundy", circle: "inner", handle: "denicarter", bio: "Maker. Plant person. Candle hoarder." },

  // Followers — can see your public lists only
  { id: "f-aria", name: "Aria Blume", initials: "AB", color: "bg-accent", circle: "follower", handle: "ariablume", bio: "Layering staples and cozy knits." },
  { id: "f-theo", name: "Theo Park", initials: "TP", color: "bg-pink", circle: "follower", handle: "theopark", bio: "Outerwear obsessive." },
  { id: "f-noor", name: "Noor Haddad", initials: "NH", color: "bg-burgundy", circle: "follower", handle: "noorhaddad", bio: "Apothecary + slow beauty." },
  { id: "f-quin", name: "Quinn Avery", initials: "QA", color: "bg-accent", circle: "follower", handle: "quinnavery", bio: "Weekend market wanderer." },
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
