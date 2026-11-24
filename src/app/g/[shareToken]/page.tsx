import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/brand";
import { firstName } from "@/lib/format";
import { getGuestList } from "@/server/guests";
import { ItemCard, ItemGrid, ItemTag } from "../../p/[token]/item-card";
import { PurchaseButton } from "../../p/[token]/lists/[ownerId]/purchase-button";
import { guestMarkAction, guestUnmarkAction } from "./actions";

export const metadata: Metadata = { title: "Wish list" };

// A wish list opened through its owner's guest link. Guests can mark things bought; the owner,
// if they open their own link, just sees their list with no purchase information.
export default async function GuestList({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;
  const list = await getGuestList(shareToken);
  if (!list) notFound();
  const first = firstName(list.owner.name);
  const photoBase = `/g/${shareToken}`;

  let intro = "";
  let grid: React.ReactNode = null;
  if (list.isOwner) {
    intro =
      "This is your guest link. Anyone you share it with can see your list and mark what they buy. You won't see what's been bought here either, so the surprise stays safe.";
    grid = list.items.map((item) => <ItemCard key={item.id} photoBase={photoBase} item={item} />);
  } else if (list.items.length > 0) {
    // Ideas still up for grabs first; bought ones sink to the bottom, greyed out.
    const items = [...list.items].sort((a, b) => Number(a.purchased) - Number(b.purchased));
    const open = items.filter((i) => !i.purchased).length;
    intro = `${
      open === 0
        ? "Everything here has been bought! Santa's sleigh is full."
        : `${open} of ${items.length} ${items.length === 1 ? "idea" : "ideas"} still up for grabs. Buying something? Tap “I bought this” so nobody else gets the same thing.`
    } 🤫 ${first} can't see what's been bought.`;
    grid = items.map((item) => (
      <ItemCard
        key={item.id}
        photoBase={photoBase}
        item={item}
        dimmed={item.purchased}
        tag={
          item.purchased && (
            <ItemTag>
              ✓ {item.purchasedByMe ? "You bought this" : item.purchasedByGuest ? "Bought by a guest" : "Bought"}
            </ItemTag>
          )
        }
        footer={
          // Any guest can undo a guest's purchase (e.g. a mistake made on another device).
          !item.purchased || item.purchasedByGuest ? (
            <PurchaseButton
              purchasedByMe={item.purchased}
              mark={guestMarkAction.bind(null, shareToken, item.id)}
              unmark={guestUnmarkAction.bind(null, shareToken, item.id)}
            />
          ) : (
            <p className="py-1.5 text-center text-xs text-muted-foreground">Someone got this one</p>
          )
        }
      />
    ));
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader href={photoBase} title={list.exchange.name} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 pt-8 pb-6 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{list.owner.name}&apos;s wish list 🎄</h1>
          {intro && <p className="text-sm text-muted-foreground">{intro}</p>}
        </div>
        {list.items.length === 0 ? (
          <p className="rounded-xl bg-muted/60 py-8 text-center text-sm text-muted-foreground">
            {list.isOwner
              ? "Your list is empty. Add some gift ideas on your own page first."
              : `${first} hasn't added any gift ideas yet. Check back soon!`}
          </p>
        ) : (
          <ItemGrid wide>{grid}</ItemGrid>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
