import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'kunde' })
export class Customer {
  @PrimaryColumn()
  @Column({ name: 'kundennummer', type: 'text' })
  kundennummer: string;

  @Column({ name: 'kunde', type: 'text', nullable: true })
  kunde!: string;

  @Column({ name: 'strasse', type: 'text', nullable: true })
  strasse: string;

  @Column({ name: 'hnr', type: 'text', nullable: true })
  hnr: number | null;

  @Column({ name: 'plz', type: 'text', nullable: true })
  plz: string | null;

  @Column({ name: 'ort', type: 'text', nullable: true })
  ort: string | null;

  @Column({ name: 'telefon', type: 'text', nullable: true })
  telefon: string | null;

  @Column({ name: 'mobil', type: 'text', nullable: true })
  mobil: string | null;

  @Column({ name: 'geburtstag', type: 'text', nullable: true })
  geburtstag: string | null;

  @Column({ name: 'kennung', type: 'text', nullable: true })
  kennung: string | null;

  @Column({ name: 'start', type: 'text', nullable: true })
  start: string | null;

  @Column({ name: 'ende', type: 'text', nullable: true })
  ende: string | null;

  @Column({ name: 'auftraege', type: 'text', nullable: true })
  auftraege: string | null;

  @Column({ name: 'serviceberater', type: 'text', nullable: true })
  serviceberater: string | null;

  @Column({ name: 'besuchrhythmus', type: 'text', nullable: true })
  besuchrhythmus: string | null;

  @Column({ name: 'qs_besuch_datum', type: 'text', nullable: true })
  qs_besuch_datum: string | null;

  @Column({ name: 'qs_besuch_art', type: 'text', nullable: true })
  qs_besuch_art: string | null;

  @Column({ name: 'qs_besuch_historik', type: 'text', nullable: true })
  qs_besuch_historik: string | null;

  @Column({ name: 'qs_besuch_hinweis_1', type: 'text', nullable: true })
  qs_besuch_hinweis_1: string | null;

  @Column({ name: 'qs_besuch_hinweis_2', type: 'text', nullable: true })
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

  // Eigene Tabelle Planung
  @Column({ name: 'planmonat', type: 'date', nullable: true })
  planmonat: string | null;

  // Eigene Tabelle Planung
  @Column({ name: 'termin', type: 'timestamptz', nullable: true })
  termin: Date | null;

  // Eigene Tabelle Planung
  @Column({ name: 'termindauer_min', type: 'integer', nullable: true })
  termindauer_min: number | null;

  @Column({ name: 'terminstatus', type: 'text', nullable: true })
  terminstatus: string | null;

  // Eigene Tabelle Planung
  @Column({ name: 'termingrund', type: 'text', nullable: true })
  termingrund: string | null;

  // Eigene Tabelle Planung
  @Column({ name: 'reihenfolge_nr', type: 'integer', nullable: true })
  reihenfolge_nr: number | null;

  @Column({ name: 'parken', type: 'text', nullable: true })
  parken: string | null;

  @Column({ name: 'bemerkung', type: 'text', nullable: true })
  bemerkung: string | null;

  @Column({ name: 'datenfehler', type: 'boolean', default: false })
  datenfehler: boolean;

  @Column({ name: 'begruendung_datenfehler', type: 'text', nullable: true })
  begruendung_datenfehler: string | null;
}
