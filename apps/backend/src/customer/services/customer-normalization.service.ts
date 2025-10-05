import { Injectable } from '@nestjs/common';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

@Injectable()
export class CustomerNormalization {
  normalizeName(name: string): [vorname: string, nachname: string] {
    if (!name) throw Error('normalizeName: Kein Kundenname!');

    const normName = (name: string) => {
      return name
        .split(' ')
        .map((tok) =>
          tok
            .split('-')
            .map(
              (seg) => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase(),
            )
            .join('-'),
        )
        .join(' ')
        .trim();
    };

    let [nachname, vorname] = name
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    vorname = normName(vorname);
    nachname = normName(nachname);

    return [vorname, nachname];
  }

  normalizeStrasse(strasse: string): [string, string | null, string | null] {
  if (!strasse) return ['', null, null];
  strasse = strasse.trim().replace(/\s+/g, ' ').replace(',', '');

  // 🔹 0) Typische Tippfehler / unnötige Leerzeichen bereinigen
  // Entfernt Leerzeichen vor und nach Bindestrich zwischen Buchstaben
  // "Elisabeth-Selber -Straße" -> "Elisabeth-Selber-Straße"
  strasse = strasse.replace(/(\p{L})\s*-\s*(\p{L})/gu, '$1-$2');

  // 1) Straße / Hausnummer (+ evtl. Zusatz) trennen
  // erlaubt 68-70, 68 - 70, 68/70, 68 / 70
  const m = strasse.match(/^(.*?)(\d+(?:\s*[-\/]\s*\d+)?)(?:\s*([a-zA-Z]))?$/u);
  if (!m) return ['', null, null];

  let streetPart = m[1].trim();
  let hnr = m[2].trim();
  let adz: string | null = m[3] ? m[3].toLowerCase() : null;

  // 2) Straße normalisieren
  streetPart = streetPart
    .replace(/(?<=\p{L})\s+strasse(?!\p{L})/giu, ' Straße')
    .replace(/(?<=\p{L})(-)\s*strasse(?!\p{L})/giu, '$1Straße')
    .replace(/(\p{L}{3,})strasse(?!\p{L})/giu, '$1straße')
    .replace(/(?<=\p{L})\s+str\.?(?!\p{L})/giu, ' Straße')
    .replace(/(?<=\p{L})(-)\s*str\.?(?!\p{L})/giu, '$1Straße')
    .replace(/(\p{L}{3,})str\.?(?!\p{L})/giu, '$1straße')
    .replace(/\.\s*$/u, '');

  // 3) Titel-Case + Bindestriche korrekt setzen
  streetPart = streetPart
    .split(' ')
    .map((tok) =>
      tok
        .split('-')
        .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase())
        .join('-'),
    )
    .join(' ');

  // 4) Hausnummer bereinigen
  hnr = hnr
    .toLowerCase()
    .replace(/\s*-\s*/g, '-')   // "68 - 70" -> "68-70"
    .replace(/\s*\/\s*/g, '/')  // "68 / 70" -> "68/70"
    .replace(/\s+/g, ' ')
    .trim();

  return [streetPart, hnr, adz];
}



  normalizeOrt(strasse: string): string {
    if(strasse.includes('Mülheim')) return 'Mülheim an der Ruhr';
    return strasse;
  }

  /** Gibt E.164 zurück (z. B. "+492011023238") oder null, wenn nichts Plausibles. */
  normalizeToE164(nummer: string | null): string | null {
    if (!nummer) return null;

    // offensichtliches Rausputzen (z. B. "+49 (0) ...")
    const raw = nummer.replace(/\(0\)/g, '').trim();
    try {
      const pn = parsePhoneNumberFromString(raw, 'DE'); // Default-Region: DE
      if (pn?.isValid()) return pn.number; // E.164
    } catch {
      /* ignore; gehe in Fallback */
    }

    // Fallback-Heuristik (wenn Parsing scheitert)
    // Behalte nur Ziffern und führendes "+"
    let s = raw.replace(/[^\d+]/g, '');

    // 00 → +
    if (s.startsWith('00')) s = '+' + s.slice(2);

    // Wenn mit + beginnt: akzeptiere, sofern genug Ziffern
    if (s.startsWith('+')) {
      const digits = s.slice(1).replace(/\D/g, '');
      return digits.length >= 6 ? '+' + digits : null;
    }

    // Sonst: lokale DE-Nummer → +49 + (ohne führende 0)
    const digits = s.replace(/\D/g, '');
    if (digits.length < 6) return null;
    const national = digits.startsWith('0') ? digits.slice(1) : digits;
    return '+49' + national;
  }

  normalizeKennung(kennung: string | null): string | null {
    if (!kennung || !kennung?.includes('Pflege')) return null;
    else if (kennung.includes('1')) return 'Pflegegrad 1';
    else if (kennung.includes('2')) return 'Pflegegrad 2';
    else if (kennung.includes('3')) return 'Pflegegrad 3';
    else if (kennung.includes('4')) return 'Pflegegrad 4';
    else return 'Kein Pflegegrad';
  }

  createKundennummer(
    vorname: string,
    name: string,
    strasse: string,
    hnr: string | null,
  ): string {
    const kundennummer =
      vorname.slice(0,3).toUpperCase() + name.slice(0,3).toUpperCase() + strasse.slice(0, 3).toUpperCase();
    return hnr
      ? (kundennummer + hnr).replace(' ', '')
      : (kundennummer + '000').replace(' ', '');
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
