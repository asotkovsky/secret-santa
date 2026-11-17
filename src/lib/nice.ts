/**
 * A tongue-in-cheek badge for people who've made a wish list. Null for everyone else, who get
 * no badge (the dashboard's plain-language summary says what they still need to do).
 */
export type NiceStatus = { label: string; emoji: string; tone: "nice" | "bribe"; hint: string };

export function niceStatus(drawn: boolean, itemCount: number, revealed: boolean): NiceStatus | null {
  if (itemCount === 0) return null;
  if (revealed || !drawn) {
    return { label: "Confirmed Nice", emoji: "⭐", tone: "nice", hint: drawn ? "List done, match seen" : "Wish list done" };
  }
  return { label: "Bribery Accepted", emoji: "🎁", tone: "bribe", hint: "List done, hasn't seen their match yet" };
}

export const NICE_TONE_CLASSES: Record<NiceStatus["tone"], string> = {
  nice: "bg-pop-soft text-pop",
  bribe: "bg-gold-soft text-[#7a5a0c]",
};
