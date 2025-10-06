import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CustomerImportRuns } from './customer_imports_runs.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class CustomerImportsRunsService {
  private runRepo: Repository<CustomerImportRuns>;
  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {
    this.runRepo = this.ds.getRepository(CustomerImportRuns);
  }
  async addImport(
    import_id: string,
    imported_at: Date,
    imported_by: string,
    inserted_rows: number,
  ) {
    const run = await this.runRepo.create({
      import_id: import_id,
      imported_at,
      imported_by,
      inserted_rows,
    });
    await this.runRepo.save(run);
  }
  async mergeImport(import_id: string) {
    await this.runRepo.update({ import_id: import_id }, { merged: true });
  }
}
