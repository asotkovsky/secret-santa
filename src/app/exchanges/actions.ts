"use server";

import { userAction } from "@/server/action";
import { createExchange } from "@/server/exchanges";

export async function createExchangeAction(
  input: Record<string, string>,
  me: { name: string; phone: string } | null,
) {
  return userAction((userId) => createExchange(userId, input, me));
}
