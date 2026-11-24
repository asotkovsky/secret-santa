// Guest links: a participant can share their wish list with anyone (a friend, a grandparent
// without a phone number on the list...) through /g/<shareToken>. Guests are anonymous. They see
// the list and which items are already taken, and can mark things bought. Anyone on a guest link
// can undo a purchase made through a guest link (not one a participant made), so a mistaken mark
// can still be fixed from another device or after clearing the browser.
//
// PURCHASE SECRECY: the owner shares the link themselves, so they may open it too. Their browser
// remembers the personal links it has opened (see src/lib/guest-cookies.ts); when one of those
// is the list's owner, the guest page shows their plain list with no purchase information, and
// marking is refused.
import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { exchanges, itemPhotos, participants, purchases, wishlistItems } from "@/db/schema";
import { isUuid, type ParticipantCtx } from "@/lib/access";
import {
  GUEST_COOKIE,
  guestCookieOptions,
  isGuestToken,
  readViewerTokens,
  VIEWER_COOKIE,
} from "@/lib/guest-cookies";
import { newToken, UserError } from "./core";
import { appUrl } from "./links";
import { itemColumns, ownerItems } from "./wishlists";

/** This participant's guest link, made the first time it's asked for. Gift helpers have none. */
export async function guestLink({ participant }: ParticipantCtx) {
  if (!participant.inDraw) return null;
  let shareToken = participant.shareToken;
  if (!shareToken) {
    const [row] = await db
      .update(participants)
      .set({ shareToken: newToken() })
      .where(and(eq(participants.id, participant.id), isNull(participants.shareToken)))
      .returning({ shareToken: participants.shareToken });
    // Lost a race with another tab: use the one that was saved.
    shareToken =
      row?.shareToken ??
      (await db.select({ t: participants.shareToken }).from(participants).where(eq(participants.id, participant.id)))[0]
        .t;
  }
  return `${await appUrl()}/g/${shareToken}`;
}

/** The owner and exchange behind a guest link, or null for an unknown one. */
async function findShared(shareToken: string) {
  if (!isGuestToken(shareToken)) return null;
  const [row] = await db
    .select({ owner: { id: participants.id, name: participants.name }, exchange: exchanges })
    .from(participants)
    .innerJoin(exchanges, eq(exchanges.id, participants.exchangeId))
    .where(and(eq(participants.shareToken, shareToken), eq(participants.inDraw, true)));
  return row ?? null;
}

/** Whether the person looking is the list's owner (see the note at the top). */
async function viewerIsOwner(ownerId: string) {
  const tokens = readViewerTokens((await cookies()).get(VIEWER_COOKIE)?.value);
  if (!tokens.length) return false;
  const [row] = await db
    .select({ id: participants.id })
    .from(participants)
    .where(and(eq(participants.id, ownerId), inArray(participants.token, tokens)));
  return Boolean(row);
}

async function currentGuestId() {
  const id = (await cookies()).get(GUEST_COOKIE)?.value;
  return isGuestToken(id) ? id : null;
}

/**
 * A list through its guest link. For a guest: each item with whether it's taken, whether they
 * took it, and whether a guest took it (so it can be undone here). For the list's owner (`isOwner`): their own items, with no purchase information.
 */
export async function getGuestList(shareToken: string) {
  const row = await findShared(shareToken);
  if (!row) return null;
  if (await viewerIsOwner(row.owner.id)) {
    return { ...row, isOwner: true as const, items: await ownerItems(row.owner.id) };
  }
  const guestId = await currentGuestId();
  const rows = await db
    .select({ ...itemColumns, purchaseId: purchases.itemId, guestId: purchases.guestId })
    .from(wishlistItems)
    .leftJoin(itemPhotos, eq(itemPhotos.itemId, wishlistItems.id))
    .leftJoin(purchases, eq(purchases.itemId, wishlistItems.id))
    .where(eq(wishlistItems.participantId, row.owner.id))
    .orderBy(asc(wishlistItems.sortOrder), asc(wishlistItems.createdAt));
  // Don't send who bought it, just whether it's taken, and whether by this guest or any guest.
  const items = rows.map(({ purchaseId, guestId: buyer, ...item }) => ({
    ...item,
    purchased: purchaseId !== null,
    purchasedByMe: guestId !== null && buyer === guestId,
    purchasedByGuest: buyer !== null,
  }));
  return { ...row, isOwner: false as const, items };
}

/** Checks the item is on this guest link's list, and the viewer isn't the list's owner. */
async function assertGuestCanShop(shareToken: string, itemId: string) {
  const row = await findShared(shareToken);
  if (!row || !isUuid(itemId)) throw new UserError("Item not found.");
  if (await viewerIsOwner(row.owner.id)) throw new UserError("That's your own list.");
  const [item] = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(and(eq(wishlistItems.id, itemId), eq(wishlistItems.participantId, row.owner.id)));
  if (!item) throw new UserError("Item not found.");
}

export async function guestMarkPurchased(shareToken: string, itemId: string) {
  await assertGuestCanShop(shareToken, itemId);
  let guestId = await currentGuestId();
  if (!guestId) {
    guestId = randomBytes(24).toString("base64url");
    (await cookies()).set(GUEST_COOKIE, guestId, guestCookieOptions);
  }
  const inserted = await db
    .insert(purchases)
    .values({ itemId, guestId })
    .onConflictDoNothing()
    .returning({ itemId: purchases.itemId });
  if (!inserted.length) {
    const [existing] = await db.select().from(purchases).where(eq(purchases.itemId, itemId));
    if (existing?.guestId !== guestId) throw new UserError("Someone else already got this one.");
  }
  return { itemId };
}

/** Undoes a purchase made through a guest link, by any guest. Participants' purchases stay put. */
export async function guestUnmarkPurchased(shareToken: string, itemId: string) {
  await assertGuestCanShop(shareToken, itemId);
  const removed = await db
    .delete(purchases)
    .where(and(eq(purchases.itemId, itemId), isNotNull(purchases.guestId)))
    .returning({ itemId: purchases.itemId });
  if (!removed.length) {
    const [existing] = await db.select().from(purchases).where(eq(purchases.itemId, itemId));
    if (existing) throw new UserError("Someone on the Nice List bought this one, so only they can undo it.");
  }
  return { itemId };
}

/** A photo on a guest link's list. Only photos on that one list are reachable. */
export async function guestPhotoResponse(shareToken: string, photoId: string) {
  const row = await findShared(shareToken);
  if (!row || !isUuid(photoId)) return new Response("Not found", { status: 404 });
  const [photo] = await db
    .select({ contentType: itemPhotos.contentType, data: itemPhotos.data })
    .from(itemPhotos)
    .innerJoin(wishlistItems, eq(wishlistItems.id, itemPhotos.itemId))
    .where(and(eq(itemPhotos.id, photoId), eq(wishlistItems.participantId, row.owner.id)));
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
