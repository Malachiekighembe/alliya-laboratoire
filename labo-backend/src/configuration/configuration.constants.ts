/** Catégories de configuration système (§16). */
export const CONFIGURATION_CATEGORIES = [
  'exam_type',
  'fee_type',
  'sample_type',
  'section',
  'unit',
  'document_type',
  'priority',
] as const;

export type ConfigurationCategory = (typeof CONFIGURATION_CATEGORIES)[number];

/** Libellés affichés dans l'interface d'administration. */
export const CONFIGURATION_CATEGORY_LABELS: Record<string, string> = {
  exam_type: "Type d'examen",
  fee_type: 'Type de frais',
  sample_type: "Type d'échantillon",
  section: 'Section technique',
  unit: 'Unité de mesure',
  document_type: 'Type de document',
  priority: 'Priorité',
};

/**
 * Valeurs par défaut proposées à l'installation d'un laboratoire.
 * L'administrateur peut ensuite tout modifier : rien n'est codé en dur côté UI.
 */
export const DEFAULT_CONFIGURATION: Record<string, { code: string; label: string; description?: string; price?: number; sort_order: number }[]> = {
  exam_type: [
    { code: 'HMATO', label: 'Hématologie', description: 'Numérations, formules sanguines', sort_order: 10 },
    { code: 'BIOCHIM', label: 'Biochimie', description: 'Glycémie, bilan lipidique, ionogramme', sort_order: 20 },
    { code: 'IMMUNO', label: 'Immunologie', description: 'Sérologies, marqueurs', sort_order: 30 },
    { code: 'MICRO', label: 'Microbiologie', description: 'Coprocultures, ECBU', sort_order: 40 },
    { code: 'PARA', label: 'Parasitologie', description: 'Examen parasitologique des selles', sort_order: 50 },
    { code: 'URINE', label: 'Bactériologie / Urines', description: 'Bandelette, sédiment urinaire', sort_order: 60 },
  ],
  fee_type: [
    { code: 'consultation', label: 'Consultation', sort_order: 10 },
    { code: 'prelevement', label: 'Prélèvement', sort_order: 20 },
    { code: 'analyse', label: 'Analyse', sort_order: 30 },
    { code: 'forfait', label: 'Forfait', sort_order: 40 },
    { code: 'autre', label: 'Autre', sort_order: 90 },
  ],
  sample_type: [
    { code: 'sang', label: 'Sang', sort_order: 10 },
    { code: 'serum', label: 'Sérum', sort_order: 20 },
    { code: 'plasma', label: 'Plasma', sort_order: 30 },
    { code: 'urine', label: 'Urine', sort_order: 40 },
    { code: 'selles', label: 'Selles', sort_order: 50 },
    { code: 'autre', label: 'Autre', sort_order: 90 },
  ],
  section: [
    { code: 'HEMATOLOGIE', label: 'Hématologie', sort_order: 10 },
    { code: 'BIOCHIMIE', label: 'Biochimie', sort_order: 20 },
    { code: 'IMMUNOLOGIE', label: 'Immunologie', sort_order: 30 },
    { code: 'MICROBIOLOGIE', label: 'Microbiologie', sort_order: 40 },
    { code: 'PARASITOLOGIE', label: 'Parasitologie', sort_order: 50 },
  ],
  unit: [
    { code: 'g/dL', label: 'g/dL', sort_order: 10 },
    { code: 'mg/dL', label: 'mg/dL', sort_order: 20 },
    { code: 'mmol/L', label: 'mmol/L', sort_order: 30 },
    { code: 'U/L', label: 'U/L', sort_order: 40 },
    { code: '/mm3', label: '/mm3', sort_order: 50 },
    { code: '%', label: '%', sort_order: 60 },
  ],
  document_type: [
    { code: 'bon_examen', label: "Bon d'examen", description: 'Feuille remise au patient avec les examens à réaliser', sort_order: 10 },
    { code: 'ordonnance', label: 'Ordonnance', sort_order: 20 },
    { code: 'compte_rendu', label: 'Compte rendu', sort_order: 30 },
    { code: 'facture', label: 'Facture', sort_order: 40 },
  ],
  priority: [
    { code: 'normale', label: 'Normale', sort_order: 10 },
    { code: 'urgente', label: 'Urgente', sort_order: 20 },
    { code: 'stat', label: 'Stat', sort_order: 30 },
  ],
};