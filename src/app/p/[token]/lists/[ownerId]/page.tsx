import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteFooter } from "@/components/brand";
import { isUuid, requireParticipant } from "@/lib/access";
import { formatMoney } from "@/lib/format";
import { getMatch, getOthersList } from "@/server/wishlists";
import { ExchangeHeader } from "../../header";
import { ItemCard, ItemGrid, ItemTag } from "../../item-card";
import { PurchaseButton } from "./purchase-button";

export const metadata: Metadata = { title: "Wish list" };

export default async function OthersListPage({ params }: { params: Promise<{ token: string; ownerId: string }> }) {
  const { token, ownerId } = await params;
  const ctx = await requireParticipant(token);
  if (!isUuid(ownerId)) notFound();
  // Your own list lives on your home page, which never shows purchases.
  if (ownerId === ctx.participant.id) redirect(`/p/${token}`);
  const list = await getOthersList(ctx, ownerId);
  if (!list) notFound();
  const match = ctx.participant.revealedAt ? await getMatch(ctx.participant.id) : null;
  const isMatch = match?.id === ownerId;
  const budget = formatMoney(ctx.exchange.budgetCents);

  // Ideas still up for grabs first; bought ones sink to the bottom, greyed out.
  const items = [...list.items].sort((a, b) => Number(a.purchased) - Number(b.purchased));
  const open = items.filter((i) => !i.purchased).length;

  return (
    <div className="min-h-dvh">
      <ExchangeHeader token={token} exchange={ctx.exchange} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 pt-8 pb-6 sm:px-6">
        <div className="space-y-2">
          <Link href={`/p/${token}`} className="text-sm text-muted-foreground hover:underline">
            ← Back to my page
          </Link>
          <h1 className="text-3xl font-bold">{list.owner.name}&apos;s wish list</h1>
          {isMatch && (
            <p className="rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm">
              🎁 <strong>You&apos;re {list.owner.name}&apos;s Secret Santa!</strong>
              {budget ? ` Remember the ${budget} limit.` : ""}
            </p>
          )}
          {items.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {open === 0
                ? "Everything here has been bought! Santa's sleigh is full."
                : `${open} of ${items.length} ${items.length === 1 ? "idea" : "ideas"} still up for grabs.`}{" "}
              🤫 {list.owner.name} can&apos;t see what&apos;s been bought.
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gold/50 bg-card p-8 text-center text-muted-foreground">
            <p className="text-3xl" aria-hidden>
              🧦
            </p>
            <p className="mt-2 font-semibold text-foreground">Living dangerously: no wish list added.</p>
            <p className="mt-1">Enjoy your novelty socks, {list.owner.name}. (Or check back soon.)</p>
          </div>
        ) : (
          <ItemGrid wide>
            {items.map((item) => (
              <ItemCard
                key={item.id}
                token={token}
                item={item}
                dimmed={item.purchased}
                tag={item.purchased && <ItemTag>✓ {item.purchasedByMe ? "You bought this" : "Bought"}</ItemTag>}
                footer={
                  !item.purchased || item.purchasedByMe ? (
                    <PurchaseButton token={token} itemId={item.id} purchasedByMe={item.purchasedByMe} />
                  ) : (
                    <p className="py-1.5 text-center text-xs text-muted-foreground">Someone got this one</p>
                  )
                }
              />
            ))}
          </ItemGrid>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
