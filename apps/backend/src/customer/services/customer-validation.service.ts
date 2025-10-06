import { Injectable } from '@nestjs/common';
import { CustomerDTO } from '../dto/customer.dto';
import { CUSTOMER_BESUCHRHYTHMUS } from '../dto/customer.besuchrhythmus';

@Injectable()
export class CustomerValidationService {
  validate(customer: CustomerDTO, rawStrasse: string): string | null {
    const kennung_rhythmus: Record<string, string> = {};
    kennung_rhythmus['Pflegegrad 1'] = '1 Monat';
    kennung_rhythmus['Pflegegrad 2'] = '3 Monate';
    kennung_rhythmus['Pflegegrad 3'] = '6 Monate';

    let errors: string[] = [];

    if (!customer.besuchrhythmus) errors.push('Kein Besuchrhythmus');
    if (!customer.kennung) errors.push('Keine Kennung');
    if (
      customer.besuchrhythmus &&
      kennung_rhythmus[customer.kennung!] !== customer.besuchrhythmus
    )
      errors.push('Inkonsistent Kennung/Rhythmus');
    if (!customer.qs_besuch_historik) errors.push('Keine Historik');
    if (!customer.telefon && !customer.mobil)
      errors.push('Keine Telefon/Mobil Nummer');
    if (!customer.geom) errors.push('Keine Geokodierung');

    // Check ob Straße verändert/normalisiert werden musste
    const ganzeStr =
      customer.strasse +
      (customer.hnr ? ' ' + customer.hnr : '') +
      (customer.adz ?? '');
    if (ganzeStr !== rawStrasse) errors.push('Addresse geändert');

    return errors.length > 0 ? errors.join('\n') : null;
  }
}
