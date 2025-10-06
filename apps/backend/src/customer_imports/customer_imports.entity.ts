import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'kunden_import' })
export class CustomerImport {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string; //bigserial

  @Index()
  @Column({ name: 'import_id', type: 'bigint' })
  import_id!: string;

  @Column({ name: 'imported_at', type: 'timestamptz' })
  imported_at!: Date;

  @Column({ name: 'imported_by', type: 'text' })
  imported_by!: string;

  @Column({ name: 'kunde', type: 'text', nullable: true })
  kunde!: string | null;

  @Column({ name: 'strasse', type: 'text', nullable: true })
  strasse: string | null;

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
}
