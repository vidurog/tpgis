// src/reports/reports_error.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import * as ExcelJS from 'exceljs';

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

  // ---------------------------------------------------------------------------
  // Zentral definierte SQL-Ausdrücke (als Strings), die wir mehrfach wiederverwenden.
  // Vorteil: konsistente Berechnung und ein Ort zum Ändern/Erweitern.
  // Hinweis: Diese Ausdrücke werden via `addSelect(expr, alias)` als virtuelle
  // Spalten in die Query gehängt.
  // ---------------------------------------------------------------------------
  private readonly EXPR = {
    geocodable: `(k.geom IS NOT NULL OR k.gebref_oid IS NOT NULL)`,
    err_missing_rhythmus: `(k.besuchrhythmus IS NULL)`,
    err_missing_kennung: `(k.kennung IS NULL)`,
    err_inconsistent_kennung_rhythmus: `
      (COALESCE(k.begruendung_datenfehler,'') ILIKE '%Inkonsistent%')
    `,
    err_missing_history: `(k.qs_besuch_historik IS NULL)`,
    err_missing_contact: `(k.telefon IS NULL AND k.mobil IS NULL)`,
    err_no_geocoding: `(k.geom IS NULL)`,
    // Suche „Adresse geändert“ in der Begründung (bewusst Originalschreibweise „Addresse“)
    err_address_changed: `
      (COALESCE(k.begruendung_datenfehler,'') ILIKE '%Addresse geändert%')
    `,
  };

  // Klassifizierung von Adressproblemen:
  // - ADDRESS_GEOCODABLE: Adresse hat Problem, ist aber prinzipiell geokodierbar (geom/gebref_oid vorhanden)
  // - ADDRESS_NOT_GEOCODABLE: Problem und NICHT geokodierbar
  // - NO_ADDRESS_ISSUE: kein Adressthema
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

  // Zähle alle eingeschalteten Fehlerflags zu einer Gesamtzahl zusammen.
  private readonly EXPR_ERROR_COUNT = `
    (CASE WHEN ${this.EXPR.err_missing_rhythmus} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_missing_kennung} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_inconsistent_kennung_rhythmus} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_missing_history} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_missing_contact} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_no_geocoding} THEN 1 ELSE 0 END) +
    (CASE WHEN ${this.EXPR.err_address_changed} THEN 1 ELSE 0 END)
  `;

  // Whitelist für sortierbare Felder (verhindert SQL-Injection durch freie Sort-Keys).
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

  // ---------------------------------------------------------------------------
  // Basis-Query: aktive Kunden + berechnete Felder (Flags/Score/Klasse)
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Filter anwenden: einfache Felder + boolsche Flags + Error-Klasse
  // ---------------------------------------------------------------------------
  private applyFilters(
    qb: SelectQueryBuilder<Customer>,
    dto: ReportsErrorsQueryDto,
  ) {
    if (dto.plz) qb.andWhere('k.plz = :plz', { plz: dto.plz });
    if (dto.ort) qb.andWhere('k.ort ILIKE :ort', { ort: `%${dto.ort}%` });
    if (dto.datenfehler !== undefined)
      qb.andWhere('k.datenfehler = :df', { df: dto.datenfehler });

    if (dto.kundennummer) {
      qb.andWhere('k.kundennummer ILIKE :knr', {
        knr: `%${dto.kundennummer}%`,
      });
    }

    if (dto.kundenname) {
      qb.andWhere('(k.nachname ILIKE :kname OR k.vorname ILIKE :kname)', {
        kname: `%${dto.kundenname}%`,
      });
    }

    // Hilfsfunktion für boolsche Filter (TRUE/FALSE) auf berechneten Ausdrücken.
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

    // Klassen-Filter: leitet sich aus mehreren Flags ab (siehe EXPR_ERROR_CLASS).
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

  // ---------------------------------------------------------------------------
  // JSON: Liste mit Sortierung + Pagination + berechneten Feldern
  // ---------------------------------------------------------------------------
  async listLatestErrors(dto: ReportsErrorsQueryDto) {
    // total (Count mit gleichen Filtern)
    const totalQb = this.buildBaseQuery();
    this.applyFilters(totalQb, dto);
    const total = await totalQb.getCount();

    // Fehleranzahl. Gesamt + Kategorie als stats
    const statsQb = this.buildBaseQuery();
    this.applyFilters(statsQb, dto);
    // keine Sortierung/Pagination
    statsQb.select([]);
    statsQb.addSelect('COUNT(*)', 'total_filtered');
    statsQb.addSelect(
      `SUM(CASE WHEN k.datenfehler = TRUE THEN 1 ELSE 0 END)`,
      'datenfehler_count',
    );
    statsQb.addSelect(
      `SUM(CASE WHEN ${this.EXPR_ERROR_CLASS} = 'NO_ADDRESS_ISSUE' THEN 1 ELSE 0 END)`,
      'cnt_no_address_issue',
    );
    statsQb.addSelect(
      `SUM(CASE WHEN ${this.EXPR_ERROR_CLASS} = 'ADDRESS_GEOCODABLE' THEN 1 ELSE 0 END)`,
      'cnt_address_geocodable',
    );
    statsQb.addSelect(
      `SUM(CASE WHEN ${this.EXPR_ERROR_CLASS} = 'ADDRESS_NOT_GEOCODABLE' THEN 1 ELSE 0 END)`,
      'cnt_address_not_geocodable',
    );
    const statsRaw = await statsQb.getRawOne<{
      total_filtered: string;
      datenfehler_count: string;
      cnt_no_address_issue: string;
      cnt_address_geocodable: string;
      cnt_address_not_geocodable: string;
    }>();

    // rows vorbereiten
    const rowsQb = this.buildBaseQuery();
    this.applyFilters(rowsQb, dto);

    // Sortierung (nur whitelisted Keys)
    const sortKey: errorSortable = dto.orderBy ?? 'error_class';
    const sortCol = this.SORT_MAP[sortKey];
    const sortDir: 'ASC' | 'DESC' = dto.orderDir === 'ASC' ? 'ASC' : 'DESC';
    rowsQb.orderBy(sortCol, sortDir);

    // Pagination (harte Obergrenze 200)
    const limit = Math.min(dto.limit ?? 50, 200);
    const offset = dto.offset ?? 0;
    rowsQb.take(limit).skip(offset);

    // Raw holen und in flache Objekte mappen (inkl. virtueller Spalten)
    const rowsRaw = await rowsQb.getRawMany<any>(); // TODO row typisierung
    const rows = rowsRaw.map(this.mapRow);

    return {
      total,
      limit,
      offset,
      orderBy: sortKey,
      orderDir: sortDir,
      rows,
      stats: {
        total_filtered: Number(statsRaw?.total_filtered ?? 0),
        datenfehler_count: Number(statsRaw?.datenfehler_count ?? 0),
        by_error_class: {
          NO_ADDRESS_ISSUE: Number(statsRaw?.cnt_no_address_issue ?? 0),
          ADDRESS_GEOCODABLE: Number(statsRaw?.cnt_address_geocodable ?? 0),
          ADDRESS_NOT_GEOCODABLE: Number(
            statsRaw?.cnt_address_not_geocodable ?? 0,
          ),
        },
      },
    };
  }

  // ---------------------------------------------------------------------------
  // XLSX-Export: alle gefilterten Zeilen (Pagination wird ignoriert)
  // ---------------------------------------------------------------------------
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

    // Workbook/Worksheet erzeugen
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Fehlerreport');

    // Spalten-Header + Reihenfolge (bewusst sprechende Überschriften)
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
      { header: 'Besuchsrhythmus', key: 'besuchrhythmus', width: 16 },
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

    // Kopfzeile hervorheben
    ws.getRow(1).font = { bold: true };

    const buffer = await wb.xlsx.writeBuffer();
    return {
      filename: `fehlerreport_latest.xlsx`,
      buffer: Buffer.from(buffer),
    };
  }

  // ---------------------------------------------------------------------------
  // Mapping Raw-Result → flaches JSON mit sinnvoll typisierten Feldern.
  // - `getRawMany` liefert Aliasse wie `k_nachname` etc.; hier in sprechende Keys gemappt.
  // - boolean/number-Strings werden in echte `boolean`/`number` konvertiert.
  // ---------------------------------------------------------------------------
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
