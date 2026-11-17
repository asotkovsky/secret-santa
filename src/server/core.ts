import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { formatPhone, toE164 } from "@/lib/phone";

/** An error whose message is safe to show the user. */
export class UserError extends Error {}

/** A personal-link secret: 32 URL-safe characters (192 random bits). */
export function newToken() {
  return randomBytes(24).toString("base64url");
}

// ---- Shared input schemas. Forms send "" for empty fields; normalize to null. ----

export const optText = (max = 2000) => z.string().trim().max(max).nullish().transform(emptyToNull);

/** A phone number we can text, stored formatted (555-555-5555 for US numbers). */
export const optPhone = optText(50)
  .refine((v) => !v || toE164(v) !== null, "Enter a 10-digit US phone number, or an international one starting with +.")
  .transform((v) => (v ? formatPhone(v) : v));

export const optDate = z
  .union([z.literal(""), z.iso.date()])
  .nullish()
  .transform(emptyToNull);

/** Dollars, converted to integer cents. */
export const optMoney = z
  .union([z.literal(""), z.coerce.number().nonnegative().max(100_000)])
  .nullish()
  .transform((v) => (v === "" || v == null ? null : Math.round(v * 100)));

/** "" and null become null (clear the field); undefined stays undefined (leave unchanged). */
function emptyToNull<T>(v: T | "" | null | undefined): T | null | undefined {
  return v === undefined ? undefined : v === "" || v === null ? null : v;
}
