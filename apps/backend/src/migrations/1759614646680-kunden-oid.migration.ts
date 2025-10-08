import { MigrationInterface, QueryRunner } from 'typeorm';

export class KundenOid1759614646680 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE kunden
            ADD gebref_oid text NULL;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
