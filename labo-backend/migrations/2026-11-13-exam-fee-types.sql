-- ============================================================================
-- Types d'examen (catalogue) et types de frais (facturation)
-- Objectif : les listes « Type d'examen » et « Type de frais » configurées dans
-- /parametres doivent réellement alimenter le catalogue et les factures.
-- ============================================================================

-- Catalogue d'analyses : type d'examen (HMATO, BIOCHIM, …)
ALTER TABLE test_catalog ADD COLUMN IF NOT EXISTS exam_type TEXT;

-- Facturation : type de frais (consultation, prelevement, analyse, forfait, autre)
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS fee_type TEXT;

-- Reprise : la colonne "category" portait déjà la discipline de l'examen.
-- 1) on aligne sur le code de configuration quand le libellé correspond
UPDATE test_catalog t
SET exam_type = c.code
FROM configuration_items c
WHERE t.exam_type IS NULL
  AND t.category IS NOT NULL
  AND c.category = 'exam_type'
  AND c.laboratory_id = t.laboratory_id
  AND c.label = t.category;

-- 2) sinon on conserve la valeur existante (libellé libre)
UPDATE test_catalog
SET exam_type = category
WHERE exam_type IS NULL AND category IS NOT NULL;

-- Reprise : les lignes de facture sans type sont classées « analyse »
UPDATE invoice_items
SET fee_type = 'analyse'
WHERE fee_type IS NULL AND test_catalog_id IS NOT NULL;

UPDATE invoice_items
SET fee_type = 'autre'
WHERE fee_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_test_catalog_exam_type
  ON test_catalog (laboratory_id, exam_type);

CREATE INDEX IF NOT EXISTS idx_invoice_items_fee_type
  ON invoice_items (laboratory_id, fee_type);