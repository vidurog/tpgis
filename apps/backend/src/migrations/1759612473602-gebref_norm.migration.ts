import { MigrationInterface, QueryRunner } from "typeorm";

export class GebrefNorm1759612473602 implements MigrationInterface {
    name = 'GebrefNorm1759612473602';

public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- 0) Extensions (idempotent)
      CREATE EXTENSION IF NOT EXISTS postgis;
      CREATE EXTENSION IF NOT EXISTS unaccent;
      CREATE EXTENSION IF NOT EXISTS pg_trgm;

      -- 1) Schema existiert?
      CREATE SCHEMA IF NOT EXISTS tp_gis;

      -- 2) Materialized View anlegen/ersetzen
      DROP MATERIALIZED VIEW IF EXISTS tp_gis.gebref_norm;

      CREATE MATERIALIZED VIEW tp_gis.gebref_norm AS
      SELECT
        g.oid,

        -- Straßen-Norm (Firma-Regeln) + unaccent/lower für robuste Joins
        lower(unaccent(topogrids.tg_norm_street_name(g.str))) AS street_norm,

        -- Hausnummer numerischer Teil ('' -> NULL -> ::int)
        NULLIF(topogrids.tg_house_no_num_part(g.hnr), '')::int AS hnr_num,

        -- Hausnummer-Suffix: bevorzugt adz, sonst Appendix aus hnr
        NULLIF(lower(COALESCE(g.adz, topogrids.tg_house_no_appendix(g.hnr))), '') AS hnr_suffix,

        -- Bereiche aus "12-14" ableiten; andernfalls auf hnr_num fallen
        CASE
          WHEN g.hnr ~ '^\\d+\\s*-\\s*\\d+$'
            THEN split_part(regexp_replace(g.hnr, '\\s*', '', 'g'), '-', 1)::int
          ELSE NULLIF(topogrids.tg_house_no_num_part(g.hnr), '')::int
        END AS hnr_from,
        CASE
          WHEN g.hnr ~ '^\\d+\\s*-\\s*\\d+$'
            THEN split_part(regexp_replace(g.hnr, '\\s*', '', 'g'), '-', 2)::int
          ELSE NULLIF(topogrids.tg_house_no_num_part(g.hnr), '')::int
        END AS hnr_to,

        -- Ort/Gemeinde/Kreis normalisiert
        lower(unaccent(g.gmd))   AS ort_norm,
        lower(unaccent(g.kreis)) AS kreis_norm,

        -- Quellwerte (schön) für optionale Übernahme/Anzeige
        g.str   AS street_src,
        g.hnr   AS hnr_src,
        g.adz   AS adz_src,
        g.gmd   AS ort_src,
        g.kreis AS kreis_src,
        g.strschl,
        g.ott,
        g.datum AS stichtag,

        -- Geometrie: UTM32 (EPSG:25832) -> WGS84 (EPSG:4326)
        ST_SetSRID(ST_MakePoint(g.ostwert, g.nordwert), 25832) AS geom_25832,
        ST_Transform(ST_SetSRID(ST_MakePoint(g.ostwert, g.nordwert), 25832), 4326) AS geom_4326
      FROM tp_gis.gebaeude g;

      -- 3) Indizes
      -- a) Eindeutiger Index (für CONCURRENTLY-Refresh & Eindeutigkeit)
      CREATE UNIQUE INDEX IF NOT EXISTS uix_gebref_norm_oid
        ON tp_gis.gebref_norm (oid);

      -- b) Haupt-Join-Keys
      CREATE INDEX IF NOT EXISTS idx_gebref_norm_main
        ON tp_gis.gebref_norm (ort_norm, street_norm, hnr_num, hnr_suffix);

      -- c) Ortsfilter
      CREATE INDEX IF NOT EXISTS idx_gebref_norm_loc
        ON tp_gis.gebref_norm (kreis_norm, ort_norm);

      -- d) Fuzzy für Straße
      CREATE INDEX IF NOT EXISTS idx_gebref_norm_street_trgm
        ON tp_gis.gebref_norm USING gin (street_norm gin_trgm_ops);

      -- e) Räumlich (optional, aber nützlich)
      CREATE INDEX IF NOT EXISTS idx_gebref_norm_geom
        ON tp_gis.gebref_norm USING gist (geom_4326);
    `);
  }


  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_gebref_norm_geom;
      DROP INDEX IF EXISTS idx_gebref_norm_street_trgm;
      DROP INDEX IF EXISTS idx_gebref_norm_loc;
      DROP INDEX IF EXISTS idx_gebref_norm_main;
      DROP INDEX IF EXISTS uix_gebref_norm_oid;

      DROP MATERIALIZED VIEW IF EXISTS tp_gis.gebref_norm;
    `);
  }
}
