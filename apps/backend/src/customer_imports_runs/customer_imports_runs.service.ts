// src/customer_imports_runs/customer_imports_runs.service.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CustomerImportRuns } from './customer_imports_runs.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class CustomerImportsRunsService {
  /** TypeORM-Repository für `CustomerImportRuns`. */
  private runRepo: Repository<CustomerImportRuns>;

  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {
    // Repository über DataSource beziehen (statt Konstruktor-Injection).
    this.runRepo = this.ds.getRepository(CustomerImportRuns);
  }

  /**
   * Legt einen neuen **Import-Lauf** an.
   *
   * @param import_id Eindeutige Import-ID (z. B. Timestamp)
   * @param imported_at Zeitpunkt des Imports (Serverzeit)
   * @param imported_by Benutzer/Konto
   * @param inserted_rows Anzahl der ins Staging übernommenen Zeilen
   *
   * @example
   * ```ts
   * await runs.addImport('1759862061432', new Date(), 'leon', 127);
   * ```
   */
  async addImport(
    import_id: string,
    imported_at: Date,
    imported_by: string,
    inserted_rows: number,
  ) {
    const run = await this.runRepo.create({
      import_id: import_id,
      imported_at,
      imported_by,
      inserted_rows,
    });
    await this.runRepo.save(run);
  }

  /**
   * Markiert einen Import-Lauf als **gemerged** (`merged = true`).
   *
   * @param import_id Ziel-Lauf
   *
   * @remarks
   * Wird typischerweise nach erfolgreichem Merge in den Kundenbestand
   * vom Merge-Service aufgerufen.
   */
  async mergeImport(
    import_id: string,
    deleted_rows: number,
    updated_rows: number,
  ) {
    await this.runRepo.update(
      { import_id: import_id },
      { merged: true, deleted_rows, updated_rows },
    );
  }
}
