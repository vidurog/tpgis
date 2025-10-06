// apps/backend/src/imports/import-mapping.service.ts
import { Injectable } from '@nestjs/common';
import { ColumnMap, StagingDto } from '../dto/stage-import.dto';
import {
  normalizeKey,
  toISODate,
  toPLZ,
  toStrOrNull,
} from 'src/util/customer_import.util';

type MetaMapping = {
  import_id: string;
  imported_at: Date;
  imported_by: string;
};

// ColumnMap festlegen
const COLUMN_MAP: ColumnMap = {
  // Stammdaten
  kunde: {
    db: 'kunde',
    aliases: ['kunde', 'kundenname'],
    transform: toStrOrNull,
  },
  strasse: {
    db: 'strasse',
    aliases: [
      'strasse',
      'straße',
      'adresse',
      'strasse hausnr',
      'straße hausnr',
      'strasse hausnummer',
    ],
    transform: toStrOrNull,
  },
  plz: { db: 'plz', aliases: ['plz', 'postleitzahl'], transform: toPLZ },
  ort: {
    db: 'ort',
    aliases: ['ort', 'stadt', 'wohnort'],
    transform: toStrOrNull,
  },
  telefon: {
    db: 'telefon',
    aliases: ['telefon', 'tel'],
    transform: toStrOrNull,
  },
  mobil: { db: 'mobil', aliases: ['mobil', 'handy'], transform: toStrOrNull },
  geburtstag: {
    db: 'geburtstag',
    aliases: ['geburtstag', 'geburtsdatum', 'geb.-datum'],
    transform: toISODate,
  },
  kennung: {
    db: 'kennung',
    aliases: ['kennung', 'pflegegrad'],
    transform: toStrOrNull,
  },
  start: { db: 'start', aliases: ['start', 'beginn'], transform: toISODate },
  ende: { db: 'ende', aliases: ['ende'], transform: toISODate },
  auftraege: {
    db: 'auftraege',
    aliases: [
      'auftraege',
      'aufträge',
      'auftraege (anzahl)',
      'auftraege anzahl',
    ],
    transform: toStrOrNull,
  },
  serviceberater: {
    db: 'serviceberater',
    aliases: ['serviceberater', 'berater'],
    transform: toStrOrNull,
  },
  besuchrhythmus: {
    db: 'besuchrhythmus',
    aliases: [
      'besuchrhythmus',
      'besuchsrythmus',
      'besuchs rhythmus',
      'besuchs-rhythmus',
    ],
    transform: toStrOrNull,
  },

  // QS-Besuch
  qs_besuch_datum: {
    db: 'qs_besuch_datum',
    aliases: [
      'qs_besuch_datum',
      'qs besuch datum',
      'qs-besuch datum',
      'qs besuch planung datum',
      'qs-besuch planung datum',
      'qs-besuch (planung) datum',
    ],
    transform: toISODate,
  },
  qs_besuch_art: {
    db: 'qs_besuch_art',
    aliases: [
      'qs_besuch_art',
      'qs besuch art',
      'qs-besuch art',
      'qs besuch planung art',
      'qs-besuch planung art',
      'qs-besuch (planung) art',
    ],
    transform: toStrOrNull,
  },
  qs_besuch_historik: {
    db: 'qs_besuch_historik',
    aliases: [
      'qs_besuch_historik',
      'qs-besuch historik',
      'qs besuch historik',
      'qs-besuch (historik)',
    ],
    transform: toISODate,
  },
  qs_besuch_hinweis_1: {
    db: 'qs_besuch_hinweis_1',
    aliases: [
      'qs_besuch_hinweis_1',
      'qs-besuch hinweis 1',
      'qs besuch hinweis 1',
      'qs-besuch (hinweis 1)',
    ],
    transform: toStrOrNull,
  },
  qs_besuch_hinweis_2: {
    db: 'qs_besuch_hinweis_2',
    aliases: [
      'qs_besuch_hinweis_2',
      'qs-besuch hinweis 2',
      'qs besuch hinweis 2',
      'qs-besuch (hinweis 2)',
    ],
    transform: toStrOrNull,
  },
};

@Injectable()
export class ImportMappingService {
  getColumnMap(): ColumnMap {
    return COLUMN_MAP;
  }

  mapToStaging(row: Record<string, any>, meta: MetaMapping): StagingDto {
    const normRow: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      if (k.includes('tag')) {
      }
      normRow[normalizeKey(k)] = v;
    }

    // DTO vorbereiten
    const dto: any = {
      import_id: String(meta.import_id),
      imported_at: meta.imported_at,
      imported_by: meta.imported_by,
      kunde: null,
      strasse: null,
      plz: null,
      ort: null,
      telefon: null,
      mobil: null,
      geburtstag: null,
      kennung: null,
      start: null,
      ende: null,
      auftraege: null,
      serviceberater: null,
      besuchrhythmus: null,
      qs_besuch_datum: null,
      qs_besuch_art: null,
      qs_besuch_historik: null,
      qs_besuch_hinweis_1: null,
      qs_besuch_hinweis_2: null,
    };

    // DTO mit normalisierten Werten füllen
    for (const def of Object.values(COLUMN_MAP)) {
      const foundKey = def.aliases
        .map(normalizeKey)
        .find((a) => normRow[a] !== undefined);
      const rawVal = foundKey !== undefined ? normRow[foundKey] : null;
      const val = def.transform ? def.transform(rawVal) : rawVal;

      dto[def.db] = val;
    }

    return dto as StagingDto;
  }
}
