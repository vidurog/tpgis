// src/customer/services/customer-writer.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '../customer.entity';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { CustomerError } from '../customer_errors.entity';

@Injectable()
export class CustomerWriterService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(CustomerError)
    private readonly errorRepo: Repository<CustomerError>,
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
  async bulkUpsertMergeBatch(batch: Array<QueryDeepPartialEntity<Customer>>) {
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
    if (ids.length === 0) {
      return 0;
    }
    const result = await this.customerRepo
      .createQueryBuilder()
      .update('kunden')
      .set({ aktiv: false })
      .where('(kundennummer IS NULL OR NOT (kundennummer = ANY(:ids)))', {
        ids,
      })
      .andWhere('aktiv IS DISTINCT FROM false')
      .returning('kundennummer')
      .execute();

    return (
      (result.affected ?? (Array.isArray(result.raw) ? result.raw.length : 0)) |
      0
    );
  }

  async bulkUpsertErrorBatch(
    batch: Array<QueryDeepPartialEntity<CustomerError>>,
  ) {
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
      .into(CustomerError)
      .values(batch)
      .orUpdate(overwrite, ['kundennummer'], {
        skipUpdateIfNoValuesChanged: true,
      })
      .execute();

    console.log('ErrorBatch', res); // DEBUG
  }
}
