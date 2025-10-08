// src/customer/services/customer-writer.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '../customer.entity';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

@Injectable()
export class CustomerWriterService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  /**
   * Führt einen **Bulk-Upsert** auf der Tabelle `kunden` aus.
   *
   * @remarks
   * - Erwartet eine Liste **teilweiser** Customer-Objekte (nur die Spalten, die gesetzt werden sollen).
   * - Nutzt `ON CONFLICT (kundennummer) DO UPDATE` mit dynamisch ermittelten Spalten.
   * - `kundennummer` wird **nie** überschrieben (Konfliktschlüssel).
   * - `skipUpdateIfNoValuesChanged: true` verhindert „nutzlose“ Updates.
   * - `returning('xmax')`: In PostgreSQL ist `xmax` bei **INSERT** `0`, bei **UPDATE** `> 0`. Damit kann man nachgelagert unterscheiden.
   *
   * @param batch Liste teilweiser Datensätze (upsert-fähig)
   * @returns Query-Ergebnis (u. a. mit `raw` samt `xmax`)
   */
  async bulkInsert(batch: Array<QueryDeepPartialEntity<Customer>>) {
    const knr_debug: Record<string, number> = {};
    if (!batch.length) return;

    // 3.1) Spalten ermitteln, die bei Konflikt überschrieben werden sollen
    const allCols = new Set<string>();
    for (const v of batch) {
      Object.keys(v as object).forEach((c) => allCols.add(c));
    }
    const overwrite = [...allCols].filter((c) => c !== 'kundennummer');

    // 3.2) Upsert-Statement (INSERT .. ON CONFLICT (kundennummer) DO UPDATE)
    const res = await this.customerRepo
      .createQueryBuilder()
      .insert()
      .into(Customer)
      .values(batch)
      .orUpdate(overwrite, ['kundennummer'], {
        skipUpdateIfNoValuesChanged: true,
      })
      .returning('xmax') // INSERT => 0, UPDATE => >0
      .execute();

    return res;
  }

  /**
   * Setzt `aktiv = false` für alle Kunden, deren **Kundennummer** nicht in `seen` enthalten ist.
   *
   * @remarks
   * - Deaktiviert nur Datensätze, die **nicht bereits** `aktiv = false` sind
   *   (`IS DISTINCT FROM false` vermeidet unnötige Updates).
   * - `kundennummer IS NULL` wird der Vollständigkeit halber auch deaktiviert.
   *
   * @param seen Menge an **noch vorhandenen** Kundennummern (z. B. aus aktuellem Import)
   */
  async deactivate(seen: Set<string>) {
    const ids = [...seen];

    await this.customerRepo.query(
      `
        UPDATE kunden k
          SET aktiv = false
        WHERE (k.kundennummer IS NULL OR NOT (k.kundennummer = ANY($1::text[])))
          AND k.aktiv IS DISTINCT FROM false;
        `,
      [ids],
    );
  }
}
