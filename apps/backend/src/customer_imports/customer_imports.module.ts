// apps/backend/src/imports/imports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerImport } from './customer_imports.entity';
import { ExcelReaderService } from './services/excel-reader.service';
import { ImportMappingService } from './services/import-mapping.service';
import { ImportValidationService } from './services/import-validation.service';
import { StagingWriterService } from './services/staging-writer.service';
import { CustomerImportsService } from './services/customer_imports.service';
import { CustomerImportsController } from './customer_imports.controller';
import { CustomerModule } from 'src/customer/customer.module';
import { CustomerImportsRunsService } from 'src/customer_imports_runs/customer_imports_runs.service';

/**
 * **CustomerImportsModule** kapselt den kompletten Import-Workflow:
 *
 * - **Controller**
 *   - {@link CustomerImportsController} – Datei-Upload (.xlsx) & Merge-Trigger
 *
 * - **Services (Import-Pipeline)**
 *   - {@link ExcelReaderService} – streamt XLSX zeilenweise (speicherschonend)
 *   - {@link ImportMappingService} – mappt Quellspalten → Staging-Felder (mit Transform)
 *   - {@link ImportValidationService} – prüft Pflichtfelder/Grundvalidierung
 *   - {@link StagingWriterService} – schreibt die Datensätze in die Staging-Tabelle
 *   - {@link CustomerImportsService} – orchestriert den gesamten Staging-Import
 *   - {@link CustomerImportsRunsService} – protokolliert Import-Läufe (Runs)
 *
 * - **Abhängigkeiten**
 *   - {@link TypeOrmModule.forFeature} mit {@link CustomerImport} (Staging-Entity)
 *   - {@link CustomerModule} – stellt u. a. Merge-/Validierungs-/Geokodierungslogik bereit
 *
 * @remarks
 * Dieses Modul erzeugt **noch keine** Cron/Queues; es stellt die Import-APIs
 * und die synchrone Pipeline bereit. Erweiterungen (z. B. BullMQ) können hier
 * später ergänzt werden, ohne die Controller-Signaturen zu ändern.
 */
@Module({
  imports: [TypeOrmModule.forFeature([CustomerImport]), CustomerModule],
  controllers: [CustomerImportsController],
  providers: [
    ExcelReaderService,
    ImportMappingService,
    ImportValidationService,
    StagingWriterService,
    CustomerImportsService,
    CustomerImportsRunsService,
  ],
})
export class CustomerImportsModule {}
