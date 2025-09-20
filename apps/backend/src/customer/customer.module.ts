import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerImport } from 'src/customer_imports/customer_import.entity';
import { Customer } from './customer.entity';
import { CustomerNormalization } from './services/customer-normalization.service';
import { CustomerQueryService } from './services/customer-query.service';
import { CustomerGeoService } from './services/customer-geo.service';
import { CustomerValidationService } from './services/customer-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerImport]),
    TypeOrmModule.forFeature([Customer]),
  ],
  controllers: [],
  providers: [
    CustomerQueryService,
    CustomerNormalization,
    CustomerGeoService,
    CustomerValidationService,
  ],
  exports: [CustomerQueryService],
})
export class CustomerModule {}
