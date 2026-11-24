"use client";

import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/components/use-action";
import type { ActionResult } from "@/server/action";

/**
 * "I bought this" / "Undo" under an item. `mark` and `unmark` are server actions already bound to
 * the link and item, so the same button works on personal links and guest links.
 */
export function PurchaseButton({
  purchasedByMe,
  mark,
  unmark,
}: {
  purchasedByMe: boolean;
  mark: () => Promise<ActionResult>;
  unmark: () => Promise<ActionResult>;
}) {
  const { pending, run } = useAction();
  return purchasedByMe ? (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      disabled={pending}
      onClick={() => run(unmark, "Unmarked. It's back on the list.")}
    >
      <Undo2 /> Undo
    </Button>
  ) : (
    <Button
      variant="secondary"
      size="sm"
      className="w-full bg-pop-soft text-pop hover:bg-pop-soft/70"
      disabled={pending}
      onClick={() => run(mark, "Marked as bought. Mum's the word 🤫")}
    >
      <Check /> I bought this
    </Button>
  );
}
