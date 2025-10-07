import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerImport } from 'src/customer_imports/customer_imports.entity';
import { Repository } from 'typeorm';
import {
  ImportHistoryQueryDto,
  importSortable,
} from './dto/import-history-query.dto';
import { RunsQueryDto, runsSortable } from './dto/runs-query.dto';
import { CustomerImportRuns } from 'src/customer_imports_runs/customer_imports_runs.entity';

@Injectable()
export class ReportsHistoryService {
  constructor(
    @InjectRepository(CustomerImport)
    private readonly importRepo: Repository<CustomerImport>,
    @InjectRepository(CustomerImportRuns)
    private readonly runsRepo: Repository<CustomerImportRuns>,
  ) {}

  // Whitelist gegen SQL Injection
  private readonly IMPORT_SORT_MAP: Record<importSortable, string> = {
    id: 'ki.id',
    import_id: 'ki.import_id',
    imported_at: 'ki.imported_at',
    imported_by: 'ki.imported_by',
    kunde: 'ki.kunde',
    strasse: 'ki.strasse',
    plz: 'ki.plz',
    ort: 'ki.ort',
  };

  private readonly RUNS_SORT_MAP: Record<runsSortable, string> = {
    import_id: 'r.import_id',
    imported_at: 'r.imported_at',
    imported_by: 'r.imported_by',
    merged: 'r.merged',
    inserted_rows: 'r.inserted_rows',
  };

  async listAll(dto: ImportHistoryQueryDto) {
    const qb = this.importRepo.createQueryBuilder('ki');

    // Filter
    if (dto.import_id) {
      qb.andWhere('ki.import_id = :import_id', { import_id: dto.import_id });
    }
    if (dto.imported_by) {
      qb.andWhere('ki.imported_by = :iby', { iby: dto.imported_by });
    }
    if (dto.kunde) {
      qb.andWhere('ki.kunde ILIKE :kunde', { kunde: `%${dto.kunde}%` });
    }
    if (dto.strasse) {
      qb.andWhere('ki.strasse ILIKE :strasse', { strasse: `%${dto.strasse}%` });
    }
    if (dto.ort) {
      qb.andWhere('ki.ort ILIKE :ort', { ort: `%${dto.ort}%` });
    }
    if (dto.plz) {
      qb.andWhere('ki.plz = :plz', { plz: dto.plz });
    }
    if (dto.from) {
      qb.andWhere('ki.imported_at >= :from', { from: dto.from });
    }
    if (dto.to) {
      qb.andWhere('ki.imported_at < :to', { to: dto.to });
    }

    // Sortierung
    const sortKey: importSortable = dto.orderBy ?? 'imported_at';
    const sortCol = this.IMPORT_SORT_MAP[sortKey];
    const sortDir: 'ASC' | 'DESC' = dto.orderDir;
    qb.orderBy(sortCol, sortDir);

    // Pagination
    const limit = Math.min(dto.limit ?? 50, 200);
    const offset = dto.offset ?? 0;
    qb.take(limit).skip(offset);

    // Query ausführen
    const [rows, total] = await qb.getManyAndCount();

    return {
      total, // Gesamtzahl aller Zeilen (ohne Limit/Offset)
      limit,
      offset,
      orderBy: sortKey,
      orderDir: sortDir,
      rows,
    };
  }

  async listRuns(dto: RunsQueryDto) {
    const qb = this.runsRepo.createQueryBuilder('r');

    // Filter
    if (dto.imported_by) {
      qb.andWhere('r.imported_by = :iby', { iby: dto.imported_by });
    }
    if (dto.from) {
      qb.andWhere('r.imported_at >= :from', { from: dto.from });
    }
    if (dto.to) {
      qb.andWhere('r.imported_at < :to', { to: dto.to });
    }
    if (dto.merged !== undefined) {
      console.log(typeof dto.merged, dto.merged);
      qb.andWhere('r.merged = :m', { m: dto.merged });
    }

    // Sort (Whitelist)
    const sortKey: runsSortable = dto.orderBy ?? 'imported_at';
    const sortCol = this.RUNS_SORT_MAP[sortKey];
    const sortDir = dto.orderDir;
    qb.orderBy(sortCol, sortDir);

    // Pagination
    const limit = Math.min(dto.limit ?? 50, 200);
    const offset = dto.offset ?? 0;
    qb.take(limit).skip(offset);

    // Ausführen
    const [rows, total] = await qb.getManyAndCount();

    return {
      total,
      limit,
      offset,
      orderBy: sortKey,
      orderDir: sortDir,
      rows,
    };
  }
}
