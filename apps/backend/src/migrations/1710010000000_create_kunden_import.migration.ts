import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKundenImport1710010000000 implements MigrationInterface {
  name = 'CreateKundenImport1710010000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE IF NOT EXISTS kunden_import (
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
      ON kunden_import(import_id);
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS idx_customer_imports_import_id;`);
    await q.query(`DROP TABLE IF EXISTS kunden_import;`);
  }
}
