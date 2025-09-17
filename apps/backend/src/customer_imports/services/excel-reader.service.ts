// apps/backend/src/imports/excel-reader.service.ts
import { Injectable } from '@nestjs/common';
import * as Excel from 'exceljs';
import { normCell } from 'src/util/customer_import.util';

@Injectable()
export class ExcelReaderService {
  async detectHeaders(filePath: string): Promise<string[]> {
    return []; // TODO
  }

  async *rows(filePath: string): AsyncGenerator<Record<string, any>> {
    const wb = new Excel.stream.xlsx.WorkbookReader(filePath, {
      entries: 'emit',
      sharedStrings: 'cache',
    });

    let header: string[] = [];

    for await (const ws of wb) {
      let rowIndex = 0;

      for await (const row of ws) {
        rowIndex++;
        const raw = row.values as any[]; // exceljs is 1-basiert
        if (rowIndex === 1) {
          header = raw.map(normCell);
          continue;
        }

        const values = raw.map(normCell);
        const rec: Record<string, any> = {};

        for (let i = 1; i < header.length; i++) {
          rec[header[i]] = values[i] ?? null; //TODO
        }
        yield rec; // WAS PASSIERT HIER
      }
    }
    // yield {}; // TODO
  }

  async close(filePath: string): Promise<void> {
    // optional
  }
}
