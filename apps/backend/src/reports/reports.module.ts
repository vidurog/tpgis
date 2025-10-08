// src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsHistoryService } from './reports_history.service';
import { ReportsErrorService } from './reports_error.service';
import { CustomerImport } from 'src/customer_imports/customer_imports.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/customer/customer.entity';
import { CustomerImportRuns } from 'src/customer_imports_runs/customer_imports_runs.entity';

/**
 * ReportsModule: Endpunkte + Services für
 * - Import-Historie (Staging-Zeilen)
 * - Import-Runs (Läufe)
 * - Datenfehler-Reports inkl. XLSX-Export
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerImport]),
    TypeOrmModule.forFeature([Customer]),
    TypeOrmModule.forFeature([CustomerImportRuns]),
  ],
  controllers: [ReportsController],
  providers: [ReportsHistoryService, ReportsErrorService],
})
export class ReportsModule {}
