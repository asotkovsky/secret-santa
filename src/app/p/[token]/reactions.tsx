"use client";

import { useState } from "react";
import { useAction } from "@/components/use-action";
import { REACTIONS } from "@/lib/jokes";
import { cn } from "@/lib/utils";
import { toggleReactionAction } from "./actions";

type Counts = { key: string; count: number; mine: boolean }[];

/**
 * Anonymous reactions on a wish-list item. Shoppers tap to toggle theirs; the item's owner
 * (`readOnly`) just sees the counts, never who reacted.
 */
export function Reactions({
  token,
  itemId,
  initial,
  readOnly = false,
}: {
  token: string;
  itemId: string;
  initial: Counts;
  readOnly?: boolean;
}) {
  const { run } = useAction();
  const [counts, setCounts] = useState(initial);

  if (readOnly) {
    if (!counts.length) return null;
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">Anonymous elves say:</span>
        {REACTIONS.filter((r) => counts.some((c) => c.key === r.key)).map((r) => (
          <span key={r.key} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
            {r.emoji} {r.label}
            <span className="font-semibold">{counts.find((c) => c.key === r.key)!.count}</span>
          </span>
        ))}
      </div>
    );
  }

  async function toggle(key: string) {
    const before = counts;
    const current = counts.find((c) => c.key === key);
    const next = current
      ? counts
          .map((c) => (c.key === key ? { ...c, mine: !c.mine, count: c.count + (c.mine ? -1 : 1) } : c))
          .filter((c) => c.count > 0)
      : [...counts, { key, count: 1, mine: true }];
    setCounts(next);
    if (!(await run(() => toggleReactionAction(token, itemId, key)))) setCounts(before);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {REACTIONS.map((r) => {
        const c = counts.find((x) => x.key === r.key);
        return (
          <button
            key={r.key}
            type="button"
            aria-pressed={c?.mine ?? false}
            onClick={() => toggle(r.key)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs whitespace-nowrap transition-colors",
              c?.mine ? "border-brand/40 bg-brand-soft text-brand-ink" : "bg-background hover:bg-muted",
            )}
          >
            <span aria-hidden>{r.emoji}</span> {r.label}
            {c && <span className="font-semibold">{c.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
