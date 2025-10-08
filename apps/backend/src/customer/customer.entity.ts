// src/customer/customer.entity.ts
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Persistente **Kunden-Entity** für die Tabelle `kunden`.
 *
 * @remarks
 * - Viele Felder sind `nullable`, weil Daten beim Import inkrementell/inkonsistent sein können.
 * - Geometrie (`geom`) wird in **WGS84 (SRID 4326)** gespeichert.
 * - Der Primärschlüssel ist die fachliche `kundennummer`.
 */
@Entity({ name: 'kunden' })
export class Customer {
  /** Fachliche, eindeutige Kennung des Kunden (Primärschlüssel). */
  @PrimaryColumn({ type: 'text', name: 'kundennummer' })
  kundennummer: string;

  /** Nachname der Person. */
  @Column({ type: 'text', nullable: true })
  nachname: string | null;

  /** Vorname der Person. */
  @Column({ type: 'text', nullable: true })
  vorname: string | null;

  /** Straßenname (normalisiert), z. B. „Musterstraße“. */
  @Column({ type: 'text', nullable: true })
  strasse: string | null;

  /** Hausnummer inkl. Bereich oder Anhang (z. B. „12“, „12-14“, „12a“). */
  @Column({ type: 'text', nullable: true })
  hnr: string | null;

  /** Adresszusatz (ein Buchstabe o. kurzer Zusatz), z. B. „a“, „Hinterhaus“. */
  @Column({ type: 'text', nullable: true })
  adz: string | null;

  /** Postleitzahl als Text (führende Nullen möglich). */
  @Column({ type: 'text', nullable: true })
  plz: string | null;

  /** Ort / Stadt, ggf. vereinheitlicht (z. B. „Mülheim an der Ruhr“). */
  @Column({ type: 'text', nullable: true })
  ort: string | null;

  /** Festnetznummer im **E.164**-Format, sofern normalisiert. */
  @Column({ type: 'text', nullable: true })
  telefon: string | null;

  /** Mobilnummer im **E.164**-Format, sofern normalisiert. */
  @Column({ type: 'text', nullable: true })
  mobil: string | null;

  /** Geburtstag; nur Datumsteil relevant. */
  @Column({ type: 'date', nullable: true })
  geburtstag: Date | null;

  /** Interne Kennung, z. B. „Pflegegrad 3“. */
  @Column({ type: 'text', nullable: true })
  kennung: string | null;

  /** Start-/Aufnahmedatum. */
  @Column({ type: 'date', nullable: true })
  start: Date | null;

  /** Endedatum (z. B. Vertragsende). */
  @Column({ type: 'date', nullable: true })
  ende: Date | null;

  /** Beauftragte Leistungen als freier Text. */
  @Column({ type: 'text', nullable: true })
  auftraege: string | null;

  /** Zuständige/r Serviceberater/in. */
  @Column({ type: 'text', nullable: true })
  serviceberater: string | null;

  /** Besuchsrhythmus als Text (z. B. „3 Monate“). */
  @Column({ type: 'text', nullable: true })
  besuchrhythmus: string | null;

  /** Datum des letzten QS-Besuchs. */
  @Column({ type: 'date', nullable: true })
  qs_besuch_datum: Date | null;

  /** Art des QS-Besuchs (frei). */
  @Column({ type: 'text', nullable: true })
  qs_besuch_art: string | null;

  /** Historik-Zeitpunkt zum QS-Besuch. */
  @Column({ type: 'date', nullable: true })
  qs_besuch_historik: Date | null;

  /** Freitext-Hinweis 1 zum QS-Besuch. */
  @Column({ type: 'text', nullable: true })
  qs_besuch_hinweis_1: string | null;

  /** Freitext-Hinweis 2 zum QS-Besuch. */
  @Column({ type: 'text', nullable: true })
  qs_besuch_hinweis_2: string | null;

  /**
   * Geometriepunkt (WGS84) als PostGIS-`geometry(Point, 4326)`.
   *
   * @remarks
   * - Längengrad/Latitude werden mit `ST_MakePoint(lon, lat)` erzeugt und via `ST_SetSRID(..., 4326)` gesetzt.
   * - Index erleichtert räumliche Abfragen.
   */
  @Index()
  @Column({
    name: 'geom',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  geom: string | null; // ST_SetSRID(ST_MakePoint(lon,lat),4326)

  /** Flag: Datensatz hat (noch) Datenfehler. */
  @Column({ type: 'boolean', default: false })
  datenfehler: boolean;

  /** Begründung/Erklärung der Datenfehler. */
  @Column({ type: 'text', nullable: true })
  begruendung_datenfehler: string | null;

  /** Flag: Datensatz ist aktiv (wird z. B. beim Merge gepflegt). */
  @Column({ type: 'boolean', default: true })
  aktiv: boolean;

  /** OID/Schlüssel aus der Gebäudereferenz, falls gematcht. */
  @Column({ type: 'text', nullable: true })
  gebref_oid: string | null;
}
