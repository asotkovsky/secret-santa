"use server";

import { redirect } from "next/navigation";
import type { TextKind } from "@/db/schema";
import { organizerAction } from "@/server/action";
import * as svc from "@/server/exchanges";

type Input = Record<string, string>;

export async function updateExchangeAction(exchangeId: string, input: Input) {
  return organizerAction(exchangeId, (x) => svc.updateExchange(x, input));
}

export async function deleteExchangeAction(exchangeId: string) {
  const result = await organizerAction(exchangeId, (x) => svc.deleteExchange(x));
  if (result.ok) redirect("/exchanges");
  return result;
}

export async function addParticipantAction(exchangeId: string, input: Input) {
  return organizerAction(exchangeId, (x) => svc.addParticipant(x, input));
}

export async function updateParticipantAction(exchangeId: string, participantId: string, input: Input) {
  return organizerAction(exchangeId, (x) => svc.updateParticipant(x, participantId, input));
}

export async function removeParticipantAction(exchangeId: string, participantId: string) {
  return organizerAction(exchangeId, (x) => svc.removeParticipant(x, participantId));
}

export async function resetLinkAction(exchangeId: string, participantId: string) {
  return organizerAction(exchangeId, (x) => svc.resetLink(x, participantId));
}

export async function addExclusionAction(exchangeId: string, aId: string, bId: string) {
  return organizerAction(exchangeId, (x) => svc.addExclusion(x, aId, bId));
}

export async function removeExclusionAction(exchangeId: string, exclusionId: string) {
  return organizerAction(exchangeId, (x) => svc.removeExclusion(x, exclusionId));
}

export async function drawAction(exchangeId: string) {
  return organizerAction(exchangeId, (x) => svc.runDraw(x.id));
}

export async function resetDrawAction(exchangeId: string) {
  return organizerAction(exchangeId, (x) => svc.resetDraw(x));
}

export async function peekAction(exchangeId: string) {
  return organizerAction(exchangeId, (x) => svc.getAssignments(x));
}

export async function prepareTextsAction(exchangeId: string, kind: TextKind, participantIds: string[]) {
  return organizerAction(exchangeId, (x) => svc.prepareTexts(x, kind, participantIds));
}

export async function recordTextAction(exchangeId: string, participantId: string, kind: TextKind) {
  return organizerAction(exchangeId, (x) => svc.recordText(x, participantId, kind));
}
