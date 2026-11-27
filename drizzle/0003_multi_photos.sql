ALTER TABLE "item_photos" DROP CONSTRAINT "item_photos_item_id_unique";--> statement-breakpoint
ALTER TABLE "item_photos" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "item_photos_item_idx" ON "item_photos" USING btree ("item_id","sort_order");