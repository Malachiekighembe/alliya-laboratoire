-- Alliya Laboratoire — configuration système (§16 : tout est paramétrable)
-- Date: 2026-11-13
-- Idempotent : peut être rejouée sans risque.

-- ---------------------------------------------------------------------------
-- 1. Items de configuration (types d'examen, types de frais, sections,
--    unités, types d'échantillon, types de document, priorités).
--    Une seule table pour éviter les « données fantômes » codées en dur.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "configuration_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL REFERENCES "laboratories" ("id") ON DELETE CASCADE,
  "category" character varying NOT NULL,
  "code" character varying NOT NULL,
  "label" character varying NOT NULL,
  "description" text,
  "unit" character varying,
  "price" numeric NOT NULL DEFAULT 0,
  "tax_rate" numeric NOT NULL DEFAULT 0,
  "is_default" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "configuration_items_category_check" CHECK (
    "category" IN ('exam_type', 'fee_type', 'sample_type', 'section', 'unit', 'document_type', 'priority')
  ),
  CONSTRAINT "configuration_items_code_unique" UNIQUE ("laboratory_id", "category", "code")
);

CREATE INDEX IF NOT EXISTS "idx_configuration_items_lab_cat"
  ON "configuration_items" ("laboratory_id", "category");
CREATE INDEX IF NOT EXISTS "idx_configuration_items_active"
  ON "configuration_items" ("laboratory_id", "is_active");

-- ---------------------------------------------------------------------------
-- 2. Documents patients (bons d'examen, ordonnances, comptes rendus).
--    Le contenu est figé à la création pour garder une trace imprimable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "patient_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL REFERENCES "laboratories" ("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients" ("id") ON DELETE CASCADE,
  "visit_id" uuid REFERENCES "visits" ("id") ON DELETE SET NULL,
  "order_id" uuid REFERENCES "orders" ("id") ON DELETE SET NULL,
  "document_type" character varying NOT NULL DEFAULT 'bon_examen',
  "title" character varying NOT NULL,
  "reference" character varying,
  "content" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "printed_at" timestamp with time zone,
  "printed_by_id" uuid,
  "created_by_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_patient_documents_patient"
  ON "patient_documents" ("laboratory_id", "patient_id");
CREATE INDEX IF NOT EXISTS "idx_patient_documents_order"
  ON "patient_documents" ("order_id");

-- ---------------------------------------------------------------------------
-- 3. Libellés de documents : le catalogue est extensible sans redéploiement.
-- ---------------------------------------------------------------------------
INSERT INTO "configuration_items" ("laboratory_id", "category", "code", "label", "description", "is_default", "sort_order", "metadata")
SELECT l."id", v."category", v."code", v."label", v."description", true, v."sort_order", v."metadata"::jsonb
FROM "laboratories" l
CROSS JOIN (VALUES
  ('document_type', 'bon_examen', 'Bon d''examen', 'Feuille remise au patient avec les examens à réaliser', 10, '{"printable":true,"landscape":false}'),
  ('document_type', 'ordonnance', 'Ordonnance', 'Prescription médicale', 20, '{"printable":true}'),
  ('document_type', 'compte_rendu', 'Compte rendu', 'Compte rendu d''analyse', 30, '{"printable":true}'),
  ('document_type', 'facture', 'Facture', 'Facture patient', 40, '{"printable":true}'),
  ('fee_type', 'consultation', 'Consultation', 'Frais de consultation', 10, '{}'),
  ('fee_type', 'prelevement', 'Prélèvement', 'Acte de prélèvement', 20, '{}'),
  ('fee_type', 'analyse', 'Analyse', 'Analyse de laboratoire', 30, '{}'),
  ('fee_type', 'forfait', 'Forfait', 'Forfait global', 40, '{}'),
  ('fee_type', 'autre', 'Autre', 'Autre frais', 90, '{}'),
  ('sample_type', 'sang', 'Sang', 'Tube sec / EDTA / héparine', 10, '{}'),
  ('sample_type', 'serum', 'Sérum', 'Sérum centrifugé', 20, '{}'),
  ('sample_type', 'plasma', 'Plasma', 'Plasma', 30, '{}'),
  ('sample_type', 'urine', 'Urine', 'Urine', 40, '{}'),
  ('sample_type', 'selles', 'Selles', 'Selles', 50, '{}'),
  ('sample_type', 'autre', 'Autre', 'Autre échantillon', 90, '{}'),
  ('unit', 'g/dL', 'g/dL', 'Gramme par décilitre', 10, '{}'),
  ('unit', 'mg/dL', 'mg/dL', 'Milligramme par décilitre', 20, '{}'),
  ('unit', 'mmol/L', 'mmol/L', 'Millimole par litre', 30, '{}'),
  ('unit', 'U/L', 'U/L', 'Unité par litre', 40, '{}'),
  ('unit', '/mm3', '/mm3', 'Par millimètre cube', 50, '{}'),
  ('unit', '%', '%', 'Pourcentage', 60, '{}'),
  ('priority', 'normale', 'Normale', 'Priorité standard', 10, '{}'),
  ('priority', 'urgente', 'Urgente', 'À traiter en priorité', 20, '{"delay_minutes":60}'),
  ('priority', 'stat', 'Stat', 'Traitement immédiat', 30, '{"delay_minutes":15}')
) AS v("category", "code", "label", "description", "sort_order", "metadata")
ON CONFLICT ("laboratory_id", "category", "code") DO NOTHING;