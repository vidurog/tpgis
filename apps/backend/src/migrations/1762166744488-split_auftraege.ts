import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class splitAuftraege1762166744488 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.addColumns(`kunden`, [
      new TableColumn({
        name: 'sgb_37_3',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'pflegefirma',
        type: 'boolean',
        default: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
