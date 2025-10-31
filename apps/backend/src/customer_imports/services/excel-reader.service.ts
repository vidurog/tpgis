// apps/backend/src/imports/excel-reader.service.ts
import { Injectable } from '@nestjs/common';
import * as Excel from 'exceljs';

@Injectable()
export class ExcelReaderService {
  /**
   * Streamt eine XLSX-Arbeitsmappe zeilenweise als **normalisierte Records**.
   *
   * @remarks
   * - Nutzt den **Streaming-Reader** von `exceljs` (speicherschonend).
   * - Überspringt die **ersten zwei Header-Zeilen**.
   * - Formeln werden auf ihr **Ergebnis** reduziert.
   * - RichText wird zu einfachem Text konkateniert.
   * - Zellen werden möglichst in **primitive** Typen überführt (`string | number | Date | null`).
   *
   * @param filePath Absoluter Pfad zur XLSX-Datei
   * @yields `Record<string, any>` mit festen Schlüsseln laut `header`
   */
  async *rows(filePath: string): AsyncGenerator<Record<string, any>> {
    const wb = new Excel.stream.xlsx.WorkbookReader(filePath, {
      entries: 'emit',
      sharedStrings: 'cache',
    });

    // 1) Erwartete Header der Excel-Datei (Spaltenbelegung)
    const header: string[] = [
      '',
      'kunde',
      'strasse',
      'plz',
      'ort',
      'telefon',
      'mobil',
      'geburtstag',
      'kennung',
      'start',
      'ende',
      'auftraege',
      'serviceberater',
      'besuchrhythmus',
      'qs_besuch_datum',
      'qs_besuch_art',
      'qs_besuch_historik',
      'qs_besuch_hinweis_1',
      'qs_besuch_hinweis_2',
    ];

    // Zelleninhalt auf einen brauchbaren primitiven Typ reduzieren
    const normCell = (v: any) => {
      if (v == null) return null;
      if (typeof v === 'object') {
        if ('result' in v) return normCell(v.result); // Formel → Ergebnis
        if ('text' in v) return String(v.text);
        if ('richText' in v) return v.richText.map((r: any) => r.text).join('');
      }
      return v instanceof Date
        ? v
        : typeof v === 'number'
          ? v
          : String(v).trim();
    };

    for await (const ws of wb) {
      let rowIndex = 0;

      for await (const row of ws) {
        rowIndex++;
        const raw = row.values as any[]; // exceljs ist 1-basiert
        if (rowIndex <= 2) continue; // first two lines are Headers

        const values = raw.map(normCell);
        const rec: Record<string, any> = {};

        for (let i = 1; i < header.length; i++) {
          rec[header[i]] = values[i] ?? null;
        }
        yield rec;
      }
    }
  }
}
