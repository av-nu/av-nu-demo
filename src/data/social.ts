// Lightweight mock social graph for the demo. There is no backend, so the
// "current user", their inner circle, and followers are all simulated here.

export type Contact = {
  id: string;
  name: string;
  initials: string;
  /** Tailwind background class used for the avatar chip. */
  color: string;
  circle: "inner" | "follower";
};

export const currentUser = {
  id: "me",
  name: "You",
  initials: "Y",
};

export const contacts: Contact[] = [
  // Inner circle — people you share private lists with
  { id: "c-mara", name: "Mara Ellis", initials: "ME", color: "bg-pink", circle: "inner" },
  { id: "c-jonah", name: "Jonah Reed", initials: "JR", color: "bg-accent", circle: "inner" },
  { id: "c-priya", name: "Priya Nair", initials: "PN", color: "bg-burgundy", circle: "inner" },
  { id: "c-leo", name: "Leo Watanabe", initials: "LW", color: "bg-pink", circle: "inner" },
  { id: "c-sof", name: "Sofia Marin", initials: "SM", color: "bg-accent", circle: "inner" },
  { id: "c-deni", name: "Deni Carter", initials: "DC", color: "bg-burgundy", circle: "inner" },

  // Followers — can see your public lists only
  { id: "f-aria", name: "Aria Blume", initials: "AB", color: "bg-accent", circle: "follower" },
  { id: "f-theo", name: "Theo Park", initials: "TP", color: "bg-pink", circle: "follower" },
  { id: "f-noor", name: "Noor Haddad", initials: "NH", color: "bg-burgundy", circle: "follower" },
  { id: "f-quin", name: "Quinn Avery", initials: "QA", color: "bg-accent", circle: "follower" },
  { id: "f-isla", name: "Isla Romero", initials: "IR", color: "bg-pink", circle: "follower" },
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
