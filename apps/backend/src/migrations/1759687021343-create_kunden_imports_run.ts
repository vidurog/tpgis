import { MigrationInterface, QueryRunner } from 'typeorm';

export class KundenImportsRuns1759687021343 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS kunden_import_runs (
            import_id           bigint        PRIMARY KEY,
            imported_at         timestamptz   NOT NULL,
            imported_by         text          NOT NULL,
            merged              boolean       DEFAULT false,
            inserted_rows       int           NOT NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
