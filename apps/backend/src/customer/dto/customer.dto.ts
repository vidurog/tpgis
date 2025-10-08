// customer.dto.ts
import { CUSTOMER_TERMINSTATUS } from './customer.terminstatus';
import { CUSTOMER_TERMINGRUND } from './customer.termingrund';
import { CUSTOMER_PARKEN } from './customer.parken';

/**
 * Transport-/API-DTO für Kunden-Datensätze.
 *
 * @remarks
 * - Felder sind **bewusst nicht optional**, sondern erlauben `null` (vereinheitlichtes Schema).
 * - Datumsfelder sind `Date | null`; bei JSON-Übertragung i. d. R. als ISO-String (`YYYY-MM-DDTHH:mm:ss.sssZ`).
 * - `geom` verwendet Längengrad/Latitude (WGS84), z. B. `{ lon: 6.87, lat: 51.43 }`.
 */
export type CustomerDTO = {
  /** Eindeutige Kundennummer (fachlich). */
  kundennummer: string;

  /** Nachname der Person. */
  nachname: string;

  /** Vorname der Person. */
  vorname: string | null;

  /** Straßenname (unschön bereinigt/normalisiert). */
  strasse: string | null;

  /** Hausnummer inkl. Anhang (z. B. "14a"). */
  hnr: string | null;

  /** Postleitzahl (als String, führende Nullen möglich). */
  plz: string | null;

  /** Adresszusatz (z. B. "Hinterhaus", "EG li."). */
  adz: string | null;

  /** Ort / Stadt. */
  ort: string | null;

  /** Festnetz-Telefonnummer. */
  telefon: string | null;

  /** Mobil-Telefonnummer. */
  mobil: string | null;

  /** Geburtstag (nur Datumsteil relevant). */
  geburtstag: Date | null;

  /** Interne Kennung, z. B. "Pflegegrad 3". */
  kennung: string | null;

  /** Start-/Aufnahmedatum. */
  start: Date | null;

  /** Endedatum (z. B. Vertragsende), sonst `null`. */
  ende: Date | null;

  /** Beauftragte Leistungen als freier Text. */
  auftraege: string | null;

  /** Zuständige/r Serviceberater/in. */
  serviceberater: string | null;

  /** Besuchsrhythmus als freier Text (z. B. "3 Monate"). */
  besuchrhythmus: string | null;

  /** Datum des letzten QS-Besuchs. */
  qs_besuch_datum: Date | null;

  /** Art des QS-Besuchs (frei). */
  qs_besuch_art: string | null;

  /** Historik-Zeitpunkt zum QS-Besuch. */
  qs_besuch_historik: Date | null;

  /** Freitext-Hinweis 1 zum QS-Besuch. */
  qs_besuch_hinweis_1: string | null;

  /** Freitext-Hinweis 2 zum QS-Besuch. */
  qs_besuch_hinweis_2: string | null;

  /**
   * Geokoordinaten in WGS84 (Längengrad/Latitude).
   * @example
   * { lon: 6.960279, lat: 50.937531 }
   */
  geom: { lon: number; lat: number } | null;

  /** Geplanter Abrechnungs-/Planmonat. */
  planmonat: Date | null;

  /** Konkreter Terminzeitpunkt. */
  termin: Date | null;

  /** Dauer des Termins in Minuten. */
  termindauer_min: number | null;

  /** Status des Termins (siehe {@link CUSTOMER_TERMINSTATUS}). */
  terminstatus: CUSTOMER_TERMINSTATUS | null;

  /** Grund des Termins (siehe {@link CUSTOMER_TERMINGRUND}). */
  termingrund: CUSTOMER_TERMINGRUND | null;

  /** Reihenfolgenummer für Touren/Listen. */
  reihenfolge_nr: number | null;

  /** Parksituation vor Ort (siehe {@link CUSTOMER_PARKEN}). */
  parken: CUSTOMER_PARKEN | null;

  /** Allgemeine Bemerkungen. */
  bemerkung: string | null;

  /** Flag: Datensatz hat (noch) Datenfehler. */
  datenfehler: boolean;

  /** Begründung/Erklärung der Datenfehler. */
  begruendung_datenfehler: string | null;

  /** Flag: Datensatz ist aktiv. */
  aktiv: boolean;

  /** OID/Schlüssel aus der Gebäudereferenz (falls gematcht). */
  gebref_oid: string | null;
};
