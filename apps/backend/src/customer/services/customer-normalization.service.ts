import { Injectable } from '@nestjs/common';
import { CustomerDTO } from '../dto/customer.dto';

@Injectable()
export class CustomerNormalization {
  normalizeDTO(customerDTO: CustomerDTO): CustomerDTO {
    return {
      kundennummer: '000',
      kunde: 'Leon',
      strasse: null,
      plz: null,
      ort: null,
      telefon: null,
      mobil: null,
      geburtstag: null,
      kennung: null,
      start: null,
      ende: null,
      auftraege: null,
      serviceberater: null,
      besuchrhythmus: null,
      qs_besuch_datum: null,
      qs_besuch_art: null,
      qs_besuch_historik: null,
      qs_besuch_hinweis_1: null,
      qs_besuch_hinweis_2: null,
      geom: null,
      planmonat: null,
      termin: null, // Date
      termindauer_min: null,
      terminstatus: null,
      termingrund: null,
      reihenfolge_nr: null,
      parken: null,
      bemerkung: null,
      datenfehler: false,
      begruendung_datenfehler: null,
      aktiv: true,
    };
  }

  createKundennummer(name: string, strasse: string): string {
    return '';
  }

  createPlanmonat(
    historik: string | null,
    rhythmus: string | null,
  ): string | null {
    return '';
  }
}
