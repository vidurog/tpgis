// src/customer/customer.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerImport } from 'src/customer_imports/customer_imports.entity';
import { Customer } from './customer.entity';
import { CustomerNormalization } from './services/customer-normalization.service';
import { CustomerWriterService } from './services/customer_writer.service';
import { CustomerGeoService } from './services/customer-geo.service';
import { CustomerErrorService } from './services/customer-error.service';
import { HttpModule } from '@nestjs/axios';
import { CustomerMergeService } from './customer-merge.service';
import { BuildingMatchService } from './services/building-match.service';
import { CustomerImportsRunsService } from 'src/customer_imports_runs/customer_imports_runs.service';
import { CustomerError } from './customer_errorrs.entity';

/**
 * **CustomerModule** bündelt Services & Entity-Konfiguration rund um Kunden:
 * - TypeORM-Repositories für `Customer`, `CustomerImport` und 'Customer_Error'
 * - Normalisierung (Namen, Adressen, Telefonnummern, Kennung)
 * - Upsert-/Deaktivierungslogik (Writer)
 * - Geokodierung (NRW OGC API) und Gebäudereferenz-Matching
 * - Validierung & Setzen von Fehlern
 * - Merge Pipeline
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
    TypeOrmModule.forFeature([CustomerError]),
    // HTTP-Client (Axios) für externe Dienste
    HttpModule,
  ],
  controllers: [],
  providers: [
    CustomerWriterService,
    CustomerNormalization,
    CustomerGeoService,
    CustomerErrorService,
    CustomerMergeService,
    BuildingMatchService,
    CustomerImportsRunsService,
  ],
  exports: [CustomerMergeService],
})
export class CustomerModule {}
