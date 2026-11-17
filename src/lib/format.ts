import { format, parseISO } from "date-fns";

/** "2026-12-25" → "Fri, Dec 25". */
export function formatDay(iso: string | null | undefined, pattern = "EEE, MMM d") {
  return iso ? format(parseISO(iso), pattern) : null;
}

/** 2500 → "$25" (cents shown only when there are some). */
export function formatMoney(cents: number | null | undefined) {
  if (cents == null) return null;
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
  });
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
