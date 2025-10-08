// src/customer/customer.module.ts
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

/**
 * **CustomerModule** bündelt Services & Entity-Konfiguration rund um Kunden:
 * - TypeORM-Repositories für `Customer` und `CustomerImport`
 * - Normalisierung (Namen, Adressen, Telefonnummern, Kennung)
 * - Upsert-/Deaktivierungslogik (Writer)
 * - Geokodierung (NRW OGC API) und Gebäudereferenz-Matching
 * - Validierung & Merge-Pipeline
 *
 * @remarks
 * - `HttpModule` wird für externe API-Aufrufe (Geokodierung) benötigt.
 * - `exports: [CustomerMergeService]` stellt die Merge-Pipeline anderen Modulen bereit.
 */
@Module({
  imports: [
    // Repositories registrieren (separat aufgeführt zwecks Klarheit)
    TypeOrmModule.forFeature([CustomerImport]),
    TypeOrmModule.forFeature([Customer]),
    // HTTP-Client (Axios) für externe Dienste
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
