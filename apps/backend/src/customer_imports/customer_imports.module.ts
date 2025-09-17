// apps/backend/src/imports/imports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerImport } from './customer_import.entity';
import { ExcelReaderService } from './services/excel-reader.service';
import { ImportMappingService } from './services/import-mapping.service';
import { ImportValidationService } from './services/import-validation.service';
import { StagingWriterService } from './services/staging-writer.service';
import { CustomerImportsService } from './services/customer_imports.service';
import { CustomerImportsController } from './customer_imports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerImport])],
  controllers: [CustomerImportsController],
  providers: [
    ExcelReaderService,
    ImportMappingService,
    ImportValidationService,
    StagingWriterService,
    CustomerImportsService,
  ],
  exports: [CustomerImportsService],
})
export class CustomerImportsModule {}
