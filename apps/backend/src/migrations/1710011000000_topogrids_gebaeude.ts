import { MigrationInterface, QueryRunner } from 'typeorm';

export class TopogridsGebaeude1710011000000 implements MigrationInterface {
  name = 'TopogridsGebaeude1710011000000';

  public async up(q: QueryRunner): Promise<void> {
    // 1) Schema
    await q.query(`CREATE SCHEMA IF NOT EXISTS tp_gis;`);

    // 2) Tabelle (entspricht deinem Dump; nur Schema = topogrids)
    await q.query(`
      CREATE TABLE IF NOT EXISTS tp_gis.gebaeude (
        nba         varchar(1),
        oid         text NOT NULL,
        qua         varchar(1),
        landschl    varchar(2),
        land        text,
        regbezschl  varchar(1),
        regbez      text,
        kreisschl   varchar(2),
        kreis       text,
        gmdschl     varchar(3),
        gmd         text,
        ottschl     varchar(4),
        ott         text,
        strschl     varchar(5),
        str         text,
        hnr         text,
        adz         text,
        zone        integer,
        ostwert     numeric,
        nordwert    numeric,
        datum       date,
        CONSTRAINT gebaeude_pk PRIMARY KEY (oid)
      );
    `);

    // 3) sinnvolle Indizes fürs Matching
    await q.query(`
      CREATE INDEX IF NOT EXISTS idx_gebaeude_gmd_str_hnr
        ON tp_gis.gebaeude (gmd, str, hnr, adz);

      CREATE INDEX IF NOT EXISTS idx_gebaeude_coords
        ON tp_gis.gebaeude (zone, ostwert, nordwert);

      CREATE INDEX IF NOT EXISTS idx_gebaeude_strschl
        ON tp_gis.gebaeude (strschl);
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS tp_gis.idx_gebaeude_strschl;`);
    await q.query(`DROP INDEX IF EXISTS tp_gis.idx_gebaeude_coords;`);
    await q.query(`DROP INDEX IF EXISTS tp_gis.idx_gebaeude_gmd_str_hnr;`);
    await q.query(`DROP TABLE IF EXISTS tp_gis.gebaeude;`);
    // Schema nicht droppen (da evtl. noch Firmenfunktionen dort liegen)
    // Wenn du es willst:
    // await q.query(`DROP SCHEMA IF EXISTS tp_gis CASCADE;`);
  }
}
