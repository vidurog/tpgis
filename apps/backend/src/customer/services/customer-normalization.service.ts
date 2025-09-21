import { Injectable } from '@nestjs/common';
import { CustomerDTO } from '../dto/customer.dto';

@Injectable()
export class CustomerNormalization {
  normalizeName(name: string): [vorname: string, nachname: string] {
    // PRIVATE
    if (!name) throw Error('normalizeName: Kein Kundenname!');

    const normName = (name: string) => {
      return name
        .split(' ')
        .map((word) =>
          word
            .split('-')
            .map(
              (part) =>
                part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
            )
            .join('-'),
        )
        .join(' ');
    };

    let [nachname, vorname] = name
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    vorname = normName(vorname);
    nachname = normName(nachname);

    return [vorname, nachname];
  }

  normalizeStrasse(strasse: string): string[] {
    strasse = strasse.trim().replace(/\s+/g, ' ');

    // 1. Split Straße / Hausnummer
    // Suche letzte Zahlengruppe am Ende
    const match = strasse.match(/^(.*?)(\d+\s*[a-zA-Z]?([-\/]\d+)?[a-zA-Z]?)$/);
    let streetPart = strasse;
    let hnr: string | null = null;

    if (match) {
      streetPart = match[1].trim();
      hnr = match[2].trim();
    }

    if (!hnr) throw Error('normalizeStraße: keine Hausnummer gefunden!');

    // 2. Straße normalisieren
    streetPart = streetPart
      .replace(/\bstrasse\b/gi, 'Straße')
      .replace(/\bstr\.\b/gi, 'Straße')
      .replace(/\bstr\b/gi, 'Straße')
      .replace(/(\p{L}{3,})str\.?(?=\b)/giu, '$1straße')
      .replace('.', '');

    // Title Case + Bindestriche behandeln
    streetPart = streetPart
      .split(' ')
      .map((tok) =>
        tok
          .split('-')
          .map(
            (seg) => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase(),
          )
          .join('-'),
      )
      .join(' ');

    // 3. Hausnummer normalisieren
    if (hnr) {
      hnr = hnr.toUpperCase().replace(/\s+/g, '');
    }

    return [streetPart, hnr];
  }

  createKundennummer(name: string, strasse: string, hnr: string): string {
    return `${name.slice(0, 3).toUpperCase()}${strasse.slice(0, 3).toUpperCase()}${hnr}`;
  }

  createPlanmonat(historik: Date | null, rhythmus: string | null): Date | null {
    if (!historik || !rhythmus) return null;

    // Rhythmus interpretieren: "1Monat", "3 Monate", "6Monate"
    const match = rhythmus.match(/(\d+)\s*(Monat|Monate)/i);
    if (!match) return null;

    const monthsToAdd = parseInt(match[1], 10);
    if (isNaN(monthsToAdd) || monthsToAdd <= 0) return null;

    // Datum + Rhythmus
    const newDate = new Date(historik);
    newDate.setMonth(newDate.getMonth() + monthsToAdd);
    newDate.setDate(1);

    return newDate;
  }
}
