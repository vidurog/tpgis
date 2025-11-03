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

  // Whitelist für sortierbare Felder (verhindert SQL-Injection durch freie Sort-Keys).
  private readonly SORT_MAP: Record<errorSortable, string> = {
    kundennummer: 'k.kundennummer',
    nachname: 'k.nachname',
    vorname: 'k.vorname',
    strasse: 'k.strasse',
    plz: 'k.plz',
    ort: 'k.ort',
    aktiv: 'k.aktiv',

    // persistiert
    datenfehler: 'kf.datenfehler',
    error_class: 'kf.klasse',
    error_count: 'kf.fehleranzahl',

    // Einzel-Flags
    err_missing_rhythmus: 'kf.rhythmus_fehler',
    err_missing_kennung: 'kf.kennung_fehler',
    err_inconsistent_kennung_rhythmus: 'kf.inkonsistenz',
    err_missing_history: 'kf.historik_fehler',
    err_missing_contact: 'kf.kontakt_fehler',
    err_no_geocoding: 'kf.geom_fehler',
    err_address_changed: '(kf.adresse_neu IS NOT NULL)',

    // Kompatibel
    geocodable: '(NOT kf.geom_fehler)',
  };

  // ---------------------------------------------------------------------------
  // Basis-Query: aktive Kunden + berechnete Felder (Flags/Score/Klasse)
  // ---------------------------------------------------------------------------
  private buildBaseQuery(): SelectQueryBuilder<Customer> {
    return this.kundenRepo
      .createQueryBuilder('k')
      .leftJoin('kunden_fehler', 'kf', 'kf.kundennummer = k.kundennummer')
      .addSelect('kf.datenfehler', 'datenfehler')
      .addSelect('kf.klasse', 'error_class')
      .addSelect('kf.fehleranzahl', 'error_count')
      .addSelect('kf.rhythmus_fehler', 'rhythmus_fehler')
      .addSelect('kf.kennung_fehler', 'kennung_fehler')
      .addSelect('kf.inkonsistenz', 'inkonsistenz')
      .addSelect('kf.historik_fehler', 'historik_fehler')
      .addSelect('kf.kontakt_fehler', 'kontakt_fehler')
      .addSelect('kf.geburtstag_fehler', 'geburtstag_fehler')
      .addSelect('kf.geom_fehler', 'geom_fehler')
      .addSelect('kf.adresse_neu', 'adresse_neu')
      .addSelect('(NOT kf.geom_fehler)', 'geocodable')
      .addSelect('kf.geom_fehler', 'err_no_geocoding');
  }

  // ---------------------------------------------------------------------------
  // Filter anwenden: einfache Felder + boolsche Flags + Error-Klasse
  // ---------------------------------------------------------------------------
  private applyFilters(
    qb: SelectQueryBuilder<Customer>,
    dto: ReportsErrorsQueryDto,
  ) {
    // Standard: nur aktive, außer aktiv explizit gesetzt wurde
    if (dto.aktiv === undefined) {
      qb.andWhere('k.aktiv = true');
    } else {
      qb.andWhere('k.aktiv = :aktiv', { aktiv: dto.aktiv });
    }

    if (dto.plz) qb.andWhere('k.plz = :plz', { plz: dto.plz });
    if (dto.ort) qb.andWhere('k.ort ILIKE :ort', { ort: `%${dto.ort}%` });
    if (dto.datenfehler !== undefined)
      qb.andWhere('kf.datenfehler = :df', { df: dto.datenfehler });

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

    const boolFilter = <T extends keyof ReportsErrorsQueryDto>(
      field: T,
      expr: string,
    ) => {
      const v = dto[field];
      if (v !== undefined)
        qb.andWhere(`${expr} = :${String(field)}`, { [String(field)]: v });
    };

    // Kompatible alte Query-Flags → kf Felder
    boolFilter('geocodable', '(NOT kf.geom_fehler)');
    boolFilter('err_missing_rhythmus', 'kf.rhythmus_fehler');
    boolFilter('err_missing_kennung', 'kf.kennung_fehler');
    boolFilter('err_inconsistent_kennung_rhythmus', 'kf.inkonsistenz');
    boolFilter('err_missing_history', 'kf.historik_fehler');
    boolFilter('err_missing_contact', 'kf.kontakt_fehler');
    boolFilter('err_no_geocoding', 'kf.geom_fehler');
    boolFilter('err_address_changed', '(kf.adresse_neu IS NOT NULL)');

    // Klassen-Filter exakt/CI
    if (dto.error_class) {
      qb.andWhere("kf.klasse ILIKE :klass ESCAPE '\\'", {
        klass: dto.error_class.replace(/_/g, '\\_'),
      });
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
    const statsQb = this.kundenRepo
      .createQueryBuilder('k')
      .leftJoin('kunden_fehler', 'kf', 'kf.kundennummer = k.kundennummer');

    this.applyFilters(statsQb as any, dto);

    statsQb.select([]);
    statsQb.addSelect('COUNT(*)', 'total_filtered');
    statsQb.addSelect(
      `SUM(CASE WHEN kf.datenfehler = TRUE THEN 1 ELSE 0 END)`,
      'datenfehler_count',
    );
    statsQb.addSelect(
      `SUM(CASE WHEN kf.klasse = 'NO_ADDRESS_ISSUE' THEN 1 ELSE 0 END)`,
      'cnt_no_address_issue',
    );
    statsQb.addSelect(
      `SUM(CASE WHEN kf.klasse = 'ADDRESS_GEOCODABLE' THEN 1 ELSE 0 END)`,
      'cnt_address_geocodable',
    );
    statsQb.addSelect(
      `SUM(CASE WHEN kf.klasse = 'ADDRESS_NOT_GEOCODABLE' THEN 1 ELSE 0 END)`,
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
    // Customer-Basis
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
    aktiv: r.k_aktiv,
    gebref_oid: r.k_gebref_oid,
    sgb_37_3: r.k_sgb_37_3,
    pflegefirma: r.k_pflegefirma,

    // Persistierte Fehlerfelder
    datenfehler: !!r.datenfehler,
    error_class: r.error_class ?? 'NO_ADDRESS_ISSUE',
    error_count: Number(r.error_count ?? 0),

    rhythmus_fehler: !!r.rhythmus_fehler,
    kennung_fehler: !!r.kennung_fehler,
    inkonsistenz: !!r.inkonsistenz,
    historik_fehler: !!r.historik_fehler,
    kontakt_fehler: !!r.kontakt_fehler,
    geburtstag_fehler: !!r.geburtstag_fehler,

    // Geo/Kompatibilität
    geom_fehler: !!r.geom_fehler,
    geocodable: !!r.geocodable, // = NOT geom_fehler
    err_no_geocoding: !!r.err_no_geocoding, // alias alt

    // Adresse
    adresse_neu: r.adresse_neu ?? null,
    err_address_changed: !!r.err_address_changed,
  });
}
