// Gift exchanges, their participants, the draw, wish lists and texts.
//
// Organizers sign in (Better Auth). Participants never do: each one has a secret `token`,
// and their personal link (/p/<token>) is their only credential.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { id, timestamps } from "./columns";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const exchanges = pgTable(
  "exchanges",
  {
    id: id(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Spending limit per gift, in cents (USD). */
    budgetCents: integer("budget_cents"),
    /** Wish lists should be filled in by this day. */
    wishlistDueOn: date("wishlist_due_on"),
    /** Everyone should have revealed their match by this day. */
    revealDueOn: date("reveal_due_on"),
    /** The day of the exchange itself. */
    exchangeOn: date("exchange_on"),
    /** Where/when, dress code, anything else ("Grandma's house, 2pm"). */
    details: text("details"),
    /** Set when names have been drawn; participants and exclusions are locked while set. */
    drawnAt: timestamp("drawn_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [index("exchanges_organizer_idx").on(t.organizerId)],
);

export const participants = pgTable(
  "participants",
  {
    id: id(),
    exchangeId: uuid("exchange_id")
      .notNull()
      .references(() => exchanges.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** As entered (e.g. 555-555-5555); converted to +1… when texting. */
    phone: text("phone"),
    /** The secret in this participant's personal link. Replace it to revoke a leaked link. */
    token: text("token").notNull().unique(),
    /** This is the organizer's own entry (they're taking part too). */
    isOrganizer: boolean("is_organizer").notNull().default(false),
    /**
     * False for a gift helper (e.g. a grandparent): not in the draw and no wish list, but they
     * browse everyone's lists and mark what they buy, like any other shopper.
     */
    inDraw: boolean("in_draw").notNull().default(true),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    revealedAt: timestamp("revealed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [index("participants_exchange_idx").on(t.exchangeId)],
);

/** Two participants who must not draw each other (in either direction). Stored with a < b. */
export const exclusions = pgTable(
  "exclusions",
  {
    id: id(),
    exchangeId: uuid("exchange_id")
      .notNull()
      .references(() => exchanges.id, { onDelete: "cascade" }),
    participantAId: uuid("participant_a_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    participantBId: uuid("participant_b_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    ...timestamps(),
  },
  (t) => [
    unique("exclusions_pair_uq").on(t.participantAId, t.participantBId),
    check("exclusions_order_ck", sql`${t.participantAId} < ${t.participantBId}`),
    index("exclusions_exchange_idx").on(t.exchangeId),
  ],
);

/** The draw: each giver buys for exactly one receiver, and each receiver has exactly one giver. */
export const assignments = pgTable(
  "assignments",
  {
    giverId: uuid("giver_id")
      .primaryKey()
      .references(() => participants.id, { onDelete: "cascade" }),
    exchangeId: uuid("exchange_id")
      .notNull()
      .references(() => exchanges.id, { onDelete: "cascade" }),
    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("assignments_receiver_uq").on(t.exchangeId, t.receiverId)],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: id(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    links: text("links")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps(),
  },
  (t) => [index("wishlist_items_participant_idx").on(t.participantId)],
);

/** An item's photo, resized in the browser before upload. A new upload gets a new id. */
export const itemPhotos = pgTable("item_photos", {
  id: id(),
  itemId: uuid("item_id")
    .notNull()
    .unique()
    .references(() => wishlistItems.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  data: bytea("data").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Who bought what. SECRET from the item's owner: never read this table on behalf of the
 * person whose list the item is on (see src/server/wishlists.ts).
 */
export const purchases = pgTable(
  "purchases",
  {
    itemId: uuid("item_id")
      .primaryKey()
      .references(() => wishlistItems.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("purchases_buyer_idx").on(t.buyerId)],
);

export type TextKind = "invite" | "reminder";

/**
 * Texts the organizer opened in their phone's Messages app to send. The app never sends texts
 * itself, so this records the tap, not delivery.
 */
export const textLog = pgTable(
  "text_log",
  {
    id: id(),
    exchangeId: uuid("exchange_id")
      .notNull()
      .references(() => exchanges.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id").references(() => participants.id, { onDelete: "set null" }),
    kind: text("kind").$type<TextKind>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("text_log_exchange_idx").on(t.exchangeId, t.createdAt)],
);
