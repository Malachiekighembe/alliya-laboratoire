-- Complément : dénormalisation patient/visite sur les résultats (filtres et rapports)
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "patient_id" uuid;
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "visit_id" uuid;
UPDATE "results" r SET "patient_id" = s."patient_id", "visit_id" = s."visit_id"
FROM "specimens" s WHERE s."id" = r."specimen_id" AND r."patient_id" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_results_laboratory_patient" ON "results" ("laboratory_id", "patient_id");
