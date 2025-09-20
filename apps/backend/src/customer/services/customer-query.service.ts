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
      .limit(1)
      .getMany();
    if (!rows) throw Error('No data on this import_id');

    for await (const [i, row] of rows.entries()) {
      let customer: CustomerDTO = {
        kundennummer: '000',
        kunde: row.kunde!,
        strasse: row.strasse,
        plz: row.plz,
        ort: row.ort,
        telefon: row.telefon,
        mobil: row.mobil,
        geburtstag: row.geburtstag,
        kennung: row.kennung,
        start: row.start,
        ende: row.ende,
        auftraege: row.auftraege,
        serviceberater: row.serviceberater,
        besuchrhythmus: row.besuchrhythmus,
        qs_besuch_datum: row.qs_besuch_datum,
        qs_besuch_art: row.qs_besuch_art,
        qs_besuch_historik: row.qs_besuch_historik,
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

      customer = this.normService.normalizeDTO(customer);
      customer.kundennummer = this.normService.createKundennummer(
        customer.kunde,
        customer.strasse!,
      );
      customer.planmonat = this.normService.createPlanmonat(
        customer.qs_besuch_historik,
        customer.besuchrhythmus,
      );

      customer.geom = await this.geomService.findGeom(customer);

      const datenfehler: string | null =
        this.validateService.validate(customer);

      if (datenfehler) {
        customer.datenfehler = true;
        customer.begruendung_datenfehler = datenfehler;
      }

      const values: Record<string, any> = {};
      for (const [k, v] of Object.entries(customer)) {
        if (v !== null && v !== undefined) {
          values[k] = v;
        }
      }

      await this.customerRepo.upsert(
        values as QueryDeepPartialEntity<Customer>,
        { conflictPaths: ['kundennummer'], skipUpdateIfNoValuesChanged: true },
      );
    }
  }
}
