import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKundenFehler1761947059615 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Neue Tabelle kunden_fehler hinzufügen
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS kunden_fehler (
            kundennummer    text        PRIMARY KEY,
            import_id       bigint      NOT NULL,
            datenfehler     boolean     NOT NULL DEFAULT FALSE,
            geokodierbar    boolean     NOT NULL DEFAULT FALSE,
            klasse          text        NOT NULL,
            fehleranzahl    integer     NOT NULL DEFAULT 0,
            rhythmus        boolean     NOT NULL DEFAULT FALSE,
            kennung         boolean     NOT NULL DEFAULT FALSE,
            inkonsistenz    boolean     NOT NULL DEFAULT FALSE,
            historik        boolean     NOT NULL DEFAULT FALSE,
            kontakt         boolean     NOT NULL DEFAULT FALSE,
            geburtstag      boolean     NOT NULL DEFAULT FALSE,
            adresse_neu    text
      );
            
      CREATE INDEX IF NOT EXISTS idx_kunden_fehler_datenfehler_true
      ON kunden_fehler (kundennummer) WHERE datenfehler = true;
      
      CREATE INDEX IF NOT EXISTS idx_kunden_fehler_import_id
      ON kunden_import(import_id);
    `);

    // Fehler Attribute aus Tabelle kunden löschen
    await queryRunner.dropColumns('kunden', [
      'datenfehler',
      'begruendung_datenfehler',
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
