"use client";

import { Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { useAction } from "@/components/use-action";
import { deleteExchangeAction } from "./actions";

export function DeleteExchange({ exchangeId, name }: { exchangeId: string; name: string }) {
  const { pending, run } = useAction();
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-destructive/25 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-sans text-base font-semibold">Delete this exchange</h2>
        <p className="text-sm text-muted-foreground">
          Cancels Christmas: wish lists, the draw and all links, for good.
        </p>
      </div>
      <ConfirmButton
        title={`Delete "${name}"?`}
        description="Everyone's wish lists, the draw and all links will be gone. This can't be undone."
        confirmLabel="Delete exchange"
        onConfirm={() => run(() => deleteExchangeAction(exchangeId))}
      >
        <Button variant="destructive" disabled={pending}>
          <Trash2 /> Delete exchange
        </Button>
      </ConfirmButton>
    </section>
  );
}
