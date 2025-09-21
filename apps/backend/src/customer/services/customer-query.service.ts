import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerImport } from 'src/customer_imports/customer_import.entity';
import { Customer } from '../customer.entity';
import { Repository } from 'typeorm';
import { CustomerDTO } from '../dto/customer.dto';
import { CustomerNormalization } from './customer-normalization.service';
import { CustomerGeoService } from './customer-geo.service';
import { CustomerValidationService } from './customer-validation.service';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

@Injectable()
export class CustomerQueryService {
  constructor(
    @InjectRepository(CustomerImport)
    private readonly importRepo: Repository<CustomerImport>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,

    private readonly normService: CustomerNormalization,
    private readonly geomService: CustomerGeoService,
    private readonly validateService: CustomerValidationService,
  ) {}

  async mergeToCustomer(import_id: bigint) {
    let seen: string[] = [];

    // get Kunden_Import => rows
    const rows = await this.importRepo
      .createQueryBuilder()
      // .where(`insertedId = ${import_id}`)
      // .limit(1) // TEST PURPOSE
      .getMany();
    if (!rows) throw Error('No data on this import_id');

    for await (const [i, row] of rows.entries()) {
      let customer: CustomerDTO = {
        kundennummer: '000',
        nachname: row.kunde!,
        vorname: null,
        strasse: row.strasse,
        hnr: null,
        plz: row.plz,
        ort: row.ort,
        telefon: row.telefon,
        mobil: row.mobil,
        geburtstag: row.geburtstag ? new Date(row.geburtstag) : null,
        kennung: row.kennung,
        start: row.start ? new Date(row.start) : null,
        ende: row.ende ? new Date(row.ende) : null,
        auftraege: row.auftraege,
        serviceberater: row.serviceberater,
        besuchrhythmus: row.besuchrhythmus,
        qs_besuch_datum: row.qs_besuch_datum
          ? new Date(row.qs_besuch_datum)
          : null,
        qs_besuch_art: row.qs_besuch_art,
        qs_besuch_historik: row.qs_besuch_historik
          ? new Date(row.qs_besuch_historik)
          : null,
        qs_besuch_hinweis_1: row.qs_besuch_hinweis_1,
        qs_besuch_hinweis_2: row.qs_besuch_hinweis_2,
        geom: null,
        planmonat: null,
        termin: null, // Date // Logik TODO
        termindauer_min: null, // Logik TODO
        terminstatus: null, // Logik TODO
        termingrund: null, // Logik TODO
        reihenfolge_nr: null, // Logik TODO
        parken: null, // Logik TODO
        bemerkung: null, // Logik TODO
        datenfehler: false,
        begruendung_datenfehler: null,
        aktiv: true, // Logik TODO
      };
      // console.log('Customer: ', customer);

      // Test;
      // customer.besuchrhythmus = '3 Monate';

      [customer.vorname, customer.nachname] = this.normService.normalizeName(
        customer.nachname,
      );
      [customer.strasse, customer.hnr] = this.normService.normalizeStrasse(
        customer.strasse!,
      );

      customer.kundennummer = this.normService.createKundennummer(
        customer.nachname!,
        customer.strasse!,
        customer.hnr!,
      );
      customer.planmonat = this.normService.createPlanmonat(
        customer.qs_besuch_historik,
        customer.besuchrhythmus,
      );

      const point = await this.geomService.findGeom(
        customer.strasse,
        customer.hnr!,
        customer.plz!,
        customer.ort!,
      );
      customer.geom = point ?? null;

      const datenfehler: string | null = this.validateService.validate(
        customer,
        row.strasse!,
      );

      if (datenfehler) {
        customer.datenfehler = true;
        customer.begruendung_datenfehler = datenfehler;
      } else {
        customer.datenfehler = false;
        customer.begruendung_datenfehler = null;
      }

      const values: Record<string, any> = {};
      for (const [k, v] of Object.entries(customer)) {
        if (k === 'geom' && point) continue;
        values[k] = v;
      }

      if (point) {
        values.geom = () =>
          `ST_SetSRID(ST_MakePoint(${point.lon}, ${point.lat}), 4326)`;
      }

      // console.log('values\n', values);

      await this.customerRepo.upsert(
        values as QueryDeepPartialEntity<Customer>,
        { conflictPaths: ['kundennummer'], skipUpdateIfNoValuesChanged: true },
      );
    }

    // TODO set aktiv = false for all not in seen
  }
}
