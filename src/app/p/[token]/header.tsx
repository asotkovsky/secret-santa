import { SiteHeader } from "@/components/brand";
import type { ExchangeRow } from "@/lib/access";
import { formatDay, formatMoney } from "@/lib/format";

export function ExchangeHeader({ token, exchange }: { token: string; exchange: ExchangeRow }) {
  return <SiteHeader href={`/p/${token}`} title={exchange.name} />;
}

export function ExchangeFacts({ exchange }: { exchange: ExchangeRow }) {
  const facts = [
    exchange.budgetCents != null && { emoji: "💰", label: "Spending limit", value: formatMoney(exchange.budgetCents) },
    exchange.exchangeOn && { emoji: "🎁", label: "Gift exchange", value: formatDay(exchange.exchangeOn) },
    exchange.wishlistDueOn && { emoji: "📝", label: "Wish list due", value: formatDay(exchange.wishlistDueOn) },
    exchange.revealDueOn && { emoji: "👀", label: "Reveal by", value: formatDay(exchange.revealDueOn) },
  ].filter((f) => !!f);

  if (!facts.length && !exchange.details) return null;
  return (
    <section className="space-y-3">
      {facts.length > 0 && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="rounded-xl border bg-card px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">
                <span aria-hidden>{f.emoji}</span> {f.label}
              </dt>
              <dd className="font-semibold">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {exchange.details && (
        <p className="rounded-xl border border-gold/40 bg-gold-soft/50 px-4 py-3 text-sm whitespace-pre-line">
          {exchange.details}
        </p>
      )}
    </section>
  );
}
