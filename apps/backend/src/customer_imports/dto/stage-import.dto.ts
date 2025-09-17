// apps/backend/src/imports/imports.types.ts
export type StagingDto = {
  importId: string;
  imported_at: Date;
  imported_by: string;
  kunde: string | null;
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
};

export type ValidationError = {
  field: keyof StagingDto;
  message: string;
  row?: number;
};

export type ColumnMap = Record<
  string,
  {
    db: keyof StagingDto;
    aliases: string[];
    transform?: (v: any) => any;
  }
>;
