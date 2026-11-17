CREATE TABLE "item_reactions" (
	"item_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"reaction" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_reactions_item_id_participant_id_reaction_pk" PRIMARY KEY("item_id","participant_id","reaction")
);
--> statement-breakpoint
ALTER TABLE "item_reactions" ADD CONSTRAINT "item_reactions_item_id_wishlist_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."wishlist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_reactions" ADD CONSTRAINT "item_reactions_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;