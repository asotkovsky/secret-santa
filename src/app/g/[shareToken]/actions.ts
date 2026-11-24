"use server";

import { guestAction } from "@/server/action";
import * as svc from "@/server/guests";

export async function guestMarkAction(shareToken: string, itemId: string) {
  return guestAction(shareToken, () => svc.guestMarkPurchased(shareToken, itemId));
}

export async function guestUnmarkAction(shareToken: string, itemId: string) {
  return guestAction(shareToken, () => svc.guestUnmarkPurchased(shareToken, itemId));
}
