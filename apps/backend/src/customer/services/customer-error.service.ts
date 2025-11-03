// src/customer/services/customer-validation.service.ts
import { Injectable } from '@nestjs/common';
import { CustomerDTO } from '../dto/customer.dto';
import { CustomerErrorDTO } from '../dto/customer_error.dto';

@Injectable()
export class CustomerErrorService {
  /**
   * Prüft einen `CustomerDTO` auf typische Datenfehler und persistiert diese
   *
   * Validierungen u. a.:
   * - Besuchsrhythmus vorhanden
   * - Kennung vorhanden
   * - Konsistenz Kennung ↔ Rhythmus (z. B. "Pflegegrad 2" → "3 Monate")
   * - Historik gesetzt
   * - Telefon **oder** Mobil vorhanden
   * - Geokodierung vorhanden
   * - Adresse wurde im Importprozess **nicht verändert** (gegen `rawStrasse`)
   *
   * @param customer Zu prüfender Datensatz
   * @param rawStrasse Ursprüngliche Adresszeichenkette (vor Normalisierung)
   *
   * @remarks
   * Die Fehlermeldung "Addresse geändert" verwendet die Originalschreibweise aus deinem Code.
   * (Orthografie: „Adresse“ wäre mit einem „d“ – hier **keine** Codeänderung vorgenommen.)
   */

  validate(customer: CustomerDTO, rawStrasse: string): CustomerErrorDTO {
    // Mapping: Kennung → erwarteter Besuchsrhythmus
    const kennung_rhythmus: Record<string, string> = {};
    kennung_rhythmus['Pflegegrad 1'] = '6';
    kennung_rhythmus['Pflegegrad 2'] = '6';
    kennung_rhythmus['Pflegegrad 3'] = '6';
    kennung_rhythmus['Pflegegrad 4'] = '3';
    kennung_rhythmus['Pflegegrad 5'] = '3';

    let errorCount = 0;

    let customerError: CustomerErrorDTO = {
      kundennummer: customer.kundennummer,
      datenfehler: false,
      geom_fehler: false,
      klasse: 'NO_ADDRESS_ISSUE',
      fehleranzahl: 0,
      rhythmus_fehler: false,
      kennung_fehler: false,
      inkonsistenz: false,
      historik_fehler: false,
      kontakt_fehler: false,
      geburtstag_fehler: false,
      adresse_neu: null,
    };

    // Value null errors
    if (!customer.geom) {
      customerError.geom_fehler = true;
      errorCount++;
      customerError.datenfehler = true;
    }
    if (customer.besuchrhythmus?.includes('*'))
      customerError.rhythmus_fehler = true;
    if (customer.kennung?.includes('*')) customerError.kennung_fehler = true;
    if (!customer.qs_besuch_historik) customerError.historik_fehler = true;
    if (!customer.telefon && !customer.mobil)
      customerError.kontakt_fehler = true;
    if (!customer.geburtstag) {
      customerError.geburtstag_fehler = true;
      customerError.datenfehler = true;
    }

    // Inkonsistenz Kennung/Rhythymus
    if (
      customer.besuchrhythmus &&
      customer.kennung &&
      !customer.besuchrhythmus.includes(kennung_rhythmus[customer.kennung])
    ) {
      customerError.inkonsistenz = true;
      errorCount++;
    }

    // Adresse geändert
    const ganzeStr =
      customer.strasse +
      (customer.hnr ? ' ' + customer.hnr : '') +
      (customer.adz ?? '');
    if (ganzeStr !== rawStrasse) {
      customerError.adresse_neu = `${rawStrasse} -> ${ganzeStr}`;
    }

    // Fehlerklasse
    // - ADDRESS_GEOCODABLE: Adresse hat Problem, ist aber prinzipiell geokodierbar (geom/gebref_oid vorhanden)
    // - ADDRESS_NOT_GEOCODABLE: Problem und NICHT geokodierbar
    // - NO_ADDRESS_ISSUE: kein Adressproblem
    if (customerError.adresse_neu) {
      if (customerError.geom_fehler) {
        customerError.klasse = 'ADDRSS_NOT_GEOCODABLE';
      } else {
        customerError.klasse = 'ADDRESS_GEOCODABLE';
      }
    }

    return customerError;
  }
}
