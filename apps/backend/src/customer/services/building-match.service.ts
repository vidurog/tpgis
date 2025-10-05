// src/customer/services/gebaeude-match.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/*
T0: Perfekter Treffer
T1: exakte straße Hnr in Bereich
T2: exakte straße + hnr beliebig
T3: gleicher ort (similarity)>=0.9

*/
export type GebRefMatch = {
  lon: number;
  lat: number;
  matchedStrasse: string;
  matchedHnr: string | null;
  matchedOrt: string;
  oid: string; // aus Referenz
};

@Injectable()
export class BuildingMatchService {
  constructor(
    private readonly ds: DataSource
  ) {}

  async match(
    str: string | null,
    hnr: string | null,
    adz: string | null,
    ort: string | null,
    plz?: string | null, // TODO kommt nicht in Gebaeude vor
  ): Promise<GebRefMatch | null> {

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
      const rows = await this.ds.query(sql, [ort, str, hnr, adz]);
      if(!rows.length) return null;
      const pick = rows[0];
      
      return {
        oid: pick.oid,
      matchedStrasse: pick.str,
      matchedHnr: pick.hnr,
      matchedOrt: pick.ort,
      lon: Number(pick.lon),
      lat: Number(pick.lat),
      }
    }

  }

