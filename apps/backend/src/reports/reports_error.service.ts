import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import * as ExcelJS from 'exceljs';

// Passe Pfad/Name auf deine Entity an (DB-Name = Entity-Name gleich)
import { Customer } from 'src/customer/customer.entity';
import {
  errorSortable,
  ReportsErrorsQueryDto,
} from './dto/reports-error-query.dto';

@Injectable()
export class ReportsErrorService {
  constructor(
    @InjectRepository(Customer)
    private readonly kundenRepo: Repository<Customer>,
  ) {}

  // zentral definierte SQL ausdrücke
  private readonly EXPR = {
    geocodable: `(k.geom IS NOT NULL OR k.gebref_oid IS NOT NULL)`,
    err_missing_rhythmus: `(k.besuchrhythmus IS NULL)`,
    err_missing_kennung: `(k.kennung IS NULL)`,
    err_inconsistent_kennung_rhythmus: `
      CASE
        WHEN k.besuchrhythmus IS NOT NULL THEN
          CASE
            WHEN k.kennung = 'Pflegegrad 1' AND k.besuchrhythmus <> '1 Monat' THEN TRUE
            WHEN k.kennung = 'Pflegegrad 2' AND k.besuchrhythmus <> '3 Monate' THEN TRUE
            WHEN k.kennung = 'Pflegegrad 3' AND k.besuchrhythmus <> '6 Monate' THEN TRUE
            ELSE FALSE
          END
        ELSE FALSE
      END
    `,
    err_missing_history: `(k.qs_besuch_historik IS NULL)`,
    err_missing_contact: `(k.telefon IS NULL AND k.mobil IS NULL)`,
    err_no_geocoding: `(k.geom IS NULL)`,
    err_address_changed: `
      (COALESCE(k.begruendung_datenfehler,'') ILIKE '%Addresse geändert%')
    `,
  };
  // zentral definierte SQL ausdrücke
  private readonly EXPR_ERROR_CLASS = `
    CASE
      WHEN ( ${this.EXPR.err_address_changed} OR ${this.EXPR.err_no_geocoding} ) THEN
        CASE WHEN ${this.EXPR.geocodable}
             THEN 'ADDRESS_GEOCODABLE'
             ELSE 'ADDRESS_NOT_GEOCODABLE'
        END
      ELSE 'NO_ADDRESS_ISSUE'
    END
  `;
  // zentral definierte SQL ausdrücke
  private readonly EXPR_ERROR_COUNT = `
    (CASE WHEN ${this.EXPR.err_missing_rhythmus} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_missing_kennung} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_inconsistent_kennung_rhythmus} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_missing_history} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_missing_contact} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_no_geocoding} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_address_changed} THEN 1 ELSE 0 END)
  `;

  // Whitelist
  private readonly SORT_MAP: Record<errorSortable, string> = {
    kundennummer: 'k.kundennummer',
    nachname: 'k.nachname',
    vorname: 'k.vorname',
    strasse: 'k.strasse',
    plz: 'k.plz',
    ort: 'k.ort',
    datenfehler: 'k.datenfehler',
    err_missing_rhythmus: 'err_missing_rhythmus',
    err_missing_kennung: 'err_missing_kennung',
    err_inconsistent_kennung_rhythmus: 'err_inconsistent_kennung_rhythmus',
    err_missing_history: 'err_missing_history',
    err_missing_contact: 'err_missing_contact',
    err_no_geocoding: 'err_no_geocoding',
    err_address_changed: 'err_address_changed',
    geocodable: 'geocodable',
    error_class: 'error_class',
    error_count: 'error_count',
  };

  // ---- Basis-Query (SELECT + berechnete Felder) ----
  private buildBaseQuery(): SelectQueryBuilder<Customer> {
    return this.kundenRepo
      .createQueryBuilder('k')
      .where('k.aktiv = true')
      .addSelect(this.EXPR.geocodable, 'geocodable')
      .addSelect(this.EXPR.err_missing_rhythmus, 'err_missing_rhythmus')
      .addSelect(this.EXPR.err_missing_kennung, 'err_missing_kennung')
      .addSelect(
        this.EXPR.err_inconsistent_kennung_rhythmus,
        'err_inconsistent_kennung_rhythmus',
      )
      .addSelect(this.EXPR.err_missing_history, 'err_missing_history')
      .addSelect(this.EXPR.err_missing_contact, 'err_missing_contact')
      .addSelect(this.EXPR.err_no_geocoding, 'err_no_geocoding')
      .addSelect(this.EXPR.err_address_changed, 'err_address_changed')
      .addSelect(this.EXPR_ERROR_CLASS, 'error_class')
      .addSelect(this.EXPR_ERROR_COUNT, 'error_count');
  }

  // ---- Filter anwenden  ----
  private applyFilters(
    qb: SelectQueryBuilder<Customer>,
    dto: ReportsErrorsQueryDto,
  ) {
    if (dto.plz) qb.andWhere('k.plz = :plz', { plz: dto.plz });
    if (dto.ort) qb.andWhere('k.ort ILIKE :ort', { ort: `%${dto.ort}%` });
    if (dto.datenfehler !== undefined)
      qb.andWhere('k.datenfehler = :df', { df: dto.datenfehler });

    const boolFilter = <T extends keyof ReportsErrorsQueryDto>(
      field: T,
      expr: string,
    ) => {
      const v = dto[field];
      if (v !== undefined)
        qb.andWhere(`${expr} = :${String(field)}`, { [String(field)]: v });
    };

    boolFilter('geocodable', this.EXPR.geocodable);
    boolFilter('err_missing_rhythmus', this.EXPR.err_missing_rhythmus);
    boolFilter('err_missing_kennung', this.EXPR.err_missing_kennung);
    boolFilter(
      'err_inconsistent_kennung_rhythmus',
      this.EXPR.err_inconsistent_kennung_rhythmus,
    );
    boolFilter('err_missing_history', this.EXPR.err_missing_history);
    boolFilter('err_missing_contact', this.EXPR.err_missing_contact);
    boolFilter('err_no_geocoding', this.EXPR.err_no_geocoding);
    boolFilter('err_address_changed', this.EXPR.err_address_changed);

    if (dto.error_class) {
      const addressIssue = `(${this.EXPR.err_address_changed} OR ${this.EXPR.err_no_geocoding})`;
      if (dto.error_class === 'NO_ADDRESS_ISSUE') {
        qb.andWhere(`NOT ${addressIssue}`);
      } else if (dto.error_class === 'ADDRESS_GEOCODABLE') {
        qb.andWhere(`${addressIssue} AND ${this.EXPR.geocodable} = TRUE`);
      } else if (dto.error_class === 'ADDRESS_NOT_GEOCODABLE') {
        qb.andWhere(`${addressIssue} AND ${this.EXPR.geocodable} = FALSE`);
      }
    }
  }

  // ---- JSON: Liste mit Sort + Pagination ----
  async listLatestErrors(dto: ReportsErrorsQueryDto) {
    // total
    const totalQb = this.buildBaseQuery();
    this.applyFilters(totalQb, dto);
    const total = await totalQb.getCount();

    // rows vorbereiten
    const rowsQb = this.buildBaseQuery();
    this.applyFilters(rowsQb, dto);

    // Sortierung
    const sortKey: errorSortable = dto.orderBy ?? 'error_class';
    const sortCol = this.SORT_MAP[sortKey];
    const sortDir: 'ASC' | 'DESC' = dto.orderDir === 'ASC' ? 'ASC' : 'DESC';
    rowsQb.orderBy(sortCol, sortDir);

    // Pagination
    const limit = Math.min(dto.limit ?? 50, 200);
    const offset = dto.offset ?? 0;
    rowsQb.take(limit).skip(offset);

    // Rows
    const rowsRaw = await rowsQb.getRawMany<any>();
    const rows = rowsRaw.map(this.mapRow);

    return {
      total,
      limit,
      offset,
      orderBy: sortKey,
      orderDir: sortDir,
      rows,
    };
  }

  // ---- XLSX-Export (alle gefilterten Zeilen, Pagination ignoriert) ----
  async exportLatestErrorsXlsx(
    dto: ReportsErrorsQueryDto,
  ): Promise<{ filename: string; buffer: Buffer }> {
    const qb = this.buildBaseQuery();
    this.applyFilters(qb, dto);

    // optional: gleiche Sortierung wie JSON
    const sortKey: errorSortable = dto.orderBy ?? 'error_class';
    const sortCol = this.SORT_MAP[sortKey];
    const sortDir: 'ASC' | 'DESC' = dto.orderDir === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(sortCol, sortDir);

    const rowsRaw = await qb.getRawMany<any>();
    const rows = rowsRaw.map(this.mapRow);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Fehlerreport');

    ws.columns = [
      { header: 'Kundennummer', key: 'kundennummer', width: 18 },
      { header: 'Nachname', key: 'nachname', width: 18 },
      { header: 'Vorname', key: 'vorname', width: 18 },
      { header: 'Straße', key: 'strasse', width: 22 },
      { header: 'HNr', key: 'hnr', width: 6 },
      { header: 'ADZ', key: 'adz', width: 6 },
      { header: 'PLZ', key: 'plz', width: 8 },
      { header: 'Ort', key: 'ort', width: 22 },
      { header: 'Telefon', key: 'telefon', width: 16 },
      { header: 'Mobil', key: 'mobil', width: 16 },
      { header: 'Kennung', key: 'kennung', width: 16 },
      { header: 'Besuchrhythmus', key: 'besuchrhythmus', width: 16 },
      { header: 'Historik', key: 'qs_besuch_historik', width: 14 },
      { header: 'Datenfehler', key: 'datenfehler', width: 12 },
      { header: 'Begründung', key: 'begruendung_datenfehler', width: 40 },
      { header: 'Geocodierbar', key: 'geocodable', width: 14 },
      { header: 'Klasse', key: 'error_class', width: 22 },
      { header: 'Fehleranzahl', key: 'error_count', width: 14 },

      // Einzel-Flags
      { header: 'Kein Rhythmus', key: 'err_missing_rhythmus', width: 14 },
      { header: 'Keine Kennung', key: 'err_missing_kennung', width: 14 },
      {
        header: 'Inkonsistenz Kenn./Rhythmus',
        key: 'err_inconsistent_kennung_rhythmus',
        width: 26,
      },
      { header: 'Keine Historik', key: 'err_missing_history', width: 14 },
      { header: 'Kein Telefon/Mobil', key: 'err_missing_contact', width: 18 },
      { header: 'Keine Geokodierung', key: 'err_no_geocoding', width: 18 },
      { header: 'Adresse geändert', key: 'err_address_changed', width: 16 },
    ];

    rows.forEach((r) => ws.addRow(r));

    // Optionale Formatierung: Kopf fett
    ws.getRow(1).font = { bold: true };

    const buffer = await wb.xlsx.writeBuffer();
    return {
      filename: `fehlerreport_latest.xlsx`,
      buffer: Buffer.from(buffer),
    };
  }

  // ---- Mapping Raw → flaches JSON ----
  private mapRow = (r: any) => ({
    kundennummer: r.k_kundennummer,
    nachname: r.k_nachname,
    vorname: r.k_vorname,
    strasse: r.k_strasse,
    hnr: r.k_hnr,
    adz: r.k_adz,
    plz: r.k_plz,
    ort: r.k_ort,
    telefon: r.k_telefon,
    mobil: r.k_mobil,
    geburtstag: r.k_geburtstag,
    kennung: r.k_kennung,
    start: r.k_start,
    ende: r.k_ende,
    auftraege: r.k_auftraege,
    serviceberater: r.k_serviceberater,
    besuchrhythmus: r.k_besuchrhythmus,
    qs_besuch_datum: r.k_qs_besuch_datum,
    qs_besuch_art: r.k_qs_besuch_art,
    qs_besuch_historik: r.k_qs_besuch_historik,
    qs_besuch_hinweis_1: r.k_qs_besuch_hinweis_1,
    qs_besuch_hinweis_2: r.k_qs_besuch_hinweis_2,
    geom: r.k_geom,
    planmonat: r.k_planmonat,
    termin: r.k_termin,
    termindauer_min: r.k_termindauer_min,
    terminstatus: r.k_terminstatus,
    termingrund: r.k_termingrund,
    reihenfolge_nr: r.k_reihenfolge_nr,
    parken: r.k_parken,
    bemerkung: r.k_bemerkung,
    datenfehler: r.k_datenfehler,
    begruendung_datenfehler: r.k_begruendung_datenfehler,
    aktiv: r.k_aktiv,
    gebref_oid: r.k_gebref_oid,

    // berechnet
    geocodable: !!r.geocodable,
    error_class: r.error_class,
    error_count: Number(r.error_count),

    err_missing_rhythmus: !!r.err_missing_rhythmus,
    err_missing_kennung: !!r.err_missing_kennung,
    err_inconsistent_kennung_rhythmus: !!r.err_inconsistent_kennung_rhythmus,
    err_missing_history: !!r.err_missing_history,
    err_missing_contact: !!r.err_missing_contact,
    err_no_geocoding: !!r.err_no_geocoding,
    err_address_changed: !!r.err_address_changed,
  });
}
