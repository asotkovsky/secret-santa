"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, PhoneField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formObject, useAction } from "@/components/use-action";
import { createExchangeAction } from "../actions";
import { exchangeFormValues, ExchangeFields } from "../exchange-fields";

export function NewExchangeForm({ organizerName }: { organizerName: string }) {
  const router = useRouter();
  const { pending, run } = useAction();
  const [joining, setJoining] = useState(true);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = formObject(e.currentTarget);
    const me = joining ? { name: form.myName, phone: form.myPhone } : null;
    const result = await run(() => createExchangeAction(exchangeFormValues(form), me));
    if (result) router.push(`/exchanges/${result.exchangeId}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎄 The exchange</CardTitle>
        </CardHeader>
        <CardContent>
          <ExchangeFields />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="joining" className="text-base">
                🎅 I&apos;m taking part too
              </Label>
              <p className="text-sm text-muted-foreground">
                You&apos;ll get your own wish list and match. Matches stay hidden from you unless you choose to peek.
              </p>
            </div>
            <Switch id="joining" checked={joining} onCheckedChange={setJoining} className="mt-1" />
          </div>
          {joining && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                name="myName"
                label="Your name"
                hint="As the family will see it."
                required
                defaultValue={organizerName}
              />
              <PhoneField name="myPhone" label="Your mobile number" optional placeholder="555-555-5555" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          Create exchange
        </Button>
      </div>
    </form>
  );
}
