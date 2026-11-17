"use server";

import { participantAction } from "@/server/action";
import * as svc from "@/server/wishlists";

type ItemInput = { name: string; links: string[]; notes: string };

export async function revealAction(token: string) {
  return participantAction(token, (ctx) => svc.reveal(ctx));
}

export async function addItemAction(token: string, input: ItemInput) {
  return participantAction(token, (ctx) => svc.addItem(ctx, input));
}

export async function updateItemAction(token: string, itemId: string, input: ItemInput) {
  return participantAction(token, (ctx) => svc.updateItem(ctx, itemId, input));
}

export async function deleteItemAction(token: string, itemId: string) {
  return participantAction(token, (ctx) => svc.deleteItem(ctx, itemId));
}

export async function removePhotoAction(token: string, itemId: string) {
  return participantAction(token, (ctx) => svc.removeItemPhoto(ctx, itemId));
}

export async function markPurchasedAction(token: string, itemId: string) {
  return participantAction(token, (ctx) => svc.markPurchased(ctx, itemId));
}

export async function unmarkPurchasedAction(token: string, itemId: string) {
  return participantAction(token, (ctx) => svc.unmarkPurchased(ctx, itemId));
}

export async function toggleReactionAction(token: string, itemId: string, reaction: string) {
  return participantAction(token, (ctx) => svc.toggleReaction(ctx, itemId, reaction));
}
