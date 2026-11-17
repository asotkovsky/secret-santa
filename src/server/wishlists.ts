// Participant-side services. Callers must have resolved the personal link (requireParticipant).
//
// PURCHASE SECRECY: whether an item was bought must never reach the person whose list it is on.
// `ownerItems` never touches the purchases table; only `shopperItems` does, and it is only ever
// called for a list that isn't the viewer's own.
import "server-only";
import { and, asc, count, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assignments, exchanges, itemPhotos, itemReactions, participants, purchases, wishlistItems } from "@/db/schema";
import type { ParticipantCtx } from "@/lib/access";
import { REACTIONS } from "@/lib/jokes";
import { optText, UserError } from "./core";

// ---- Home ----

export async function getHome({ participant, exchange }: ParticipantCtx) {
  const [people, mine, match] = await Promise.all([
    db
      .select({
        id: participants.id,
        name: participants.name,
        isOrganizer: participants.isOrganizer,
        revealed: sql<boolean>`${participants.revealedAt} is not null`,
        itemCount: count(wishlistItems.id),
      })
      .from(participants)
      .leftJoin(wishlistItems, eq(wishlistItems.participantId, participants.id))
      .where(and(eq(participants.exchangeId, exchange.id), ne(participants.id, participant.id)))
      .groupBy(participants.id)
      .orderBy(asc(participants.name)),
    ownerItems(participant.id),
    // The match is only sent to the page once revealed, so it can't be read early from the HTML.
    participant.revealedAt ? getMatch(participant.id) : Promise.resolve(null),
  ]);
  return { others: people, myItems: mine, match };
}

export async function getMatch(giverId: string) {
  const [row] = await db
    .select({ id: participants.id, name: participants.name })
    .from(assignments)
    .innerJoin(participants, eq(participants.id, assignments.receiverId))
    .where(eq(assignments.giverId, giverId));
  return row ?? null;
}

/** Reveals (and records that this person has seen) who they're buying for. */
export async function reveal({ participant, exchange }: ParticipantCtx) {
  if (!exchange.drawnAt) throw new UserError("Names haven't been drawn yet. Check back soon!");
  const match = await getMatch(participant.id);
  if (!match) throw new UserError("Names haven't been drawn yet. Check back soon!");
  if (!participant.revealedAt) {
    await db.update(participants).set({ revealedAt: new Date() }).where(eq(participants.id, participant.id));
  }
  return match;
}

// ---- Lists ----

const photoColumns = { photoId: itemPhotos.id, photoWidth: itemPhotos.width, photoHeight: itemPhotos.height };
const itemColumns = {
  id: wishlistItems.id,
  name: wishlistItems.name,
  links: wishlistItems.links,
  notes: wishlistItems.notes,
  ...photoColumns,
};

export type ReactionCount = { key: string; count: number; mine: boolean };

/** Anonymous reaction counts per item, plus which ones the viewer left. Never who reacted. */
async function reactionsFor(itemIds: string[], viewerId: string) {
  const byItem = new Map<string, ReactionCount[]>();
  if (!itemIds.length) return byItem;
  const rows = await db
    .select({
      itemId: itemReactions.itemId,
      reaction: itemReactions.reaction,
      count: count(),
      mine: sql<boolean>`bool_or(${itemReactions.participantId} = ${viewerId})`,
    })
    .from(itemReactions)
    .where(inArray(itemReactions.itemId, itemIds))
    .groupBy(itemReactions.itemId, itemReactions.reaction);
  for (const r of rows) {
    const list = byItem.get(r.itemId) ?? [];
    list.push({ key: r.reaction, count: r.count, mine: r.mine });
    byItem.set(r.itemId, list);
  }
  return byItem;
}

/** Items as their owner sees them: no purchase information at all. */
async function ownerItems(ownerId: string) {
  const rows = await db
    .select(itemColumns)
    .from(wishlistItems)
    .leftJoin(itemPhotos, eq(itemPhotos.itemId, wishlistItems.id))
    .where(eq(wishlistItems.participantId, ownerId))
    .orderBy(asc(wishlistItems.sortOrder), asc(wishlistItems.createdAt));
  const reactions = await reactionsFor(
    rows.map((r) => r.id),
    ownerId,
  );
  return rows.map((item) => ({ ...item, reactions: reactions.get(item.id) ?? [] }));
}

/** Items as other shoppers see them: whether each is bought, and whether by the viewer. */
async function shopperItems(ownerId: string, viewerId: string) {
  const rows = await db
    .select({ ...itemColumns, buyerId: purchases.buyerId })
    .from(wishlistItems)
    .leftJoin(itemPhotos, eq(itemPhotos.itemId, wishlistItems.id))
    .leftJoin(purchases, eq(purchases.itemId, wishlistItems.id))
    .where(eq(wishlistItems.participantId, ownerId))
    .orderBy(asc(wishlistItems.sortOrder), asc(wishlistItems.createdAt));
  const reactions = await reactionsFor(
    rows.map((r) => r.id),
    viewerId,
  );
  // Don't send who bought it, just whether it's taken and whether it was you.
  return rows.map(({ buyerId, ...item }) => ({
    ...item,
    reactions: reactions.get(item.id) ?? [],
    purchased: buyerId !== null,
    purchasedByMe: buyerId === viewerId,
  }));
}

export type OwnerItem = Awaited<ReturnType<typeof ownerItems>>[number];
export type ShopperItem = Awaited<ReturnType<typeof shopperItems>>[number];

/** Someone else's list, for shopping. */
export async function getOthersList({ participant, exchange }: ParticipantCtx, ownerId: string) {
  if (ownerId === participant.id) throw new UserError("That's your own list.");
  const [owner] = await db
    .select({ id: participants.id, name: participants.name })
    .from(participants)
    .where(and(eq(participants.id, ownerId), eq(participants.exchangeId, exchange.id)));
  if (!owner) return null;
  return { owner, items: await shopperItems(owner.id, participant.id) };
}

// ---- Editing your own list ----

const MAX_ITEMS = 50;

export const itemInput = z.object({
  name: z.string().trim().min(1, "Give the item a name.").max(200),
  links: z
    .array(z.string().trim())
    .max(5, "Add up to 5 links.")
    .transform((links) => links.filter(Boolean).map(withScheme))
    .pipe(z.array(z.url({ protocol: /^https?$/, error: "Links must be web addresses (https://…)." }))),
  notes: optText(1000),
});

/** "amazon.com/x" → "https://amazon.com/x", so people can paste links without the prefix. */
function withScheme(link: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(link) ? link : `https://${link}`;
}

async function assertOwnItem(participantId: string, itemId: string) {
  const [item] = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(and(eq(wishlistItems.id, itemId), eq(wishlistItems.participantId, participantId)));
  if (!item) throw new UserError("Item not found.");
}

export async function addItem({ participant }: ParticipantCtx, input: unknown) {
  const values = itemInput.parse(input);
  const [{ n, last }] = await db
    .select({ n: count(), last: sql<number>`coalesce(max(${wishlistItems.sortOrder}), 0)::int` })
    .from(wishlistItems)
    .where(eq(wishlistItems.participantId, participant.id));
  if (n >= MAX_ITEMS) throw new UserError(`Your list can have up to ${MAX_ITEMS} items.`);
  const [row] = await db
    .insert(wishlistItems)
    .values({ ...values, participantId: participant.id, sortOrder: last + 1 })
    .returning({ id: wishlistItems.id });
  return { itemId: row.id };
}

export async function updateItem({ participant }: ParticipantCtx, itemId: string, input: unknown) {
  await assertOwnItem(participant.id, itemId);
  await db.update(wishlistItems).set(itemInput.parse(input)).where(eq(wishlistItems.id, itemId));
  return { itemId };
}

export async function deleteItem({ participant }: ParticipantCtx, itemId: string) {
  await assertOwnItem(participant.id, itemId);
  await db.delete(wishlistItems).where(eq(wishlistItems.id, itemId));
  return { itemId };
}

// ---- Buying off someone else's list ----

/** The item, if it's on another participant's list in the viewer's exchange. */
async function assertShoppable({ participant, exchange }: ParticipantCtx, itemId: string) {
  const [item] = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .innerJoin(participants, eq(participants.id, wishlistItems.participantId))
    .where(
      and(eq(wishlistItems.id, itemId), eq(participants.exchangeId, exchange.id), ne(participants.id, participant.id)),
    );
  if (!item) throw new UserError("Item not found.");
}

export async function markPurchased(ctx: ParticipantCtx, itemId: string) {
  await assertShoppable(ctx, itemId);
  const inserted = await db
    .insert(purchases)
    .values({ itemId, buyerId: ctx.participant.id })
    .onConflictDoNothing()
    .returning({ itemId: purchases.itemId });
  if (!inserted.length) {
    const [existing] = await db.select().from(purchases).where(eq(purchases.itemId, itemId));
    if (existing?.buyerId !== ctx.participant.id) throw new UserError("Someone else already got this one.");
  }
  return { itemId };
}

/** Adds or removes one of the viewer's anonymous reactions on someone else's item. */
export async function toggleReaction(ctx: ParticipantCtx, itemId: string, reaction: string) {
  if (!REACTIONS.some((r) => r.key === reaction)) throw new UserError("Unknown reaction.");
  await assertShoppable(ctx, itemId);
  const where = and(
    eq(itemReactions.itemId, itemId),
    eq(itemReactions.participantId, ctx.participant.id),
    eq(itemReactions.reaction, reaction),
  );
  const removed = await db.delete(itemReactions).where(where).returning({ itemId: itemReactions.itemId });
  if (!removed.length) {
    await db
      .insert(itemReactions)
      .values({ itemId, participantId: ctx.participant.id, reaction })
      .onConflictDoNothing();
  }
  return { itemId, on: !removed.length };
}

export async function unmarkPurchased(ctx: ParticipantCtx, itemId: string) {
  await assertShoppable(ctx, itemId);
  await db.delete(purchases).where(and(eq(purchases.itemId, itemId), eq(purchases.buyerId, ctx.participant.id)));
  return { itemId };
}

// ---- Photos ----

/** The browser resizes photos to about 1200px before upload, which lands well under this. */
const MAX_PHOTO_BYTES = 3_000_000;

/** The image type from the file's first bytes; the browser's claimed type isn't trusted. */
function sniffImageType(data: Buffer) {
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null;
}

export async function setItemPhoto(
  { participant }: ParticipantCtx,
  itemId: string,
  photo: { data: Buffer; width: number; height: number },
) {
  await assertOwnItem(participant.id, itemId);
  const contentType = sniffImageType(photo.data);
  if (!contentType) throw new UserError("That file isn't a JPEG, PNG or WebP image.");
  if (photo.data.length > MAX_PHOTO_BYTES) throw new UserError("That photo is too large. Try a smaller one.");
  const width = Math.round(photo.width);
  const height = Math.round(photo.height);
  if (!(width > 0 && height > 0 && width <= 10_000 && height <= 10_000)) {
    throw new UserError("Couldn't read that photo's size.");
  }
  // Replace any existing photo; the new one gets a new id, so cached copies don't go stale.
  const [row] = await db.transaction(async (tx) => {
    await tx.delete(itemPhotos).where(eq(itemPhotos.itemId, itemId));
    return tx
      .insert(itemPhotos)
      .values({ itemId, contentType, data: photo.data, width, height })
      .returning({ id: itemPhotos.id });
  });
  return { photoId: row.id };
}

export async function removeItemPhoto({ participant }: ParticipantCtx, itemId: string) {
  await assertOwnItem(participant.id, itemId);
  await db.delete(itemPhotos).where(eq(itemPhotos.itemId, itemId));
  return { itemId };
}

/** A photo as an HTTP response, if it's on a list in the viewer's exchange. */
export async function photoResponse({ exchange }: ParticipantCtx, photoId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(photoId)) return new Response("Not found", { status: 404 });
  const [photo] = await db
    .select({ contentType: itemPhotos.contentType, data: itemPhotos.data })
    .from(itemPhotos)
    .innerJoin(wishlistItems, eq(wishlistItems.id, itemPhotos.itemId))
    .innerJoin(participants, eq(participants.id, wishlistItems.participantId))
    .innerJoin(exchanges, eq(exchanges.id, participants.exchangeId))
    .where(and(eq(itemPhotos.id, photoId), eq(exchanges.id, exchange.id)));
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      "X-Content-Type-Options": "nosniff",
      // A photo never changes (a new upload gets a new id), so browsers can keep it.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
