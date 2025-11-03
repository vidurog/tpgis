import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'kunden_fehler' })
export class CustomerError {
  @PrimaryColumn({ type: 'text', name: 'kundennummer' })
  kundennummer: string;

  //@Column({ name: 'import_id', type: 'bigint' })
  ///import_id: string;

  @Index()
  @Column({
    type: 'boolean',
    name: 'datenfehler',
    nullable: false,
    default: false,
  })
  datenfehler: boolean;

  @Column({
    type: 'boolean',
    name: 'geom_fehler',
    nullable: false,
    default: false,
  })
  geom_fehler: boolean;

  @Column({ type: 'text', name: 'klasse' })
  klasse: string;

  @Column({
    type: 'integer',
    name: 'fehleranzahl',
    nullable: false,
    default: 0,
  })
  fehleranzahl: number;

  @Column({
    type: 'boolean',
    name: 'rhythmus_fehler',
    nullable: false,
    default: false,
  })
  rhythmus_fehler: boolean;

  @Column({
    type: 'boolean',
    name: 'kennung_fehler',
    nullable: false,
    default: false,
  })
  kennung_fehler: boolean;

  @Column({
    type: 'boolean',
    name: 'inkonsistenz',
    nullable: false,
    default: false,
  })
  inkonsistenz: boolean;

  @Column({
    type: 'boolean',
    name: 'historik_fehler',
    nullable: false,
    default: false,
  })
  historik_fehler: boolean;

  @Column({
    type: 'boolean',
    name: 'kontakt_fehler',
    nullable: false,
    default: false,
  })
  kontakt_fehler: boolean;

  @Column({
    type: 'boolean',
    name: 'geburtstag_fehler',
    nullable: false,
    default: false,
  })
  geburtstag_fehler: boolean;

  @Column({
    type: 'text',
    name: 'adresse_neu',
    nullable: true,
    default: null,
  })
  adresse_neu: string | null;
}
