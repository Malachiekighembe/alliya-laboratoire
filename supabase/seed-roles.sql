-- Seed des rôles CDC Alliya Labo
-- Format : code, nom, description, is_system

INSERT INTO "roles" ("id", "code", "name", "description", "is_system", "created_at", "updated_at")
VALUES
  ('r_adm', 'ADMIN', 'Administrateur', 'Gestion du personnel, rôles, permissions, configuration du laboratoire', true, now(), now()),
  ('r_rec', 'REC', 'Réceptionniste', 'Enregistrement patient, carnet, visites, demandes d analyses', true, now(), now()),
  ('r_cash', 'CASH', 'Caisse', 'Factures, encaissements, reçus, soldes', true, now(), now()),
  ('r_pre', 'PRE', 'Préleveur', 'Étiquettes, prélèvements, réception et suivi des échantillons', true, now(), now()),
  ('r_tech', 'TECH', 'Technicien', 'Traitement des échantillons et saisie des résultats', true, now(), now()),
  ('r_bio', 'BIO', 'Biologiste', 'Contrôle, validation et publication des résultats', true, now(), now()),
  ('r_stk', 'STK', 'Magasinier', 'Produits, réactifs, lots, mouvements de stock', true, now(), now()),
  ('r_dir', 'DIR', 'Direction', 'Tableaux de bord, activité, recettes, rapports', true, now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updated_at" = now();
