"use client";

import { Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formObject, useAction } from "@/components/use-action";
import type { ExchangeRow } from "@/lib/access";
import { exchangeFormValues, ExchangeFields } from "../exchange-fields";
import { updateExchangeAction } from "./actions";

export function DetailsDialog({ exchange }: { exchange: ExchangeRow }) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useAction();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = exchangeFormValues(formObject(e.currentTarget));
    if (await run(() => updateExchangeAction(exchange.id, values), "Saved")) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings /> Edit details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Exchange details</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <ExchangeFields
            defaults={{
              name: exchange.name,
              budget: exchange.budgetCents != null ? String(exchange.budgetCents / 100) : "",
              wishlistDueOn: exchange.wishlistDueOn,
              revealDueOn: exchange.revealDueOn,
              exchangeOn: exchange.exchangeOn,
              details: exchange.details,
            }}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
