import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTigerSchema1763470763760 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP EXTENSION IF EXISTS postgis_tiger_geocoder CASCADE;`,
    );
    await queryRunner.query(
      `DROP EXTENSION IF EXISTS postgis_topology CASCADE;`,
    );
    await queryRunner.query(`DROP SCHEMA IF EXISTS tiger CASCADE;`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS tiger_data CASCADE;`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS topology CASCADE;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
