// src/customer/services/gebaeude-match.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/*
GebäudeReferenzen Matching-Strategie 
-----------------------------------
T0: Perfekter Treffer
    - Straße (normalisiert) + Hausnummer (numerisch) + Anhang exakt
    - gleicher Kreis/Ort (normalisiert)

Aktuell implementiert: T0 (perfekter Treffer).
Die Stufen T1–T3 können später als Fallbacks ergänzt werden.
*/

/**
 * Ergebnis eines Gebäude-Referenz-Matches.
 *
 * @remarks
 * - `lon` / `lat` sind WGS84-Koordinaten (ST_X/ST_Y auf `geom_4326`).
 * - `matched*` spiegeln die gematchten Rohwerte aus der Referenz wider (zur Nachvollziehbarkeit im UI/Logging).
 * - `oid` ist der eindeutige Schlüssel aus der Gebäudereferenz (z. B. `tp_gis.gebref_norm.oid`).
 */
export type GebRefMatch = {
  /** Längengrad (WGS84). */
  lon: number;
  /** Breitengrad (WGS84). */
  lat: number;
  /** Gematchter Straßenname aus der Referenz (Quelle: `street_src`). */
  matchedStrasse: string;
  /** Gematchte Hausnummer inkl. Suffix (Quelle: `hnr_src`). */
  matchedHnr: string | null;
  /** Gematchter Ort/kreis aus der Referenz (Quelle: `ort_src`). */
  matchedOrt: string;
  /** OID aus der Referenz (Primärschlüssel). */
  oid: string; // aus Referenz
};

/**
 * Service für das Matching von Kundenadressen gegen die
 * normalisierte Gebäudereferenz (`tp_gis.gebref_norm`).
 *
 * @remarks
 * - Nutzt ausschließlich **serverseitige Normalisierung** (unaccent, tg_norm_*, tg_house_no_*),
 *   damit Frontend/Backend einheitlich bleiben.
 * - Aktuell wird nur die **exakte** T0-Variante abgedeckt (schnell und präzise).
 * - Falls kein Treffer gefunden wird, wird `null` zurückgegeben (kein Error-Throw).
 */
@Injectable()
export class BuildingMatchService {
  constructor(
    /** TypeORM DataSource; wird für rohe SQL-Queries verwendet. */
    private readonly ds: DataSource,
  ) {}

  /**
   * Versucht, eine Adresse gegen die Gebäudereferenz zu matchen (T0: perfekter Treffer).
   *
   * @param str Straßenname (unsaniert; wird in SQL normalisiert)
   * @param hnr Hausnummer (kann Zahl+Suffix enthalten, z. B. "14a")
   * @param adz Adresszusatz (optional; z. B. "Hinterhaus", "a", …)
   * @param ort Ort/Kreis (wird mit `kreis_norm` verglichen; Benennung historisch bedingt)
   * @param plz (optional) Postleitzahl – Hinweis: kommt in `gebref_norm` nicht vor (derzeit ungenutzt)
   * @returns Ein `GebRefMatch` bei Erfolg, sonst `null`.
   *
   * @example
   * ```ts
   * const hit = await buildingMatchService.match('Musterstraße', '12a', null, 'Musterstadt');
   * if (hit) {
   *   console.log(hit.oid, hit.lon, hit.lat);
   * }
   * ```
   */
  async match(
    str: string | null,
    hnr: string | null,
    adz: string | null,
    ort: string | null,
    plz?: string | null, // TODO kommt nicht in Gebaeude vor
  ): Promise<GebRefMatch | null> {
    // Exakter Treffer gegen die materialisierte Sicht `tp_gis.gebref_norm`.
    // - Eingaben werden in einem Subselect `p` normalisiert:
    //   * kreis_in  := lower(unaccent($1))                            ← ort (Benennung historisch; vergleicht mit r.kreis_norm)
    //   * street_in := lower(unaccent(tg_norm_street_name($2)))       ← str (Firmenregel zur Straßennormierung)
    //   * hnr_in    := NULLIF(tg_house_no_num_part($3),'')::int       ← numerischer Teil der Hausnummer
    //   * adz_in    := NULLIF(lower($4),'')                           ← Suffix/Anhang (z. B. "a")
    // - Join-Bedingungen:
    //   r.kreis_norm  = p.kreis_in
    //   r.street_norm = p.street_in
    //   r.hnr_num     = p.hnr_in
    //   COALESCE(r.hnr_suffix,'') = COALESCE(p.adz_in,'')
    // - Neueste Gültigkeit gewinnt (ORDER BY stichtag DESC LIMIT 1).
    const sql = `
        SELECT
          r.oid,
          r.street_src AS str,
          r.hnr_src    AS hnr,
          r.ort_src    AS ort,
          ST_X(r.geom_4326) AS lon,
          ST_Y(r.geom_4326) AS lat
        FROM tp_gis.gebref_norm r,
             ( SELECT
                 lower(unaccent($1))                                AS kreis_in,
                 lower(unaccent(topogrids.tg_norm_street_name($2))) AS street_in,
                 NULLIF(topogrids.tg_house_no_num_part($3),'')::int AS hnr_in,
                 NULLIF(lower($4),'')                               AS adz_in
               ) p
        WHERE r.kreis_norm  = p.kreis_in
          AND r.street_norm = p.street_in
          AND r.hnr_num     = p.hnr_in
          AND COALESCE(r.hnr_suffix,'') = COALESCE(p.adz_in,'')
        ORDER BY r.stichtag DESC
        LIMIT 1;
      `;

    // Parameterzuordnung:
    // $1 := ort, $2 := str, $3 := hnr, $4 := adz
    const rows = await this.ds.query(sql, [ort, str, hnr, adz]);

    // Kein Treffer → null (kein Fallback auf T1–T3 in dieser Methode).
    if (!rows.length) return null;

    // Ersten (besten) Treffer aufnehmen und in stark typisiertes Objekt mappen.
    const pick = rows[0];

    return {
      oid: pick.oid,
      matchedStrasse: pick.str,
      matchedHnr: pick.hnr,
      matchedOrt: pick.ort,
      lon: Number(pick.lon),
      lat: Number(pick.lat),
    };
  }
}
