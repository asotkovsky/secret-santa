// Organizer-side services. Callers must have authorized the organizer (requireExchange).
import "server-only";
import { and, asc, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assignments, exchanges, exclusions, participants, textLog, wishlistItems, type TextKind } from "@/db/schema";
import type { ExchangeRow } from "@/lib/access";
import { draw } from "@/lib/draw";
import { firstName, formatDay, formatMoney } from "@/lib/format";
import { toE164 } from "@/lib/phone";
import { newToken, optDate, optMoney, optPhone, optText, UserError } from "./core";
import { appUrl } from "./links";

// ---- Exchanges ----

export const exchangeInput = z.object({
  name: z.string().trim().min(1, "Give the exchange a name.").max(100),
  budget: optMoney,
  wishlistDueOn: optDate,
  revealDueOn: optDate,
  exchangeOn: optDate,
  details: optText(1000),
});

function exchangeValues(input: unknown) {
  const { budget, ...rest } = exchangeInput.parse(input);
  return { ...rest, budgetCents: budget ?? null };
}

export const participantInput = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80),
  phone: optPhone,
});

export async function listExchanges(userId: string) {
  return db
    .select({
      id: exchanges.id,
      name: exchanges.name,
      exchangeOn: exchanges.exchangeOn,
      drawnAt: exchanges.drawnAt,
      createdAt: exchanges.createdAt,
      participantCount: count(participants.id),
    })
    .from(exchanges)
    .leftJoin(participants, eq(participants.exchangeId, exchanges.id))
    .where(eq(exchanges.organizerId, userId))
    .groupBy(exchanges.id)
    .orderBy(desc(exchanges.createdAt));
}

/** Creates an exchange, optionally with the organizer as its first participant. */
export async function createExchange(userId: string, input: unknown, organizerAsParticipant: unknown) {
  const values = exchangeValues(input);
  const me = organizerAsParticipant ? participantInput.parse(organizerAsParticipant) : null;
  return db.transaction(async (tx) => {
    const [exchange] = await tx
      .insert(exchanges)
      .values({ ...values, organizerId: userId })
      .returning({ id: exchanges.id });
    if (me) {
      await tx.insert(participants).values({ ...me, exchangeId: exchange.id, token: newToken(), isOrganizer: true });
    }
    return { exchangeId: exchange.id };
  });
}

export async function updateExchange(exchange: ExchangeRow, input: unknown) {
  await db.update(exchanges).set(exchangeValues(input)).where(eq(exchanges.id, exchange.id));
  return { exchangeId: exchange.id };
}

export async function deleteExchange(exchange: ExchangeRow) {
  await db.delete(exchanges).where(eq(exchanges.id, exchange.id));
  return { exchangeId: exchange.id };
}

// ---- Dashboard ----

/** Everything the organizer's page shows. Deliberately excludes purchases and the draw itself. */
export async function getDashboard(exchange: ExchangeRow) {
  const [people, pairs, texts] = await Promise.all([
    db
      .select({
        id: participants.id,
        name: participants.name,
        phone: participants.phone,
        token: participants.token,
        isOrganizer: participants.isOrganizer,
        invitedAt: participants.invitedAt,
        revealedAt: participants.revealedAt,
        itemCount: count(wishlistItems.id),
      })
      .from(participants)
      .leftJoin(wishlistItems, eq(wishlistItems.participantId, participants.id))
      .where(eq(participants.exchangeId, exchange.id))
      .groupBy(participants.id)
      .orderBy(asc(participants.createdAt)),
    db
      .select({ id: exclusions.id, a: exclusions.participantAId, b: exclusions.participantBId })
      .from(exclusions)
      .where(eq(exclusions.exchangeId, exchange.id))
      .orderBy(asc(exclusions.createdAt)),
    db
      .select({
        id: textLog.id,
        participantId: textLog.participantId,
        kind: textLog.kind,
        createdAt: textLog.createdAt,
      })
      .from(textLog)
      .where(eq(textLog.exchangeId, exchange.id))
      .orderBy(desc(textLog.createdAt))
      .limit(30),
  ]);
  return { participants: people, exclusions: pairs, texts };
}

// ---- Participants ----

function assertNotDrawn(exchange: ExchangeRow, what: string) {
  if (exchange.drawnAt) throw new UserError(`Names have already been drawn. Reset the draw to ${what}.`);
}

async function assertParticipant(exchange: ExchangeRow, participantId: string) {
  const [row] = await db
    .select()
    .from(participants)
    .where(and(eq(participants.id, participantId), eq(participants.exchangeId, exchange.id)));
  if (!row) throw new UserError("Participant not found.");
  return row;
}

export async function addParticipant(exchange: ExchangeRow, input: unknown) {
  assertNotDrawn(exchange, "add people");
  const values = participantInput.parse(input);
  const [row] = await db
    .insert(participants)
    .values({ ...values, exchangeId: exchange.id, token: newToken() })
    .returning({ id: participants.id });
  return { participantId: row.id };
}

/** Name and phone can change at any time, even after the draw. */
export async function updateParticipant(exchange: ExchangeRow, participantId: string, input: unknown) {
  await assertParticipant(exchange, participantId);
  await db.update(participants).set(participantInput.parse(input)).where(eq(participants.id, participantId));
  return { participantId };
}

export async function removeParticipant(exchange: ExchangeRow, participantId: string) {
  assertNotDrawn(exchange, "remove people");
  await assertParticipant(exchange, participantId);
  await db.delete(participants).where(eq(participants.id, participantId));
  return { participantId };
}

/** Replaces a participant's personal link, so an old (e.g. forwarded) link stops working. */
export async function resetLink(exchange: ExchangeRow, participantId: string) {
  await assertParticipant(exchange, participantId);
  await db.update(participants).set({ token: newToken(), invitedAt: null }).where(eq(participants.id, participantId));
  return { participantId };
}

// ---- Exclusions ----

export async function addExclusion(exchange: ExchangeRow, aId: string, bId: string) {
  assertNotDrawn(exchange, "change who can't draw whom");
  if (aId === bId) throw new UserError("Pick two different people.");
  await Promise.all([assertParticipant(exchange, aId), assertParticipant(exchange, bId)]);
  const [a, b] = aId < bId ? [aId, bId] : [bId, aId];
  const inserted = await db
    .insert(exclusions)
    .values({ exchangeId: exchange.id, participantAId: a, participantBId: b })
    .onConflictDoNothing()
    .returning({ id: exclusions.id });
  if (!inserted.length) throw new UserError("Those two are already kept apart.");
  return { exclusionId: inserted[0].id };
}

export async function removeExclusion(exchange: ExchangeRow, exclusionId: string) {
  assertNotDrawn(exchange, "change who can't draw whom");
  await db.delete(exclusions).where(and(eq(exclusions.id, exclusionId), eq(exclusions.exchangeId, exchange.id)));
  return { exclusionId };
}

// ---- The draw ----

export async function runDraw(exchangeId: string) {
  return db.transaction(async (tx) => {
    // Lock the exchange so two clicks can't draw twice.
    const [exchange] = await tx.select().from(exchanges).where(eq(exchanges.id, exchangeId)).for("update");
    if (exchange.drawnAt) throw new UserError("Names have already been drawn.");
    const people = await tx
      .select({ id: participants.id })
      .from(participants)
      .where(eq(participants.exchangeId, exchangeId));
    if (people.length < 3) throw new UserError("Add at least 3 people before drawing names.");
    const pairs = await tx
      .select({ a: exclusions.participantAId, b: exclusions.participantBId })
      .from(exclusions)
      .where(eq(exclusions.exchangeId, exchangeId));

    const result = draw(
      people.map((p) => p.id),
      pairs.map((p) => [p.a, p.b] as const),
    );
    if (!result) {
      throw new UserError(
        "There's no way to draw names with these exclusions. Remove one or two of the pairs and try again.",
      );
    }
    await tx.delete(assignments).where(eq(assignments.exchangeId, exchangeId));
    await tx
      .insert(assignments)
      .values([...result].map(([giverId, receiverId]) => ({ exchangeId, giverId, receiverId })));
    await tx.update(exchanges).set({ drawnAt: new Date() }).where(eq(exchanges.id, exchangeId));
    return { count: result.size };
  });
}

/** Undoes the draw so participants/exclusions can change. Everyone will need to reveal again. */
export async function resetDraw(exchange: ExchangeRow) {
  await db.transaction(async (tx) => {
    await tx.delete(assignments).where(eq(assignments.exchangeId, exchange.id));
    await tx.update(participants).set({ revealedAt: null }).where(eq(participants.exchangeId, exchange.id));
    await tx.update(exchanges).set({ drawnAt: null }).where(eq(exchanges.id, exchange.id));
  });
  return { exchangeId: exchange.id };
}

/** Who's buying for whom. Only fetched when the organizer explicitly asks to peek. */
export async function getAssignments(exchange: ExchangeRow) {
  const rows = await db
    .select({ giverId: assignments.giverId, receiverId: assignments.receiverId })
    .from(assignments)
    .where(eq(assignments.exchangeId, exchange.id));
  const names = new Map(
    (
      await db
        .select({ id: participants.id, name: participants.name })
        .from(participants)
        .where(eq(participants.exchangeId, exchange.id))
    ).map((p) => [p.id, p.name]),
  );
  return rows
    .map((r) => ({ giver: names.get(r.giverId) ?? "?", receiver: names.get(r.receiverId) ?? "?" }))
    .sort((x, y) => x.giver.localeCompare(y.giver));
}

// ---- Texts ----

type Recipient = {
  id: string;
  name: string;
  phone: string | null;
  token: string;
  revealedAt: Date | null;
  itemCount: number;
};

function inviteText(exchange: ExchangeRow, p: Recipient, link: string) {
  const budget = formatMoney(exchange.budgetCents);
  const due = formatDay(exchange.wishlistDueOn, "MMM d");
  return [
    `Hi ${firstName(p.name)}! 🎅 You've been added to the "${exchange.name}" Nice List.`,
    exchange.drawnAt
      ? "Tap to see who you're buying for and make your wish list:"
      : "Tap to make your wish list. Names get drawn soon!",
    link,
    [budget && `Spending limit: ${budget}.`, due && `Wish lists due ${due}.`].filter(Boolean).join(" "),
    "This link is just for you, so no sharing with the elves. 🤫",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Null when there's nothing left for this person to do. */
function reminderText(exchange: ExchangeRow, p: Recipient, link: string) {
  const todo: string[] = [];
  if (exchange.drawnAt && !p.revealedAt) {
    const due = formatDay(exchange.revealDueOn, "MMM d");
    todo.push(`find out who you're buying for${due ? ` (by ${due})` : ""}`);
  }
  if (p.itemCount === 0) {
    const due = formatDay(exchange.wishlistDueOn, "MMM d");
    todo.push(`add a few ideas to your wish list${due ? ` (by ${due})` : ""}`);
  }
  if (!todo.length) return null;
  return [
    `Santa's checking his list twice, ${firstName(p.name)}! 🎄 For "${exchange.name}", please ${todo.join(" and ")}.`,
    link,
  ].join("\n");
}

/** Whether a reminder would go to this person: drawn but not revealed, or an empty list. */
export function needsReminder(drawn: boolean, p: { revealedAt: Date | null; itemCount: number }) {
  return (drawn && !p.revealedAt) || p.itemCount === 0;
}

/**
 * The personalized texts for these participants, ready for the organizer to send from their own
 * phone (the app doesn't send texts itself). Invites go to everyone asked; reminders only to
 * people with something left to do. People without a usable phone number are left out.
 */
export async function prepareTexts(exchange: ExchangeRow, kind: TextKind, ids: string[]) {
  if (!ids.length) return [];
  const recipients: Recipient[] = await db
    .select({
      id: participants.id,
      name: participants.name,
      phone: participants.phone,
      token: participants.token,
      revealedAt: participants.revealedAt,
      itemCount: count(wishlistItems.id),
    })
    .from(participants)
    .leftJoin(wishlistItems, eq(wishlistItems.participantId, participants.id))
    .where(and(eq(participants.exchangeId, exchange.id), isNotNull(participants.phone), inArray(participants.id, ids)))
    .groupBy(participants.id)
    .orderBy(asc(participants.name));

  const base = await appUrl();
  return recipients.flatMap((p) => {
    const to = p.phone ? toE164(p.phone) : null;
    const link = `${base}/p/${p.token}`;
    const body = kind === "invite" ? inviteText(exchange, p, link) : reminderText(exchange, p, link);
    return to && body ? [{ participantId: p.id, name: p.name, to, body }] : [];
  });
}

/** Records that the organizer opened a text to send from their phone. */
export async function recordText(exchange: ExchangeRow, participantId: string, kind: TextKind) {
  await assertParticipant(exchange, participantId);
  await db.insert(textLog).values({ exchangeId: exchange.id, participantId, kind });
  if (kind === "invite") {
    await db.update(participants).set({ invitedAt: new Date() }).where(eq(participants.id, participantId));
  }
  return { participantId };
}
