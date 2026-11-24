"use client";

import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/components/use-action";
import { markPurchasedAction, unmarkPurchasedAction } from "../../actions";

export function PurchaseButton({
  token,
  itemId,
  purchasedByMe,
}: {
  token: string;
  itemId: string;
  purchasedByMe: boolean;
}) {
  const { pending, run } = useAction();
  return purchasedByMe ? (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      disabled={pending}
      onClick={() => run(() => unmarkPurchasedAction(token, itemId), "Unmarked. It's back on the list.")}
    >
      <Undo2 /> Undo
    </Button>
  ) : (
    <Button
      variant="secondary"
      size="sm"
      className="w-full bg-pop-soft text-pop hover:bg-pop-soft/70"
      disabled={pending}
      onClick={() => run(() => markPurchasedAction(token, itemId), "Marked as bought. Mum's the word 🤫")}
    >
      <Check /> I bought this
    </Button>
  );
}
