export type CustomerErrorDTO = {
  kundennummer: string;
  //import_id: string;
  datenfehler: boolean;
  geom_fehler: boolean;
  klasse: string;
  fehleranzahl: number;
  rhythmus_fehler: boolean;
  kennung_fehler: boolean;
  inkonsistenz: boolean;
  historik_fehler: boolean;
  kontakt_fehler: boolean;
  geburtstag_fehler: boolean;
  adresse_neu: string | null;
};
