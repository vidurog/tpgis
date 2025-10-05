import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'kunden' })
export class Customer {
  @PrimaryColumn({ type: 'text', name: 'kundennummer' })
  kundennummer: string;

  @Column({ type: 'text', nullable: true })
  nachname: string | null;

  @Column({ type: 'text', nullable: true })
  vorname: string | null;

  @Column({ type: 'text', nullable: true })
  strasse: string | null;

  @Column({ type: 'text', nullable: true })
  hnr: string | null;

  @Column({ type: 'text', nullable: true })
  adz: string | null;

  @Column({ type: 'text', nullable: true })
  plz: string | null;

  @Column({ type: 'text', nullable: true })
  ort: string | null;

  @Column({ type: 'text', nullable: true })
  telefon: string | null;

  @Column({ type: 'text', nullable: true })
  mobil: string | null;

  @Column({ type: 'date', nullable: true })
  geburtstag: Date | null;

  @Column({ type: 'text', nullable: true })
  kennung: string | null;

  @Column({ type: 'date', nullable: true })
  start: Date | null;

  @Column({ type: 'date', nullable: true })
  ende: Date | null;

  @Column({ type: 'text', nullable: true })
  auftraege: string | null;

  @Column({ type: 'text', nullable: true })
  serviceberater: string | null;

  @Column({ type: 'text', nullable: true })
  besuchrhythmus: string | null;

  @Column({ type: 'date', nullable: true })
  qs_besuch_datum: Date | null;

  @Column({ type: 'text', nullable: true })
  qs_besuch_art: string | null;

  @Column({ type: 'date', nullable: true })
  qs_besuch_historik: Date | null;

  @Column({ type: 'text', nullable: true })
  qs_besuch_hinweis_1: string | null;

  @Column({ type: 'text', nullable: true })
  qs_besuch_hinweis_2: string | null;

  @Index()
  @Column({
    name: 'geom',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  geom: string | null; // ST_SetSRID(ST_MakePoint(lon,lat),4326)

  @Column({ type: 'date', nullable: true })
  planmonat: Date | null; // immer 1. des Monats

  @Column({ type: 'timestamptz', nullable: true })
  termin: Date | null;

  @Column({ type: 'integer', nullable: true })
  termindauer_min: number | null;

  @Column({ type: 'text', nullable: true })
  terminstatus: string | null;

  @Column({ type: 'text', nullable: true })
  termingrund: string | null;

  @Column({ type: 'integer', nullable: true })
  reihenfolge_nr: number | null;

  @Column({ type: 'text', nullable: true })
  parken: string | null;

  @Column({ type: 'text', nullable: true })
  bemerkung: string | null;

  @Column({ type: 'boolean', default: false })
  datenfehler: boolean;

  @Column({ type: 'text', nullable: true })
  begruendung_datenfehler: string | null;

  @Column({ type: 'boolean', default: true })
  aktiv: boolean;

  @Column({type: 'text', nullable: true})
  gebref_oid: string | null;
}
