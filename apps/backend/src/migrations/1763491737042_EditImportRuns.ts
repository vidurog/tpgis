import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EditImportRuns1763491737042 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const deletedRows: TableColumn = new TableColumn({
      name: 'deleted_rows',
      type: 'int',
      isNullable: false,
      default: 0,
    });
    const updatedRows: TableColumn = new TableColumn({
      name: 'updated_rows',
      type: 'int',
      isNullable: false,
      default: 0,
    });
    const fileName: TableColumn = new TableColumn({
      name: 'file_name',
      type: 'text',
      isNullable: true,
    });
    await queryRunner.addColumn(
      'tp_gis_import.kunden_import_runs',
      deletedRows,
    );
    await queryRunner.addColumn(
      'tp_gis_import.kunden_import_runs',
      updatedRows,
    );
    await queryRunner.addColumn('tp_gis_import.kunden_import_runs', fileName);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
