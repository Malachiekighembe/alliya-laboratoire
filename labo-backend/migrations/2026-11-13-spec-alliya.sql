-- Alliya Laboratoire — migration vers le cahier des charges fonctionnel
-- Date: 2026-11-13
-- Idempotent : peut être rejouée sans risque.

-- ---------------------------------------------------------------------------
-- 1. Patients : champs du formulaire complet (§3.3)
-- ---------------------------------------------------------------------------
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "middle_name" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "place_of_birth" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "nationality" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "marital_status" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "secondary_phone" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "city" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "commune" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "avenue" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "emergency_contact_name" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "attending_physician" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "referring_facility" character varying;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "administrative_notes" text;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "photo_url" text;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;

-- ---------------------------------------------------------------------------
-- 2. Visites : structure de provenance (§5.1)
-- ---------------------------------------------------------------------------
ALTER TABLE "visits" ADD COLUMN IF NOT EXISTS "referring_facility" character varying;

-- ---------------------------------------------------------------------------
-- 3. Catalogue d'analyses : sections et paramètres (§5.2)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "test_sections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "code" character varying NOT NULL,
  "name" character varying NOT NULL,
  "description" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "test_parameters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "test_catalog_id" uuid NOT NULL,
  "code" character varying,
  "name" character varying NOT NULL,
  "unit" character varying,
  "reference_range" text,
  "method" character varying,
  "position" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "test_catalog" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "test_catalog" ADD COLUMN IF NOT EXISTS "section" character varying;
ALTER TABLE "test_catalog" ADD COLUMN IF NOT EXISTS "sample_type" character varying;
ALTER TABLE "test_catalog" ADD COLUMN IF NOT EXISTS "container" character varying;
ALTER TABLE "test_catalog" ADD COLUMN IF NOT EXISTS "preparation" text;
ALTER TABLE "test_catalog" ADD COLUMN IF NOT EXISTS "method" character varying;

-- ---------------------------------------------------------------------------
-- 4. Demandes d'analyses : total et statut de paiement (§5.3)
-- ---------------------------------------------------------------------------
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "total_price" numeric NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" character varying NOT NULL DEFAULT 'non_paye';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "validated_by_id" uuid;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sent_to_lab_at" timestamp with time zone;

-- ---------------------------------------------------------------------------
-- 5. Prélèvements (§7.2) — table "collections"
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "collections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "matricule" character varying NOT NULL,
  "patient_id" uuid NOT NULL,
  "visit_id" uuid,
  "order_id" uuid,
  "collection_date" timestamp with time zone DEFAULT now(),
  "sample_type" character varying,
  "site" character varying,
  "collected_by_id" uuid,
  "status" character varying NOT NULL DEFAULT 'en_attente',
  "observations" text,
  "difficulties" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. Échantillons : contrôle et étiquetage (§7.3, §7.4)
-- ---------------------------------------------------------------------------
ALTER TABLE "specimens" ADD COLUMN IF NOT EXISTS "collection_id" uuid;
ALTER TABLE "specimens" ADD COLUMN IF NOT EXISTS "section" character varying;
ALTER TABLE "specimens" ADD COLUMN IF NOT EXISTS "received_at" timestamp with time zone;
ALTER TABLE "specimens" ADD COLUMN IF NOT EXISTS "accepted_by_id" uuid;
ALTER TABLE "specimens" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp with time zone;
ALTER TABLE "specimens" ADD COLUMN IF NOT EXISTS "rejected_reason" text;
ALTER TABLE "specimens" ADD COLUMN IF NOT EXISTS "rejected_at" timestamp with time zone;
ALTER TABLE "specimens" ADD COLUMN IF NOT EXISTS "discarded_reason" text;
ALTER TABLE "specimens" ADD COLUMN IF NOT EXISTS "qr_token" text;

-- ---------------------------------------------------------------------------
-- 7. Analyses (§8.1) — table "analysis_runs"
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "analysis_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "matricule" character varying NOT NULL,
  "patient_id" uuid NOT NULL,
  "visit_id" uuid,
  "order_id" uuid,
  "order_item_id" uuid,
  "specimen_id" uuid,
  "test_catalog_id" uuid NOT NULL,
  "performed_by_id" uuid,
  "section" character varying,
  "status" character varying NOT NULL DEFAULT 'en_attente',
  "priority" character varying NOT NULL DEFAULT 'normale',
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "suspended_at" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 8. Résultats : type, observations, paramètres, révisions (§8.2, §8.3, §9.3)
-- ---------------------------------------------------------------------------
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "result_type" character varying NOT NULL DEFAULT 'numeric';
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "qualitative_value" character varying;
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "observations" text;
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "method" character varying;
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "analysis_run_id" uuid;
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "reported_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "result_parameters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "result_id" uuid NOT NULL,
  "name" character varying NOT NULL,
  "value" text,
  "unit" character varying,
  "reference_range" text,
  "flag" character varying,
  "method" character varying,
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "result_revisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "result_id" uuid NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "change_type" character varying NOT NULL DEFAULT 'update',
  "value" text,
  "unit" character varying,
  "reference_range" text,
  "status" character varying,
  "previous_value" text,
  "comment" text,
  "changed_by_id" uuid,
  "created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "result_validations" ADD COLUMN IF NOT EXISTS "signature" text;
ALTER TABLE "result_validations" ADD COLUMN IF NOT EXISTS "validated_at" timestamp with time zone;
ALTER TABLE "result_validations" ADD COLUMN IF NOT EXISTS "decision" character varying;

-- ---------------------------------------------------------------------------
-- 9. Rapports PDF et remises (§10)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "matricule" character varying NOT NULL,
  "patient_id" uuid NOT NULL,
  "visit_id" uuid,
  "order_id" uuid,
  "report_date" timestamp with time zone DEFAULT now(),
  "status" character varying NOT NULL DEFAULT 'genere',
  "pdf_path" text,
  "pdf_url" text,
  "generated_by_id" uuid,
  "validated_by_id" uuid,
  "validated_at" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "report_deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "report_id" uuid NOT NULL,
  "patient_id" uuid NOT NULL,
  "delivered_at" timestamp with time zone DEFAULT now(),
  "delivered_by_id" uuid,
  "recipient_name" character varying,
  "recipient_relation" character varying,
  "delivery_mode" character varying NOT NULL DEFAULT 'remise_en_main_propre',
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 10. Consultations et prescriptions (§2.5)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "consultations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "matricule" character varying NOT NULL,
  "patient_id" uuid NOT NULL,
  "visit_id" uuid,
  "practitioner_id" uuid,
  "consultation_date" timestamp with time zone DEFAULT now(),
  "reason" text,
  "diagnosis" text,
  "notes" text,
  "status" character varying NOT NULL DEFAULT 'en_cours',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "prescriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "matricule" character varying NOT NULL,
  "patient_id" uuid NOT NULL,
  "visit_id" uuid,
  "consultation_id" uuid,
  "practitioner_id" uuid,
  "prescribed_at" timestamp with time zone DEFAULT now(),
  "notes" text,
  "status" character varying NOT NULL DEFAULT 'active',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "prescription_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "prescription_id" uuid NOT NULL,
  "test_catalog_id" uuid,
  "label" character varying NOT NULL,
  "dosage" character varying,
  "instructions" text,
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 11. Rendez-vous (§12 : REN)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "appointments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "laboratory_id" uuid NOT NULL,
  "matricule" character varying NOT NULL,
  "patient_id" uuid NOT NULL,
  "appointment_date" timestamp with time zone NOT NULL,
  "status" character varying NOT NULL DEFAULT 'planifie',
  "reason" text,
  "notes" text,
  "created_by_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 12. Paiements : matricule PAY (§6.2)
-- ---------------------------------------------------------------------------
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "matricule" character varying;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "received_by_id" text;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payer_name" character varying;

-- ---------------------------------------------------------------------------
-- 13. Index de recherche
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_collections_laboratory" ON "collections" ("laboratory_id");
CREATE INDEX IF NOT EXISTS "idx_collections_patient" ON "collections" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_analysis_runs_laboratory_status" ON "analysis_runs" ("laboratory_id", "status");
CREATE INDEX IF NOT EXISTS "idx_analysis_runs_order_item" ON "analysis_runs" ("order_item_id");
CREATE INDEX IF NOT EXISTS "idx_result_parameters_result" ON "result_parameters" ("result_id");
CREATE INDEX IF NOT EXISTS "idx_result_revisions_result" ON "result_revisions" ("result_id");
CREATE INDEX IF NOT EXISTS "idx_reports_patient" ON "reports" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_report_deliveries_report" ON "report_deliveries" ("report_id");
CREATE INDEX IF NOT EXISTS "idx_test_parameters_test" ON "test_parameters" ("test_catalog_id");
CREATE INDEX IF NOT EXISTS "idx_specimens_laboratory_status" ON "specimens" ("laboratory_id", "status");
CREATE INDEX IF NOT EXISTS "idx_appointments_laboratory_date" ON "appointments" ("laboratory_id", "appointment_date");
CREATE INDEX IF NOT EXISTS "idx_orders_laboratory_status" ON "orders" ("laboratory_id", "status");