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

    const size: TableColumn = new TableColumn({
      name: 'size',
      type: 'int',
      isNullable: false,
      default: 0,
    });
    // Alter inserted_rows to be not nullable
    await queryRunner.changeColumn(
      'tp_gis_import.kunden_import_runs',
      'inserted_rows',
      new TableColumn({
        name: 'inserted_rows',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
    );

    // Add Columns
    await queryRunner.addColumn(
      'tp_gis_import.kunden_import_runs',
      deletedRows,
    );
    await queryRunner.addColumn(
      'tp_gis_import.kunden_import_runs',
      updatedRows,
    );
    await queryRunner.addColumn('tp_gis_import.kunden_import_runs', fileName);
    await queryRunner.addColumn('tp_gis_import.kunden_import_runs', size);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'tp_gis_import.kunden_import_runs',
      'deleted_rows',
    );
    await queryRunner.dropColumn(
      'tp_gis_import.kunden_import_runs',
      'updated_rows',
    );
    await queryRunner.dropColumn(
      'tp_gis_import.kunden_import_runs',
      'file_name',
    );
    await queryRunner.dropColumn('tp_gis_import.kunden_import_runs', 'size');
  }
}
