import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireExchange, requireParticipant, requireUser, type ExchangeRow, type ParticipantCtx } from "@/lib/access";
import { UserError } from "./core";

export type ActionResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

async function wrap<T>(fn: () => Promise<T>, revalidate: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    revalidatePath(revalidate, "layout");
    return { ok: true, data };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    if (e instanceof z.ZodError) return { ok: false, error: z.prettifyError(e) };
    throw e;
  }
}

/** For signed-in actions that aren't tied to one exchange (e.g. creating one). */
export async function userAction<T>(fn: (userId: string) => Promise<T>) {
  return wrap(async () => fn((await requireUser()).id), "/exchanges");
}

/** For organizer server actions: checks the signed-in user organizes this exchange. */
export async function organizerAction<T>(exchangeId: string, fn: (exchange: ExchangeRow) => Promise<T>) {
  return wrap(async () => {
    const { exchange } = await requireExchange(exchangeId);
    return fn(exchange);
  }, `/exchanges/${exchangeId}`);
}

/** For participant server actions: resolves the personal link. */
export async function participantAction<T>(token: string, fn: (ctx: ParticipantCtx) => Promise<T>) {
  return wrap(async () => fn(await requireParticipant(token)), `/p/${token}`);
}
