ALTER TABLE "purchases" ALTER COLUMN "buyer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "guest_id" text;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_share_token_unique" UNIQUE("share_token");--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_one_buyer_ck" CHECK (("purchases"."buyer_id" is null) <> ("purchases"."guest_id" is null));