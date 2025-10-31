export type CustomerErrorDTO = {
  kundennummer: string;
  import_id: string;
  datenfehler: boolean;
  geokodierbar: boolean;
  klasse: string;
  fehleranzahl: number;
  rhythmus: boolean;
  inkonsistenz: boolean;
  historik: boolean;
  kontakt: boolean;
  geburtstag: boolean;
  adresse_neu: string;
};
