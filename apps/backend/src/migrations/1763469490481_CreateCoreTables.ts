import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreTables1763469490481 implements MigrationInterface {
  name = 'CreateCoreTables1763469490481';

  public async up(q: QueryRunner): Promise<void> {
    // 1) static_data.gebaeude (für gebref)
    await q.query(`
      CREATE TABLE IF NOT EXISTS static_data.gebaeude (
        nba         varchar(1),
        oid         text NOT NULL,
        qua         varchar(1),
        landschl    varchar(2),
        land        text,
        regbezschl  varchar(1),
        regbez      text,
        kreisschl   varchar(2),
        kreis       text,
        gmdschl     varchar(3),
        gmd         text,
        ottschl     varchar(4),
        ott         text,
        strschl     varchar(5),
        str         text,
        hnr         text,
        adz         text,
        zone        integer,
        ostwert     numeric,
        nordwert    numeric,
        datum       date,
        CONSTRAINT gebaeude_pk PRIMARY KEY (oid)
      );
    `);

    await q.query(`
      CREATE INDEX IF NOT EXISTS idx_gebaeude_gmd_str_hnr
        ON static_data.gebaeude (gmd, str, hnr, adz);

      CREATE INDEX IF NOT EXISTS idx_gebaeude_coords
        ON static_data.gebaeude (zone, ostwert, nordwert);

      CREATE INDEX IF NOT EXISTS idx_gebaeude_strschl
        ON static_data.gebaeude (strschl);
    `);

    // 2) static_data.plz (für PLZ_Gebiete)
    await q.query(`
      CREATE TABLE IF NOT EXISTS static_data.plz (
        plz      text     NOT NULL PRIMARY KEY,
        shape    geometry NOT NULL,
        aktiv    boolean,
        relevant boolean
      );
    `);

    await q.query(`
      CREATE INDEX IF NOT EXISTS plz_si
        ON static_data.plz USING gist (shape);
    `);

    // 3) tp_gis_import.kunden (Endzustand nach deinen alten Migrationen)
    await q.query(`
      CREATE TABLE IF NOT EXISTS tp_gis_import.kunden (
        kundennummer            text PRIMARY KEY,
        id                      bigserial,
        nachname                text,
        vorname                 text,
        strasse                 text,
        hnr                     text,
        adz                     text,
        plz                     text,
        ort                     text,
        telefon                 text,
        mobil                   text,
        geburtstag              date,
        kennung                 text,
        start                   date,
        ende                    date,
        auftraege               text,
        serviceberater          text,
        besuchrhythmus          text,
        qs_besuch_datum         date,
        qs_besuch_art           text,
        qs_besuch_historik      date,
        qs_besuch_hinweis_1     text,
        qs_besuch_hinweis_2     text,
        geom                    geometry(Point,4326),
        aktiv                   boolean NOT NULL DEFAULT true,
        gebref_oid              text,
        sgb_37_3                boolean NOT NULL DEFAULT false,
        pflegefirma             boolean NOT NULL DEFAULT false
      );
    `);

    await q.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'tp_gis_import'
            AND indexname = 'kunden_geom_gix'
        ) THEN
          EXECUTE 'CREATE INDEX kunden_geom_gix ON tp_gis_import.kunden USING GIST (geom)';
        END IF;
      END$$;
    `);

    // 4) tp_gis_import.kunden_import
    await q.query(`
      CREATE TABLE IF NOT EXISTS tp_gis_import.kunden_import (
        id                  bigserial PRIMARY KEY,
        import_id           bigint        NOT NULL,
        imported_at         timestamptz   NOT NULL,
        imported_by         text          NOT NULL,
        kunde               text,
        strasse             text,
        plz                 text,
        ort                 text,
        telefon             text,
        mobil               text,
        geburtstag          text,
        kennung             text,
        start               text,
        ende                text,
        auftraege           text,
        serviceberater      text,
        besuchrhythmus      text,
        qs_besuch_datum     text,
        qs_besuch_art       text,
        qs_besuch_historik  text,
        qs_besuch_hinweis_1 text,
        qs_besuch_hinweis_2 text
      );
    `);

    await q.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_imports_import_id
      ON tp_gis_import.kunden_import(import_id);
    `);

    // 5) tp_gis_import.kunden_import_runs
    await q.query(`
      CREATE TABLE IF NOT EXISTS tp_gis_import.kunden_import_runs (
        import_id      bigint        PRIMARY KEY,
        imported_at    timestamptz   NOT NULL,
        imported_by    text          NOT NULL,
        file_name       text          NOT NULL,
        merged         boolean       DEFAULT false,
        inserted_rows  int           NOT NULL
      );
    `);

    // 6) tp_gis_import.kunden_fehler
    await q.query(`
      CREATE TABLE IF NOT EXISTS tp_gis_import.kunden_fehler (
        kundennummer      text        PRIMARY KEY,
        datenfehler       boolean     NOT NULL DEFAULT FALSE,
        geom_fehler       boolean     NOT NULL DEFAULT FALSE,
        klasse            text        NOT NULL,
        fehleranzahl      integer     NOT NULL DEFAULT 0,
        rhythmus_fehler   boolean     NOT NULL DEFAULT FALSE,
        kennung_fehler    boolean     NOT NULL DEFAULT FALSE,
        inkonsistenz      boolean     NOT NULL DEFAULT FALSE,
        historik_fehler   boolean     NOT NULL DEFAULT FALSE,
        kontakt_fehler    boolean     NOT NULL DEFAULT FALSE,
        geburtstag_fehler boolean     NOT NULL DEFAULT FALSE,
        adresse_neu       text
      );
    `);

    await q.query(`
      CREATE INDEX IF NOT EXISTS idx_kunden_fehler_datenfehler_true
      ON tp_gis_import.kunden_fehler (kundennummer) WHERE datenfehler = true;
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(
      `DROP INDEX IF EXISTS tp_gis_import.idx_kunden_fehler_datenfehler_true;`,
    );
    await q.query(`DROP TABLE IF EXISTS tp_gis_import.kunden_fehler;`);
    await q.query(`DROP TABLE IF EXISTS tp_gis_import.kunden_import_runs;`);
    await q.query(
      `DROP INDEX IF EXISTS tp_gis_import.idx_customer_imports_import_id;`,
    );
    await q.query(`DROP TABLE IF EXISTS tp_gis_import.kunden_import;`);
    await q.query(`DROP INDEX IF EXISTS tp_gis_import.kunden_geom_gix;`);
    await q.query(`DROP TABLE IF EXISTS tp_gis_import.kunden;`);

    await q.query(`DROP INDEX IF EXISTS static_data.plz_si;`);
    await q.query(`DROP TABLE IF EXISTS static_data.plz;`);

    await q.query(`DROP INDEX IF EXISTS static_data.idx_gebaeude_strschl;`);
    await q.query(`DROP INDEX IF EXISTS static_data.idx_gebaeude_coords;`);
    await q.query(`DROP INDEX IF EXISTS static_data.idx_gebaeude_gmd_str_hnr;`);
    await q.query(`DROP TABLE IF EXISTS static_data.gebaeude;`);
  }
}
