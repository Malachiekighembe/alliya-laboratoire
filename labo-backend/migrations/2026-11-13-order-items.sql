-- Complément : lignes de demande (order_items) — quantités et montants (§5.3, §6.1)
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "quantity" integer NOT NULL DEFAULT 1;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "unit_price" numeric NOT NULL DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "total_price" numeric NOT NULL DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "analysis_run_id" uuid;