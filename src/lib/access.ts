import "server-only";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { exchanges, participants } from "@/db/schema";
import { auth } from "@/lib/auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;

export function isUuid(value: string) {
  return UUID_RE.test(value);
}

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}

/**
 * The organizer gate: every organizer page and action goes through this. Someone else's
 * exchange is a 404, so exchange ids can't be probed.
 */
export const requireExchange = cache(async (exchangeId: string) => {
  const user = await requireUser();
  if (!isUuid(exchangeId)) notFound();
  const [exchange] = await db
    .select()
    .from(exchanges)
    .where(and(eq(exchanges.id, exchangeId), eq(exchanges.organizerId, user.id)));
  if (!exchange) notFound();
  return { user, exchange };
});

/** The participant behind a personal link, with their exchange, or null for an unknown link. */
export const findParticipant = cache(async (token: string) => {
  if (!TOKEN_RE.test(token)) return null;
  const [row] = await db
    .select({ participant: participants, exchange: exchanges })
    .from(participants)
    .innerJoin(exchanges, eq(exchanges.id, participants.exchangeId))
    .where(eq(participants.token, token));
  return row ?? null;
});

/** The participant gate: every participant page and action goes through this. */
export async function requireParticipant(token: string) {
  const row = await findParticipant(token);
  if (!row) notFound();
  return row;
}

export type ParticipantCtx = NonNullable<Awaited<ReturnType<typeof findParticipant>>>;
export type ExchangeRow = typeof exchanges.$inferSelect;
