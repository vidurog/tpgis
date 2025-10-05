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

  async bulkInsert(batch: Array<QueryDeepPartialEntity<Customer>>) {
    const knr_debug: Record<string, number> = {};
    if (!batch.length) return;

    // 3.1) Spalten die bei Konflikt überschrieben werden müssen
    const allCols = new Set<string>();
    for (const v of batch) {
      Object.keys(v as object).forEach((c) => allCols.add(c));
    }
    const overwrite = [...allCols].filter((c) => c !== 'kundennummer');


    // 3.2) SQL Statement
    const res = await this.customerRepo
      .createQueryBuilder()
      .insert()
      .into(Customer)
      .values(batch)
      .orUpdate(overwrite, ['kundennummer'], {
        skipUpdateIfNoValuesChanged: true,
      })
      .returning('xmax') // insert = 0, update >0
      .execute();

    return res;
  }

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
