// src/customer/customer-merge.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerImport } from 'src/customer_imports/customer_imports.entity';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { Customer } from './customer.entity';
import { CustomerWriterService } from './services/customer_writer.service';
import { CustomerDTO } from './dto/customer.dto';
import { CustomerNormalization } from './services/customer-normalization.service';
import { CustomerGeoService } from './services/customer-geo.service';
import { CustomerValidationService } from './services/customer-validation.service';
import { BuildingMatchService } from './services/building-match.service';
import { CustomerImportsRunsService } from 'src/customer_imports_runs/customer_imports_runs.service';
import { ErrorFactory } from 'src/util/ErrorFactory';

@Injectable()
export class CustomerMergeService {
  constructor(
    @InjectRepository(CustomerImport)
    private readonly importRepo: Repository<CustomerImport>,

    private readonly customerWriter: CustomerWriterService,
    private readonly normService: CustomerNormalization,
    private readonly geomService: CustomerGeoService,
    private readonly matchService: BuildingMatchService,
    private readonly validateService: CustomerValidationService,
    private readonly runService: CustomerImportsRunsService,
  ) {}

  /**
   * SQL-Quelle für Importdaten (dedupliziert).
   *
   * @remarks
   * - Normalisiert Schlüsselspalten (`norm_name`, `norm_plz`, `norm_ort`) und fasst
   *   per `DISTINCT ON (norm_name, addr, norm_plz, norm_ort)` zusammen.
   * - Pro (Name, Adresse, PLZ, Ort) bleibt jeweils die **zuletzt importierte** Zeile
   *   (Sortierung via `imported_at DESC`).
   * - Leere Datensätze werden vorab herausgefiltert.
   */
  importQuery = `
          WITH src AS (
            SELECT
              ki.*,
              lower(trim(ki.kunde)) AS norm_name,
              ki.strasse AS addr,
              nullif(trim(coalesce(ki.plz::text,'')), '') AS norm_plz,
              lower(trim(coalesce(ki.ort,''))) AS norm_ort
            FROM kunden_import ki
            WHERE ki.import_id = $1
          )
          SELECT DISTINCT ON (norm_name, addr, norm_plz, norm_ort) *
          FROM src
          -- leere Datensätze raus
          WHERE (norm_name <> '' OR addr <> '')
          ORDER BY norm_name, addr, norm_plz, norm_ort, imported_at DESC;
          `;

  /**
   * Führt den **Merge/Upsert** eines Imports in die Kundentabelle durch.
   *
   * Pipeline (pro Zeile):
   * 1. **DTO bauen** → Grundstruktur aus Importzeile
   * 2. **Normalisieren** → Name, Straße/Hausnr./Zusatz, Telefon/Mobil (E.164), Kennung, Ort, Kundennummer, Planmonat
   * 3. **Geokodierung** → zuerst DB-Match (Gebäudereferenz, T0 exakt), danach **Fallback** via NRW OGC-API
   * 4. **Validieren** → Datenfehler ermitteln, Begründung setzen
   * 5. **Upsert-Batch** → Werte sammeln (Geom ggf. als SQL-Funktion), in Batches schreiben
   * 6. **Seen-Tracking** → aktive Kundenmenge aufbauen
   *
   * Nachlauf:
   * - Restbatch flushen
   * - **Deaktivierung**: alle nicht gesehenen Kunden `aktiv = false`
   * - Import-Run auf `merged = true` setzen
   *
   * @param import_id Importkennung
   * @returns Kennzahlen des Merges (inserted/updated/total)
   * @throws ErrorFactory.emptyFile Wenn keine Quellzeilen gefunden wurden
   */
  async mergeToCustomer(import_id: string) {
    const seen = new Set<string>(); // Menge aller Kundennummern, die in diesem Lauf vorkamen
    const BATCH_SIZE = 200;

    let inserted: number = 0;
    let updated: number = 0;
    let batch: Array<QueryDeepPartialEntity<Customer>> = [];

    // Batch über WriterService in CB schreiben
    const flush = async () => {
      if (!batch.length) return;
      const res = await this.customerWriter.bulkInsert(batch);
      const rowsRet = (res?.raw ?? []) as Array<{ xmax: any }>;
      // PostgreSQL: INSERT → xmax = 0, UPDATE → xmax > 0
      const ins = rowsRet.filter((r) => Number(r.xmax) === 0).length;
      inserted += ins;
      updated += rowsRet.length - ins;
      batch = [];
    };

    // nicht vorhandene Kunden aktiv = false markieren
    const deactivate = async () => {
      if (!seen.size) return;
      await this.customerWriter.deactivate(seen);
    };

    // 1) Zeilen aus kunden_import laden
    const rows = await this.importRepo.query(this.importQuery, [import_id]);
    if (!rows.length) throw ErrorFactory.emptyFile();
    console.log('deduped rows:', rows.length);

    // 2) Pipeline pro Zeile
    for await (const [i, row] of rows.entries()) {
      // 2.1) Kunden DTO aus kunden_import bauen
      let customer: CustomerDTO = {
        kundennummer: '000',
        nachname: row.kunde!,
        vorname: null,
        strasse: row.strasse,
        hnr: null,
        adz: null,
        plz: row.plz,
        ort: row.ort,
        telefon: row.telefon,
        mobil: row.mobil,
        geburtstag: row.geburtstag ? new Date(row.geburtstag) : null,
        kennung: row.kennung,
        start: row.start ? new Date(row.start) : null,
        ende: row.ende ? new Date(row.ende) : null,
        auftraege: row.auftraege,
        serviceberater: row.serviceberater,
        besuchrhythmus: row.besuchrhythmus,
        qs_besuch_datum: row.qs_besuch_datum
          ? new Date(row.qs_besuch_datum)
          : null,
        qs_besuch_art: row.qs_besuch_art,
        qs_besuch_historik: row.qs_besuch_historik
          ? new Date(row.qs_besuch_historik)
          : null,
        qs_besuch_hinweis_1: row.qs_besuch_hinweis_1,
        qs_besuch_hinweis_2: row.qs_besuch_hinweis_2,
        geom: null,
        planmonat: null,
        termin: null, // Date // Logik TODO
        termindauer_min: null, // Logik TODO
        terminstatus: null, // Logik TODO
        termingrund: null, // Logik TODO
        reihenfolge_nr: null, // Logik TODO
        parken: null, // Logik TODO
        bemerkung: null, // Logik TODO
        datenfehler: false,
        begruendung_datenfehler: null,
        aktiv: true, // Logik TODO
        gebref_oid: null,
      };

      // 2.2) Pipeline
      // ------------------- Normalisieren -------------------
      [customer.vorname, customer.nachname] = this.normService.normalizeName(
        customer.nachname,
      );
      [customer.strasse, customer.hnr, customer.adz] =
        this.normService.normalizeStrasse(customer.strasse!);
      customer.telefon = this.normService.normalizeToE164(customer.telefon);
      customer.mobil = this.normService.normalizeToE164(customer.mobil);
      customer.kennung = this.normService.normalizeKennung(customer.kennung);
      customer.ort = this.normService.normalizeOrt(customer.ort!);

      customer.kundennummer = this.normService.createKundennummer(
        customer.vorname,
        customer.nachname,
        customer.strasse,
        customer.hnr,
      );

      // customer.besuchrhythmus = CUSTOMER_BESUCHRHYTHMUS.Pflegegrad2; // DEBUG
      customer.planmonat = this.normService.createPlanmonat(
        customer.qs_besuch_historik,
        customer.besuchrhythmus,
      );

      // ------------------- DB Gebäudematch -------------------
      // T0: Exakt auf (Ort/Kreis, Straße normiert, Hausnummer numerisch, Suffix)
      const match = await this.matchService.match(
        customer.strasse,
        customer.hnr,
        customer.adz,
        customer.ort,
        customer.plz,
      );

      let point: { lon: number; lat: number } | null = null;
      if (match) {
        point = { lon: match.lon, lat: match.lat };
        customer.strasse = match.matchedStrasse; // Amtlicher Straßenname aus Referenz
        customer.hnr = match.matchedHnr;
        customer.gebref_oid = match.oid;
      }

      // ------------------- FALLBACK: OGC-API -------------------
      if (!point) {
        console.log('Fallback', customer.strasse);
        point = await this.geomService.findGeomViaApi(
          customer.strasse,
          customer.hnr!,
          customer.plz!,
          customer.ort!,
        );
      }

      customer.geom = point ?? null;

      // ------------------- Validieren -------------------
      const datenfehler: string | null = this.validateService.validate(
        customer,
        row.strasse!, // Straße aus Import (nicht normalisiert vom Kunden)
      );

      if (datenfehler) {
        customer.datenfehler = true;
        customer.begruendung_datenfehler = datenfehler;
      } else {
        customer.datenfehler = false;
        customer.begruendung_datenfehler = null;
      }

      // 2.3) DB-Values bauen
      const values: Record<string, any> = {};
      for (const [k, v] of Object.entries(customer)) {
        if (k === 'geom' && point) continue; // Geometrie separat setzen (als SQL-Funktion)
        if (v !== undefined) values[k] = v; // NULL-Werte erlauben
      }

      // 2.3.1) Geometry-Punkt durch SQL-Funktion setzen (WGS84)
      if (point) {
        values.geom = () =>
          `ST_SetSRID(ST_MakePoint(${point.lon}, ${point.lat}),4326)`;
      }

      // 2.4) In Batch übernehmen
      batch.push(values as QueryDeepPartialEntity<Customer>);

      // 2.5) kundennummer → seen[]
      seen.add(customer.kundennummer);

      // 2.6) Batch schreiben
      if (batch.length >= BATCH_SIZE) await flush();
    }

    // 3) Rest flushen
    await flush();

    // 4) nicht vorhandene Kunden deaktivieren
    await deactivate();

    // 5) ImportRun merged = true
    this.runService.mergeImport(import_id);

    return { import_id, inserted, updated, total: inserted + updated };
  }
}
