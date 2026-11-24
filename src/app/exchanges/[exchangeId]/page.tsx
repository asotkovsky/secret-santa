import { CalendarDays, CircleDollarSign, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireExchange } from "@/lib/access";
import { formatDay, formatMoney } from "@/lib/format";
import { getDashboard, needsReminder } from "@/server/exchanges";
import { DeleteExchange } from "./delete-exchange";
import { DetailsDialog } from "./details-dialog";
import { DrawCard } from "./draw-card";
import { ExclusionsCard } from "./exclusions-card";
import { PeopleCard, type PersonRow } from "./people-card";
import { Steps } from "./steps";
import { TextsCard } from "./texts-card";

export default async function ExchangePage({ params }: { params: Promise<{ exchangeId: string }> }) {
  const { exchangeId } = await params;
  const { exchange } = await requireExchange(exchangeId);
  const dash = await getDashboard(exchange);
  const drawn = Boolean(exchange.drawnAt);

  const people: PersonRow[] = dash.participants.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    token: p.token,
    isOrganizer: p.isOrganizer,
    inDraw: p.inDraw,
    invitedAt: p.invitedAt?.toISOString() ?? null,
    revealed: Boolean(p.revealedAt),
    itemCount: p.itemCount,
    needsReminder: needsReminder(drawn, p),
  }));
  const me = people.find((p) => p.isOrganizer);
  const names = new Map(people.map((p) => [p.id, p.name]));
  const withPhone = people.filter((p) => p.phone);
  // Gift helpers aren't in the draw.
  const drawers = people.filter((p) => p.inDraw);

  const facts = [
    exchange.budgetCents != null && { icon: CircleDollarSign, text: `${formatMoney(exchange.budgetCents)} limit` },
    exchange.exchangeOn && { icon: CalendarDays, text: `Exchange ${formatDay(exchange.exchangeOn)}` },
    exchange.wishlistDueOn && { icon: CalendarDays, text: `Lists due ${formatDay(exchange.wishlistDueOn)}` },
    exchange.revealDueOn && { icon: CalendarDays, text: `Reveal by ${formatDay(exchange.revealDueOn)}` },
  ].filter((f) => !!f);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href="/exchanges" className="text-sm text-muted-foreground hover:underline">
          ← Your exchanges
        </Link>
        <h1 className="text-3xl font-bold">{exchange.name}</h1>
        {facts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {facts.map((f) => (
              <span
                key={f.text}
                className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-sm ring-1 ring-border"
              >
                <f.icon className="size-4 text-pop" /> {f.text}
              </span>
            ))}
          </div>
        )}
        {exchange.details && <p className="max-w-2xl text-sm whitespace-pre-line">{exchange.details}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          <DetailsDialog exchange={exchange} />
          {me && (
            <Button asChild variant="outline">
              <a href={`/p/${me.token}`} target="_blank" rel="noreferrer">
                <ExternalLink /> {me.inDraw ? <>My wish list &amp; match</> : "My shopping page"}
              </a>
            </Button>
          )}
        </div>
      </div>

      <Steps
        steps={[
          { label: "Make the list", done: drawers.length >= 3, href: "#people" },
          { label: "Keep couples apart", done: dash.exclusions.length > 0, optional: true, href: "#apart" },
          { label: "Draw names", done: drawn, href: "#draw" },
          {
            label: "Send the links",
            done: withPhone.length > 0 && withPhone.every((p) => p.invitedAt),
            href: "#texts",
          },
        ]}
      />

      <div id="people" className="scroll-mt-4">
        <PeopleCard exchangeId={exchange.id} people={people} drawn={drawn} />
      </div>
      <div id="apart" className="scroll-mt-4">
        <ExclusionsCard
          exchangeId={exchange.id}
          people={drawers.map((p) => ({ id: p.id, name: p.name }))}
          pairs={dash.exclusions.map((e) => ({ id: e.id, a: names.get(e.a) ?? "?", b: names.get(e.b) ?? "?" }))}
          drawn={drawn}
        />
      </div>
      <div id="draw" className="scroll-mt-4">
        <DrawCard
          exchangeId={exchange.id}
          drawnAt={exchange.drawnAt?.toISOString() ?? null}
          count={drawers.length}
          revealedCount={drawers.filter((p) => p.revealed).length}
          organizerIsParticipant={Boolean(me)}
        />
      </div>
      <div id="texts" className="scroll-mt-4">
        <TextsCard
          exchangeId={exchange.id}
          people={people}
          texts={dash.texts.map((t) => ({
            id: t.id,
            name: (t.participantId && names.get(t.participantId)) || "Removed person",
            kind: t.kind,
            at: t.createdAt.toISOString(),
          }))}
        />
      </div>

      <DeleteExchange exchangeId={exchange.id} name={exchange.name} />
    </div>
  );
}
