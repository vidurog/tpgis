// apps/backend/src/imports/staging-writer.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerImport } from '../customer_import.entity';
import { StagingDto } from '../dto/stage-import.dto';

@Injectable()
export class StagingWriterService {
  constructor(
    @InjectRepository(CustomerImport)
    private readonly repo: Repository<CustomerImport>,
  ) {}

  async bulkInsert(rows: StagingDto[]): Promise<void> {
    // await this.repo.createQueryBuilder().insert().values(rows).execute(); // TODO
    if (!rows.length) return;

    await this.repo
      .createQueryBuilder()
      .insert()
      .into(CustomerImport)
      .values(rows)
      .execute();
  }

  async upsert(
    rows: StagingDto[],
    conflictCols: (keyof StagingDto)[],
  ): Promise<void> {
    // optional
  }
}
