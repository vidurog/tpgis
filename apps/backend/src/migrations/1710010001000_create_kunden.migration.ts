import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKunden1710010001000 implements MigrationInterface {
  name = 'CreateKunden1710010001000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE IF NOT EXISTS kunden (
        kundennummer            text PRIMARY KEY,
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
        planmonat               date,
        termin                  timestamptz,
        termindauer_min         integer,
        terminstatus            text,
        termingrund             text,
        reihenfolge_nr          integer,
        parken                  text,
        bemerkung               text,
        datenfehler             boolean NOT NULL DEFAULT false,
        begruendung_datenfehler text,
        aktiv                   boolean NOT NULL DEFAULT true
      );
    `);

    await q.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = 'kunden_geom_gix'
        ) THEN
          EXECUTE 'CREATE INDEX kunden_geom_gix ON kunden USING GIST (geom)';
        END IF;
      END$$;
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS kunden_geom_gix;`);
    await q.query(`DROP TABLE IF EXISTS kunden;`);
  }
}
