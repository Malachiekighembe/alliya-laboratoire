-- ============================================================================
-- Matricules : compteurs atomiques et fonction generate_matricule
-- Date: 2026-11-14
-- Idempotent : peut être rejouée sans risque.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Table des compteurs de matricules (par laboratoire, type d'entité, année)
-- ---------------------------------------------------------------------------
-- 1bis. Compatibilité : matricule_counters peut déjà exister avec une autre
--      forme (ex. créée par Prisma : id uuid PK, created_at DEFAULT now(),
--      updated_at timestamptz NOT NULL sans DEFAULT, last_number int
--      DEFAULT 0, UNIQUE (laboratory_id, entity_type, year)). Dans ce cas
--      CREATE TABLE IF NOT EXISTS est sans effet : on complète la table.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_table_exists       boolean;
    v_has_created_at     boolean;
    v_has_updated_at     boolean;
    v_updated_nullable   boolean;
    v_has_last_number    boolean;
    v_has_unique_triplet boolean;
    v_has_pk             boolean;
    v_has_nulls          boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'matricule_counters'
          AND c.relkind = 'r'
    ) INTO v_table_exists;

    IF NOT v_table_exists THEN
        RAISE NOTICE 'matricule_counters absente : créée par le CREATE TABLE ci-dessous.';
        RETURN;
    END IF;

    -- created_at -------------------------------------------------------------
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'matricule_counters'
          AND column_name = 'created_at'
    ) INTO v_has_created_at;

    IF NOT v_has_created_at THEN
        EXECUTE 'ALTER TABLE public.matricule_counters ADD COLUMN created_at timestamptz';
    END IF;

    EXECUTE 'ALTER TABLE public.matricule_counters ALTER COLUMN created_at SET DEFAULT now()';
    EXECUTE 'UPDATE public.matricule_counters SET created_at = now() WHERE created_at IS NULL';

    -- updated_at : NOT NULL conservée (le DEFAULT garantit la valeur à l'INSERT)
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'matricule_counters'
          AND column_name = 'updated_at'
    ) INTO v_has_updated_at;

    IF NOT v_has_updated_at THEN
        EXECUTE 'ALTER TABLE public.matricule_counters ADD COLUMN updated_at timestamptz';
    END IF;

    EXECUTE 'ALTER TABLE public.matricule_counters ALTER COLUMN updated_at SET DEFAULT now()';

    SELECT (is_nullable = 'YES')
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'matricule_counters'
      AND column_name = 'updated_at'
    INTO v_updated_nullable;

    IF v_updated_nullable THEN
        EXECUTE 'UPDATE public.matricule_counters SET updated_at = now() WHERE updated_at IS NULL';
    END IF;

    -- last_number : DEFAULT 0 ------------------------------------------------
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'matricule_counters'
          AND column_name = 'last_number'
    ) INTO v_has_last_number;

    IF v_has_last_number THEN
        EXECUTE 'ALTER TABLE public.matricule_counters ALTER COLUMN last_number SET DEFAULT 0';
    END IF;

    -- Unicité (laboratory_id, entity_type, year) : contrainte ou index unique ?
    SELECT EXISTS (
        SELECT 1
        FROM pg_index idx
        JOIN pg_class rel ON rel.oid = idx.indrelid
        JOIN pg_namespace n ON n.oid = rel.relnamespace
        WHERE n.nspname = 'public'
          AND rel.relname = 'matricule_counters'
          AND idx.indisunique
          AND (
              SELECT array_agg(a.attname::text ORDER BY a.attname)
              FROM unnest(idx.indkey::int2[]) WITH ORDINALITY AS u(attnum, ord)
              JOIN pg_attribute a
                ON a.attrelid = idx.indrelid AND a.attnum = u.attnum
          ) = ARRAY['entity_type', 'laboratory_id', 'year']
    ) INTO v_has_unique_triplet;

    SELECT EXISTS (
        SELECT 1
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = rel.relnamespace
        WHERE n.nspname = 'public'
          AND rel.relname = 'matricule_counters'
          AND con.contype = 'p'
    ) INTO v_has_pk;

    IF v_has_unique_triplet THEN
        RAISE NOTICE 'matricule_counters : unicité (laboratory_id, entity_type, year) déjà en place.';
    ELSIF v_has_pk THEN
        -- PK existante sur d'autres colonnes (ex. id uuid) : l'ON CONFLICT a
        -- besoin d'un index unique sur le triplet.
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_matricule_counters_laboratory_entity_year'
             || ' ON public.matricule_counters (laboratory_id, entity_type, year)';
    ELSE
        SELECT EXISTS (
            SELECT 1
            FROM public.matricule_counters
            WHERE laboratory_id IS NULL OR entity_type IS NULL OR year IS NULL
        ) INTO v_has_nulls;

        IF v_has_nulls THEN
            RAISE EXCEPTION 'matricule_counters : lignes sans laboratory_id/entity_type/year, clé primaire impossible.';
        END IF;

        EXECUTE 'ALTER TABLE public.matricule_counters ALTER COLUMN laboratory_id SET NOT NULL';
        EXECUTE 'ALTER TABLE public.matricule_counters ALTER COLUMN entity_type SET NOT NULL';
        EXECUTE 'ALTER TABLE public.matricule_counters ALTER COLUMN year SET NOT NULL';
        EXECUTE 'ALTER TABLE public.matricule_counters ADD PRIMARY KEY (laboratory_id, entity_type, year)';
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS matricule_counters (
    laboratory_id uuid NOT NULL,
    entity_type   text NOT NULL,
    year          int  NOT NULL,
    last_number   bigint NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (laboratory_id, entity_type, year)
);

-- ---------------------------------------------------------------------------
-- 2. Fonction atomique de génération de matricule
--    Format : LAB/<CODE>/<YEAR>/<4-digit counter>
--    Exemple : LAB/PAT/2026/0001
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_matricule(
    p_laboratory_id uuid,
    p_entity_type   text,
    p_prefix        text DEFAULT 'LAB'
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_year        int;
    v_last_number bigint;
BEGIN
    v_year := EXTRACT(YEAR FROM NOW())::int;

    -- created_at / updated_at sont renseignés par leurs DEFAULT respectifs.
    INSERT INTO matricule_counters (laboratory_id, entity_type, year, last_number)
    VALUES (p_laboratory_id, p_entity_type, v_year, 1)
    ON CONFLICT (laboratory_id, entity_type, year)
    DO UPDATE SET
        last_number = matricule_counters.last_number + 1,
        updated_at  = now()
    RETURNING last_number INTO v_last_number;

    RETURN p_prefix || '/' || p_entity_type || '/' || v_year::text || '/' || lpad(v_last_number::text, 4, '0');
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Seed des compteurs initiaux pour tous les codes requis
--    Codes dans le périmètre : PAT, REC, TEC, BIO, VIS, DEM, PRE, ECH, ANA,
--    RES, RAP, FAC, PAY. Codes déjà émis (compatibilité) : CAR, CON, PRN,
--    REN, DOC.
-- ---------------------------------------------------------------------------
INSERT INTO matricule_counters (laboratory_id, entity_type, year, last_number)
SELECT l.id, codes.code, EXTRACT(YEAR FROM NOW())::int, 0
FROM laboratories l
CROSS JOIN (
    VALUES
        ('PAT'), ('REC'), ('TEC'), ('BIO'), ('VIS'),
        ('DEM'), ('PRE'), ('ECH'), ('ANA'), ('RES'),
        ('RAP'), ('FAC'), ('PAY'),
        ('CAR'), ('CON'), ('PRN'), ('REN'), ('DOC')
) AS codes(code)
ON CONFLICT (laboratory_id, entity_type, year) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Contraintes d'unicité sur les matricules (si les colonnes existent)
--    Tables concernées : patients, specimens, results, orders, visits, invoices
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT table_name
        FROM (
            VALUES ('patients'), ('specimens'), ('results'), ('orders'), ('visits'), ('invoices'), ('payments')
        ) AS t(table_name)
    LOOP
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name = r.table_name
              AND c.column_name IN ('matricule', 'laboratory_id')
            GROUP BY c.table_schema, c.table_name
            HAVING COUNT(*) = 2
        ) THEN
            EXECUTE format(
                'CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I (laboratory_id, matricule)',
                'uq_' || r.table_name || '_laboratory_matricule',
                r.table_name
            );
        END IF;
    END LOOP;
END;
$$;