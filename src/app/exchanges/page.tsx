import { CalendarDays, ChevronRight, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/access";
import { firstName, formatDay } from "@/lib/format";
import { listExchanges } from "@/server/exchanges";

export default async function ExchangesPage() {
  const user = await requireUser();
  const rows = await listExchanges(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Ho ho ho, {firstName(user.name)}!</p>
          <h1 className="text-3xl font-bold">Your Nice Lists</h1>
        </div>
        {rows.length > 0 && (
          <Button asChild>
            <Link href="/exchanges/new">
              <Plus /> New exchange
            </Link>
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gold/60 bg-card p-8 text-center sm:p-12">
          <p className="text-5xl" aria-hidden>
            🎄
          </p>
          <h2 className="mt-4 text-2xl font-bold">Time to make a list</h2>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
            (And check it twice.) Add your family, keep the couples apart, and draw names. About five minutes, no elves
            required.
          </p>
          <Button asChild className="mt-6">
            <Link href="/exchanges/new">
              <Plus /> Start a Nice List
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((x) => (
            <li key={x.id}>
              <Link
                href={`/exchanges/${x.id}`}
                className="flex items-center gap-3 rounded-2xl border bg-card p-5 transition-colors hover:border-brand/40 active:bg-muted"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{x.name}</h2>
                    {x.drawnAt ? (
                      <Badge className="bg-pop text-white">Names drawn</Badge>
                    ) : (
                      <Badge variant="secondary">Setting up</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4" /> {x.participantCount} {x.participantCount === 1 ? "person" : "people"}
                    </span>
                    {x.exchangeOn && (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-4" /> {formatDay(x.exchangeOn, "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
