// The Nice List's sense of humor, in one place.

/** Fake "audit" steps shown while names are drawn or a match is revealed. */
export const AUDIT_MESSAGES = [
  "Scanning group chat history…",
  "Evaluating last year's regifts…",
  "Checking if you thanked Grandma…",
  "Reviewing cookie consumption records…",
  "Bribing the elves…",
  "Consulting the reindeer…",
  "Checking the list twice…",
];

/** What North Pole HR says when someone asks for a redraw. */
export const REDRAW_DENIALS = [
  "Denied by North Pole HR.",
  "You get what you get and you don't throw a fit.",
  "Your request has been forwarded to the Elf Complaints Department (it's a shredder).",
  "Santa has reviewed your appeal. Santa says no.",
];

/** Anonymous reactions shoppers can leave on wish-list items. */
export const REACTIONS = [
  { key: "bold", emoji: "🫡", label: "Bold choice" },
  { key: "soldout", emoji: "🏃", label: "Sold out everywhere" },
  { key: "specific", emoji: "🧐", label: "Suspiciously specific" },
  { key: "approved", emoji: "🧝", label: "Elf-approved" },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]["key"];

export function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}
