import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerImport } from 'src/customer_imports/customer_imports.entity';
import { Customer } from './customer.entity';
import { CustomerNormalization } from './services/customer-normalization.service';
import { CustomerWriterService } from './services/customer_writer.service';
import { CustomerGeoService } from './services/customer-geo.service';
import { CustomerValidationService } from './services/customer-validation.service';
import { HttpModule } from '@nestjs/axios';
import { CustomerMergeService } from './customer-merge.service';
import { BuildingMatchService } from './services/building-match.service';
import { CustomerImportsRunsService } from 'src/customer_imports_runs/customer_imports_runs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerImport]),
    TypeOrmModule.forFeature([Customer]),
    HttpModule,
  ],
  controllers: [],
  providers: [
    CustomerWriterService,
    CustomerNormalization,
    CustomerGeoService,
    CustomerValidationService,
    CustomerMergeService,
    BuildingMatchService,
    CustomerImportsRunsService,
  ],
  exports: [CustomerMergeService],
})
export class CustomerModule {}
