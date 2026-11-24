import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { requireParticipant } from "@/lib/access";
import { firstName } from "@/lib/format";
import { getHome } from "@/server/wishlists";
import { ExchangeFacts, ExchangeHeader } from "./header";
import { MatchCard } from "./match-card";
import { MyList } from "./my-list";

export const metadata: Metadata = { title: "Your page" };

export default async function ParticipantHome({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ctx = await requireParticipant(token);
  const { participant, exchange } = ctx;
  const home = await getHome(ctx);

  return (
    <div className="min-h-dvh">
      <ExchangeHeader token={token} exchange={exchange} />
      <main className="mx-auto max-w-3xl space-y-10 px-4 pt-8 pb-6 sm:px-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Hi {firstName(participant.name)}! 🎄</h1>
          <ExchangeFacts exchange={exchange} />
        </div>

        <MatchCard token={token} drawn={Boolean(exchange.drawnAt)} match={home.match} />

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Your wish list</h2>
            <p className="text-sm text-muted-foreground">
              Everyone on the Nice List can see it. You&apos;ll never see whether something&apos;s been bought, so the
              surprise stays safe.
            </p>
          </div>
          <MyList token={token} items={home.myItems} />
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Everyone on the Nice List</h2>
            <p className="text-sm text-muted-foreground">
              Buying something? Tap &ldquo;I bought this&rdquo; so nobody else gets the same thing.
            </p>
          </div>
          {home.others.length === 0 ? (
            <p className="rounded-xl bg-muted/60 py-6 text-center text-sm text-muted-foreground">
              No one else has joined yet.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {home.others.map((p) => {
                const isMatch = home.match?.id === p.id;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/p/${token}/lists/${p.id}`}
                      className={`flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3.5 transition-colors hover:border-brand/40 active:bg-muted ${isMatch ? "border-brand/50 ring-2 ring-brand/15" : ""}`}
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 font-semibold">
                          {p.name}
                          {isMatch && <Badge>🎁 Your match</Badge>}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {p.itemCount === 0
                            ? "No ideas yet"
                            : `${p.itemCount} ${p.itemCount === 1 ? "idea" : "ideas"}`}
                        </span>
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
