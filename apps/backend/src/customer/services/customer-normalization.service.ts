// src/customer/services/customer-normalization.service.ts
import { Injectable } from '@nestjs/common';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

@Injectable()
export class CustomerNormalization {
  /**
   * Normalisiert einen Namen in die Form:
   * - "Nachname, Vorname" → `[Vorname, Nachname]` (beide Teile "Title Case"; Bindestriche bleiben, z. B. "Anna-Lena")
   * - "mustermann, max"   → `["Max", "Mustermann"]`
   *
   * @param name Vollständiger Name im Format "Nachname, Vorname"
   * @returns Tupel `[vorname, nachname]`
   * @throws Error Wenn kein Name übergeben wurde
   *
   * @example
   * ```ts
   * normalizeName('müller, anna-lena') // ["Anna-Lena","Müller"]
   * ```
   */
  normalizeName(name: string): [vorname: string, nachname: string] {
    if (!name) throw Error('normalizeName: Kein Kundenname!');

    // Hilfsfunktion: "Title Case" pro Segment (auch hinter Bindestrichen)
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

    // Erwartetes Eingabeformat: "Nachname, Vorname"
    let [nachname, vorname] = name
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    vorname = normName(vorname);
    nachname = normName(nachname);

    return [vorname, nachname];
  }

  /**
   * Normalisiert eine Straßenangabe und trennt die Bestandteile.
   *
   * - Korrigiert Leerzeichen um Bindestriche (z. B. "A - Straße" → "A-Straße")
   * - Ersetzt "strasse"/"str." → "Straße" (inkl. Titel-Case auf Tokens und Segmenten nach Bindestrich)
   * - Trennt **Hausnummer** inkl. Bereichen und **Adresszusatz** (ein Buchstabe) ab
   *
   * @param strasse Rohe Straßenangabe, z. B. "elisabeth-selber -str. 68 - 70 a"
   * @returns `[streetPart, hnr, adz]` (z. B. `["Elisabeth-Selber-Straße","68-70","a"]`)
   *
   * @example
   * ```ts
   * normalizeStrasse('Musterstr. 12a') // ["Musterstraße","12","a"]
   * normalizeStrasse('Musterstraße 68 - 70') // ["Musterstraße","68-70",null]
   * ```
   */
  normalizeStrasse(strasse: string): [string, string | null, string | null] {
    if (!strasse) return ['', null, null];
    strasse = strasse.trim().replace(/\s+/g, ' ').replace(',', '');

    // 🔹 0) Typische Tippfehler / unnötige Leerzeichen bereinigen:
    //    Leerzeichen rund um Bindestrich zwischen Buchstaben entfernen
    //    "Elisabeth-Selber -Straße" -> "Elisabeth-Selber-Straße"
    strasse = strasse.replace(/(\p{L})\s*-\s*(\p{L})/gu, '$1-$2');

    // 1) Straße / Hausnummer (+ optionaler 1-Buchstaben-Zusatz) trennen.
    //    Erlaubt: "68-70", "68 - 70", "68/70", "68 / 70", "12a"
    //    Regex-Gruppen:
    //      (.*?)                         → Straße (lazy)
    //      (\d+(?:\s*[-\/]\s*\d+)?)      → HNR oder HNR-Bereich (z. B. "12", "12-14", "12/14")
    //      (?:\s*([a-zA-Z]))?            → optionaler 1-Zeichen-Zusatz (z. B. "a")
    const m = strasse.match(
      /^(.*?)(\d+(?:\s*[-\/]\s*\d+)?)(?:\s*([a-zA-Z]))?$/u,
    );
    if (!m) return ['', null, null];

    let streetPart = m[1].trim();
    let hnr = m[2].trim();
    let adz: string | null = m[3] ? m[3].toLowerCase() : null;

    // 2) Straße normalisieren (Ersetzungen für "strasse"/"str.")
    streetPart = streetPart
      .replace(/(?<=\p{L})\s+strasse(?!\p{L})/giu, ' Straße')
      .replace(/(?<=\p{L})(-)\s*strasse(?!\p{L})/giu, '$1Straße')
      .replace(/(\p{L}{3,})strasse(?!\p{L})/giu, '$1straße')
      .replace(/(?<=\p{L})\s+str\.?(?!\p{L})/giu, ' Straße')
      .replace(/(?<=\p{L})(-)\s*str\.?(?!\p{L})/giu, '$1Straße')
      .replace(/(\p{L}{3,})str\.?(?!\p{L})/giu, '$1straße')
      .replace(/\.\s*$/u, '');

    // 3) Titel-Case + korrekte Groß-/Kleinschreibung pro Token und Bindestrich-Segment
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

    // 4) Hausnummer bereinigen (einheitliche Trennzeichen, Trim)
    hnr = hnr
      .toLowerCase()
      .replace(/\s*-\s*/g, '-') // "68 - 70" -> "68-70"
      .replace(/\s*\/\s*/g, '/') // "68 / 70" -> "68/70"
      .replace(/\s+/g, ' ')
      .trim();

    return [streetPart, hnr, adz];
  }

  /**
   * Minimal-Normalisierung des Ortsnamens.
   * @param strasse (Historische Benennung; tatsächlich wird der **Ort** übergeben)
   * @returns ggf. vereinheitlichte Ortsbezeichnung
   *
   * @remarks
   * Diese Methode vereinheitlicht aktuell nur "Mülheim" → "Mülheim an der Ruhr".
   * (Benennung des Parameters ist historisch bedingt.)
   */
  normalizeOrt(strasse: string): string {
    if (strasse.includes('Mülheim')) return 'Mülheim an der Ruhr';
    return strasse;
  }

  /**
   * Normalisiert Telefonnummern auf **E.164** (z. B. `"+492011023238"`) oder gibt `null` zurück.
   *
   * @param nummer Rohstring (mit/ohne Ländervorwahl, Sonderzeichen etc.)
   * @returns E.164-Format oder `null` falls nicht plausibel
   *
   * @remarks
   * - Primär wird `libphonenumber-js` (Region `"DE"`) verwendet.
   * - Fallback-Heuristik: bereinigt auf Ziffern/`+`, wandelt `00…` → `+…`,
   *   ergänzt fehlende Ländervorwahl als `+49` (bei ausreichend Ziffern).
   */
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

  /**
   * Normalisiert die Pflegegrad-Kennung auf vordefinierte Werte.
   *
   * @param kennung Eingabestring (z. B. "Pflegegrad 3")
   * @returns "Pflegegrad 1..4" oder "Kein Pflegegrad" bzw. `null` wenn keine Pflege-Angabe
   *
   * @remarks
   * Einfache Heuristik: enthält der String "Pflege" und eine Ziffer 1..4,
   * wird auf den jeweiligen Standardwert gemappt.
   */
  normalizeKennung(kennung: string | null): string | null {
    if (!kennung || !kennung?.includes('Pflege')) return null;
    else if (kennung.includes('1')) return 'Pflegegrad 1';
    else if (kennung.includes('2')) return 'Pflegegrad 2';
    else if (kennung.includes('3')) return 'Pflegegrad 3';
    else if (kennung.includes('4')) return 'Pflegegrad 4';
    else if (kennung.includes('5')) return 'Pflegegrad 5';
    else return null;
  }

  normalizeBesuchrhythmus(besuchrhythmus: string | null) {
    if (!besuchrhythmus) return null;
    if (besuchrhythmus.includes('6') || besuchrhythmus.includes('halb')) {
      return '6 Monate';
    }
    if (besuchrhythmus.includes('3') || besuchrhythmus.includes('viertel'))
      return '3 Monate';
    else return null;
  }

  normalizeKennungRhythmus(
    kennung: string | null,
    rhythmus: string | null,
  ): [string | null, string | null] {
    let norm_rhythmus: string | null = this.normalizeBesuchrhythmus(rhythmus);
    let norm_kennung: string | null = this.normalizeKennung(kennung);
    if (!kennung && !rhythmus) return [null, null];

    // Besuchrhythmus vorhanden -> Kennung setzen
    if (!kennung && rhythmus) {
      if (rhythmus!.includes('6') || rhythmus!.includes('halb')) {
        norm_rhythmus = '6 Monate';
        norm_kennung = `Pflegegrad 2*`;
      }
      if (rhythmus!.includes('3') || rhythmus!.includes('viertel')) {
        norm_rhythmus = '3 Monate';
        norm_kennung = `Pflegegrad 4*`;
      } else {
        norm_rhythmus = null;
      }
    }

    // Kennung vorhanden
    if (!rhythmus && kennung) {
      if (kennung!.includes('1')) {
        kennung = 'Pflegegrad 1';
        rhythmus = `6 Monate*`;
      } else if (kennung!.includes('2')) {
        norm_kennung = 'Pflegegrad 2';
        norm_rhythmus = `6 Monate*`;
      } else if (kennung!.includes('3')) {
        norm_kennung = 'Pflegegrad 3';
        norm_rhythmus = `6 Monate*`;
      } else if (kennung!.includes('4')) {
        norm_kennung = 'Pflegegrad 4';
        norm_rhythmus = `3 Monate*`;
      } else if (kennung!.includes('5')) {
        norm_kennung = 'Pflegegrad 5';
        norm_rhythmus = `6 Monate*`;
      }
    }

    return [norm_kennung, norm_rhythmus];
  }

  splitAuftraege(auftraege: string | null): [boolean, boolean] {
    if (!auftraege) return [false, false];
    const SGB_373 = auftraege.includes('37.3 SGB');
    const pflegefirma = auftraege.includes('Pflegefirma');
    // return [37.3 SGB, Pflegefirma]
    return [SGB_373, pflegefirma];
  }

  /**
   * Erzeugt eine einfache **Kundennummer** aus Nachname und Geburtsdatum.
   *
   * @param nachname Nachname
   * @param geburtstag Geburtstdatum
   * @returns generierte Kundennummer (z. B. `"MUST1994"`)
   */
  createKundennummer(
    nachname: string,
    vorname: string,
    geburtstag: Date | null,
  ): string {
    if (geburtstag) {
      const day = String(geburtstag.getDate()).padStart(2, '0');
      const month = String(geburtstag.getMonth() + 1).padStart(2, '0');
      const year = geburtstag.getFullYear();
      const kundennummer = `${nachname}${vorname}${day}${month}${year}`;
      return kundennummer;
    } else {
      return nachname + 'XXXX';
    }
  }

  /**
   * Berechnet den nächsten **Planmonat** basierend auf Historik + Besuchsrhythmus.
   *
   * - Erwartete Rhythmus-Formate: `"1 Monat"`, `"3 Monate"`, `"6 Monate"` (Leerzeichen optional)
   * - Setzt das Ergebnis auf den **1. des Zielmonats**
   *
   * @param historik Ausgangsdatum (z. B. letzter QS-Besuch)
   * @param rhythmus String mit Monatsanzahl, z. B. `"3 Monate"`
   * @returns Datum (1. Tag des Zielmonats) oder `null` bei unklarem Rhythmus
   *
   * @example
   * ```ts
   * createPlanmonat(new Date('2025-01-20'), '3 Monate') // 2025-04-01
   * ```
   */
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
