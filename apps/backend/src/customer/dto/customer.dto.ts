import { Geometry } from 'typeorm';

export type CustomerDTO = {
  kundennummer: string;
  kunde: string;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  telefon: string | null;
  mobil: string | null;
  geburtstag: string | null;
  kennung: string | null;
  start: string | null;
  ende: string | null;
  auftraege: string | null;
  serviceberater: string | null;
  besuchrhythmus: string | null;
  qs_besuch_datum: string | null;
  qs_besuch_art: string | null;
  qs_besuch_historik: string | null;
  qs_besuch_hinweis_1: string | null;
  qs_besuch_hinweis_2: string | null;
  geom: Geometry | null;
  planmonat: string | null;
  termin: string | null; // Date
  termindauer_min: number | null;
  terminstatus: string | null;
  termingrund: string | null;
  reihenfolge_nr: number | null;
  parken: string | null;
  bemerkung: string | null;
  datenfehler: boolean;
  begruendung_datenfehler: string | null;
  aktiv: boolean;
};
