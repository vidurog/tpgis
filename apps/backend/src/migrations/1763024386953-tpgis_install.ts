import { MigrationInterface, QueryRunner } from 'typeorm';

export class tpgisInstall1763024386953 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`
        CREATE SCHEMA tp_gis_import;
        ALTER TABLE kunden_fehler SET SCHEMA tp_gis_import;
        ALTER TABLE kunden_import SET SCHEMA tp_gis_import;
        ALTER TABLE kunden_import_runs SET SCHEMA tp_gis_import;
        ALTER TABLE kunden SET SCHEMA tp_gis_import;
        
        CREATE SCHEMA static_data;
        ALTER TABLE tp_gis.gebaeude SET SCHEMA static_data;
        `);

    queryRunner.query(`
        create table static_data.plz(
    plz      text     not null
        primary key,
    shape    geometry not null,
    aktiv    boolean,
    relevant boolean
);

create index plz_si
    on static_data.plz using gist (shape);
        `);

    queryRunner.query(`
            create materialized view tp_gis_import.gebref_norm as
SELECT g.oid,
       lower(unaccent(topogrids.tg_norm_street_name(g.str::character varying)::text))                                 AS street_norm,
       NULLIF(topogrids.tg_house_no_num_part(g.hnr), ''::text)::integer                                               AS hnr_num,
       NULLIF(lower(COALESCE(g.adz, topogrids.tg_house_no_appendix(g.hnr))),
              ''::text)                                                                                               AS hnr_suffix,
       CASE
           WHEN g.hnr ~ '^\\d+\\s*-\\s*\\d+$'::text THEN split_part(
                   regexp_replace(g.hnr, '\\s*'::text, ''::text, 'g'::text), '-'::text, 1)::integer
           ELSE NULLIF(topogrids.tg_house_no_num_part(g.hnr), ''::text)::integer
           END                                                                                                        AS hnr_from,
       CASE
           WHEN g.hnr ~ '^\\d+\\s*-\\s*\\d+$'::text THEN split_part(
                   regexp_replace(g.hnr, '\\s*'::text, ''::text, 'g'::text), '-'::text, 2)::integer
           ELSE NULLIF(topogrids.tg_house_no_num_part(g.hnr), ''::text)::integer
           END                                                                                                        AS hnr_to,
       lower(unaccent(g.gmd))                                                                                         AS ort_norm,
       lower(unaccent(g.kreis))                                                                                       AS kreis_norm,
       p.plz,
       g.str                                                                                                          AS street_src,
       g.hnr                                                                                                          AS hnr_src,
       g.adz                                                                                                          AS adz_src,
       g.gmd                                                                                                          AS ort_src,
       g.kreis                                                                                                        AS kreis_src,
       g.strschl,
       g.ott,
       g.datum                                                                                                        AS stichtag,
       st_setsrid(st_makepoint(g.ostwert::double precision, g.nordwert::double precision),
                  25832)                                                                                              AS geom_25832,
       st_transform(st_setsrid(st_makepoint(g.ostwert::double precision, g.nordwert::double precision), 25832),
                    4326)                                                                                             AS geom_4326
FROM static_data.gebaeude g
         JOIN static_data.plz p
              ON st_contains(p.shape, st_point(g.ostwert::double precision, g.nordwert::double precision, 25832))
WHERE p.relevant;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
