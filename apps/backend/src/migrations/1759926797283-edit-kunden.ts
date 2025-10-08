import { MigrationInterface, QueryRunner } from 'typeorm';

export class EditKunden1759926797283 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('kunden', [
      'planmonat',
      'termin',
      'termindauer_min',
      'terminstatus',
      'termingrund',
      'reihenfolge_nr',
      'parken',
      'bemerkung',
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
