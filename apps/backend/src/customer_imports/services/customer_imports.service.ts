// apps/backend/src/imports/customer-imports.service.ts
import { Injectable } from '@nestjs/common';
import { ExcelReaderService } from './excel-reader.service';
import { ImportMappingService } from './import-mapping.service';
import { ImportValidationService } from './import-validation.service';
import { StagingWriterService } from './staging-writer.service';
import { StagingDto } from '../dto/stage-import.dto';
import { CustomerImportsRunsService } from 'src/customer_imports_runs/customer_imports_runs.service';

type ImportRun = { import_id: string; user: string };
const BATCH_SIZE = 200;

@Injectable()
export class CustomerImportsService {
  constructor(
    private readonly reader: ExcelReaderService,
    private readonly mapper: ImportMappingService,
    private readonly validator: ImportValidationService,
    private readonly writer: StagingWriterService,
    private readonly runService: CustomerImportsRunsService,
  ) {}

  async importXlsxToStaging(filePath: string, run: ImportRun) {
    const imported_at = new Date();
    let seen = 0,
      staged = 0,
      failed = 0;
    let errors: string[] = [];
    let batch: StagingDto[] = [];

    // 1) Batch über WriterService in DB schreiben
    const flush = async () => {
      if (!batch.length) return;
      await this.writer.bulkInsert(batch);
      staged += batch.length;
      batch = [];
    };

    // 2) Kunden_import DTO setzen -> zu batch zufügen
    // ReaderService -> row
    // row -> MappingService -> dto
    // dto -> ValidationService -> dto
    // dto -> batch
    // batch -> flush
    for await (const rawRow of this.reader.rows(filePath)) {
      seen++;

      const dto0 = this.mapper.mapToStaging(rawRow, {
        import_id: run.import_id,
        imported_at: imported_at,
        imported_by: run.user,
      });

      const dto = this.validator.coerce(dto0);
      const res = this.validator.validate(dto);

      if (res.ok) {
        batch.push(dto);
        if (batch.length >= BATCH_SIZE) await flush();
      } else {
        failed++;
        errors.push(dto.kunde ?? 'kein kunde');
      }
    }

    await flush();
    // TODO errors handling
    console.error(errors);

    // 3) Add Import to ImportRun Database
    this.runService.addImport(
      String(run.import_id),
      imported_at,
      run.user,
      staged,
    );
    return { seen, staged, failed, import_id: String(run.import_id) };
  }
}
