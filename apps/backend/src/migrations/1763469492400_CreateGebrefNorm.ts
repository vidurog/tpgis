import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGebrefNorm1763469492400 implements MigrationInterface {
  name = 'CreateGebrefNorm1763469492400';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      DROP MATERIALIZED VIEW IF EXISTS tp_gis_import.gebref_norm;
    `);

    await q.query(`
      CREATE MATERIALIZED VIEW tp_gis_import.gebref_norm AS
      SELECT g.oid,
             lower(unaccent(topogrids.tg_norm_street_name(g.str::character varying)::text)) AS street_norm,
             NULLIF(topogrids.tg_house_no_num_part(g.hnr), ''::text)::integer               AS hnr_num,
             NULLIF(lower(COALESCE(g.adz, topogrids.tg_house_no_appendix(g.hnr))),
                    ''::text)                                                                AS hnr_suffix,
             CASE
                 WHEN g.hnr ~ '^\\d+\\s*-\\s*\\d+$'::text THEN split_part(
                         regexp_replace(g.hnr, '\\s*'::text, ''::text, 'g'::text), '-'::text, 1)::integer
                 ELSE NULLIF(topogrids.tg_house_no_num_part(g.hnr), ''::text)::integer
                 END                                                                         AS hnr_from,
             CASE
                 WHEN g.hnr ~ '^\\d+\\s*-\\s*\\d+$'::text THEN split_part(
                         regexp_replace(g.hnr, '\\s*'::text, ''::text, 'g'::text), '-'::text, 2)::integer
                 ELSE NULLIF(topogrids.tg_house_no_num_part(g.hnr), ''::text)::integer
                 END                                                                         AS hnr_to,
             lower(unaccent(g.gmd))                                                          AS ort_norm,
             lower(unaccent(g.kreis))                                                        AS kreis_norm,
             p.plz,
             g.str                                                                           AS street_src,
             g.hnr                                                                           AS hnr_src,
             g.adz                                                                           AS adz_src,
             g.gmd                                                                           AS ort_src,
             g.kreis                                                                         AS kreis_src,
             g.strschl,
             g.ott,
             g.datum                                                                         AS stichtag,
             st_setsrid(st_makepoint(g.ostwert::double precision, g.nordwert::double precision),
                        25832)                                                               AS geom_25832,
             st_transform(st_setsrid(st_makepoint(g.ostwert::double precision, g.nordwert::double precision), 25832),
                          4326)                                                              AS geom_4326
      FROM static_data.gebaeude g
               JOIN static_data.plz p
                    ON st_contains(p.shape, st_point(g.ostwert::double precision, g.nordwert::double precision, 25832))
      WHERE p.relevant;
    `);

    await q.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uix_gebref_norm_oid
        ON tp_gis_import.gebref_norm (oid);

      CREATE INDEX IF NOT EXISTS idx_gebref_norm_main
        ON tp_gis_import.gebref_norm (ort_norm, street_norm, hnr_num, hnr_suffix);

      CREATE INDEX IF NOT EXISTS idx_gebref_norm_loc
        ON tp_gis_import.gebref_norm (kreis_norm, ort_norm);

      CREATE INDEX IF NOT EXISTS idx_gebref_norm_street_trgm
        ON tp_gis_import.gebref_norm USING gin (street_norm gin_trgm_ops);

      CREATE INDEX IF NOT EXISTS idx_gebref_norm_geom
        ON tp_gis_import.gebref_norm USING gist (geom_4326);
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS idx_gebref_norm_geom;`);
    await q.query(`DROP INDEX IF EXISTS idx_gebref_norm_street_trgm;`);
    await q.query(`DROP INDEX IF EXISTS idx_gebref_norm_loc;`);
    await q.query(`DROP INDEX IF EXISTS idx_gebref_norm_main;`);
    await q.query(`DROP INDEX IF EXISTS uix_gebref_norm_oid;`);

    await q.query(
      `DROP MATERIALIZED VIEW IF EXISTS tp_gis_import.gebref_norm;`,
    );
  }
}
