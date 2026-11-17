import { Field, TextareaField } from "@/components/form-field";

export type ExchangeDefaults = {
  name?: string;
  budget?: string;
  wishlistDueOn?: string | null;
  revealDueOn?: string | null;
  exchangeOn?: string | null;
  details?: string | null;
};

/** The exchange's settings, used when creating and editing one. */
export function ExchangeFields({ defaults = {} }: { defaults?: ExchangeDefaults }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field
        name="name"
        label="Exchange name"
        required
        maxLength={100}
        placeholder="e.g. Family Christmas 2026"
        defaultValue={defaults.name}
        className="sm:col-span-2"
      />
      <Field
        name="budget"
        label="Spending limit per gift ($)"
        optional
        type="number"
        min={0}
        inputMode="decimal"
        placeholder="e.g. 50"
        defaultValue={defaults.budget}
      />
      <Field
        name="exchangeOn"
        label="Gift exchange day"
        optional
        type="date"
        defaultValue={defaults.exchangeOn ?? ""}
      />
      <Field
        name="wishlistDueOn"
        label="Wish lists due"
        optional
        type="date"
        hint="Reminders nudge anyone whose list is still empty."
        defaultValue={defaults.wishlistDueOn ?? ""}
      />
      <Field
        name="revealDueOn"
        label="Reveal matches by"
        optional
        type="date"
        hint="Reminders nudge anyone who hasn't looked yet."
        defaultValue={defaults.revealDueOn ?? ""}
      />
      <TextareaField
        name="details"
        label="Details for everyone"
        optional
        placeholder="e.g. Christmas Eve at Grandma's, 4pm. Wrap your gift and add a name tag!"
        maxLength={1000}
        rows={3}
        defaultValue={defaults.details ?? ""}
        className="sm:col-span-2"
      />
    </div>
  );
}

export function exchangeFormValues(form: Record<string, string>) {
  const { name, budget, wishlistDueOn, revealDueOn, exchangeOn, details } = form;
  return { name, budget, wishlistDueOn, revealDueOn, exchangeOn, details };
}
