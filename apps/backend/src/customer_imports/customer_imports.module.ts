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
import { CustomerQueryService } from 'src/customer/services/customer-query.service';
import { CustomerModule } from 'src/customer/customer.module';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerImport]), CustomerModule],
  controllers: [CustomerImportsController],
  providers: [
    ExcelReaderService,
    ImportMappingService,
    ImportValidationService,
    StagingWriterService,
    CustomerImportsService,
  ],
})
export class CustomerImportsModule {}
