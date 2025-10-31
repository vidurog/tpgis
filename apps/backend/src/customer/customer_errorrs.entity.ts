import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'kunden_fehler' })
export class CustomerError {
  @PrimaryColumn({ type: 'text', name: 'kundennummer' })
  kundennummer: string;

  @Column({ name: 'import_id', type: 'bigint' })
  import_id: string;

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
    name: 'geokodierbar',
    nullable: false,
    default: false,
  })
  geokodierbar: boolean;

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
    name: 'rhythmus',
    nullable: false,
    default: false,
  })
  rhythmus: boolean;

  @Column({ type: 'boolean', name: 'kennung', nullable: false, default: false })
  kennung: boolean;

  @Column({
    type: 'boolean',
    name: 'inkonsistenz',
    nullable: false,
    default: false,
  })
  inkonsistenz: boolean;

  @Column({
    type: 'boolean',
    name: 'historik',
    nullable: false,
    default: false,
  })
  historik: boolean;

  @Column({ type: 'boolean', name: 'kontakt', nullable: false, default: false })
  kontakt: boolean;

  @Column({
    type: 'boolean',
    name: 'geburtstag',
    nullable: false,
    default: false,
  })
  geburtstag: boolean;

  @Column({
    type: 'text',
    name: 'adresse_neu',
  })
  addresse_neu: string;
}
