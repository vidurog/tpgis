// apps/backend/src/imports/staging-writer.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerImport } from '../customer_imports.entity';
import { StagingDto } from '../dto/stage-import.dto';

@Injectable()
export class StagingWriterService {
  constructor(
    @InjectRepository(CustomerImport)
    private readonly repo: Repository<CustomerImport>,
  ) {}

  /**
   * Führt einen **Bulk-Insert** in die Staging-Tabelle aus.
   *
   * @param rows Liste vorbereiteter {@link StagingDto}-Objekte
   * @remarks
   * - Schreibt **ohne Upsert/Conflict-Handling** (bewusst: Staging ist append-only).
   * - Überspringt leere Batches.
   */
  async bulkInsert(rows: StagingDto[]): Promise<void> {
    if (!rows.length) return;

    await this.repo
      .createQueryBuilder()
      .insert()
      .into(CustomerImport)
      .values(rows)
      .execute();
  }
}
