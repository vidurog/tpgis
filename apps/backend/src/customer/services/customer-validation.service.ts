// src/customer/services/customer-validation.service.ts
import { Injectable } from '@nestjs/common';
import { CustomerDTO } from '../dto/customer.dto';
import { CUSTOMER_BESUCHRHYTHMUS } from '../dto/customer.besuchrhythmus';

@Injectable()
export class CustomerValidationService {
  /**
   * Prüft einen `CustomerDTO` auf typische Datenfehler und gibt eine
   * **Zeilenweise-Fehlerliste** als String zurück (oder `null`, wenn alles ok).
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
   * @returns `string` mit Fehlern getrennt durch `\n` oder `null`, wenn keine Fehler
   *
   * @remarks
   * Die Fehlermeldung "Addresse geändert" verwendet die Originalschreibweise aus deinem Code.
   * (Orthografie: „Adresse“ wäre mit einem „d“ – hier **keine** Codeänderung vorgenommen.)
   */
  validate(customer: CustomerDTO, rawStrasse: string): string | null {
    // Mapping: Kennung → erwarteter Besuchsrhythmus
    const kennung_rhythmus: Record<string, string> = {};
    kennung_rhythmus['Pflegegrad 1'] = CUSTOMER_BESUCHRHYTHMUS.Pflegegrad123;
    kennung_rhythmus['Pflegegrad 2'] = CUSTOMER_BESUCHRHYTHMUS.Pflegegrad123;
    kennung_rhythmus['Pflegegrad 3'] = CUSTOMER_BESUCHRHYTHMUS.Pflegegrad123;
    kennung_rhythmus['Pflegegrad 4'] = CUSTOMER_BESUCHRHYTHMUS.Pflegegrad45;
    kennung_rhythmus['Pflegegrad 5'] = CUSTOMER_BESUCHRHYTHMUS.Pflegegrad45;

    let errors: string[] = [];

    // Value Null errors
    if (!customer.besuchrhythmus) errors.push('Kein Besuchrhythmus');
    if (!customer.kennung) errors.push('Keine Kennung');
    if (!customer.qs_besuch_historik) errors.push('Keine Historik');
    if (!customer.geom) errors.push('Keine Geokodierung');
    if (!customer.geburtstag) errors.push('Kein Geburtstag');
    if (!customer.telefon && !customer.mobil)
      errors.push('Keine Telefon/Mobil Nummer');

    if (
      customer.besuchrhythmus &&
      customer.kennung &&
      kennung_rhythmus[customer.kennung!] !== customer.besuchrhythmus
    ) {
      errors.push('Inkonsistent Kennung/Rhythmus');
    }

    // Check ob Straße verändert/normalisiert werden musste
    const ganzeStr =
      customer.strasse +
      (customer.hnr ? ' ' + customer.hnr : '') +
      (customer.adz ?? '');
    if (ganzeStr !== rawStrasse) errors.push('Addresse geändert');

    // TODO weitere Validierungen

    return errors.length > 0 ? errors.join('\n') : null;
  }
}
