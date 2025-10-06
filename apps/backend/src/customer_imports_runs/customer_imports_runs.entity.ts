import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'kunden_import_runs' })
export class CustomerImportRuns {
  @PrimaryColumn({ name: 'import_id', type: 'bigint' })
  import_id!: string;

  @Column({ name: 'imported_at', type: 'timestamptz' })
  imported_at!: Date;

  @Column({ name: 'imported_by', type: 'text' })
  imported_by!: string;

  @Column({ name: 'merged', type: 'boolean', default: false })
  merged: boolean;

  @Column({ name: 'inserted_rows', type: 'int' })
  inserted_rows: number;
}
