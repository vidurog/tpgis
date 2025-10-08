// apps/backend/src/migrations/1710010000500_extensions.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Extensions1710010000500 implements MigrationInterface {
  name = 'Extensions1710010000500';

  public async up(q: QueryRunner): Promise<void> {
    // Nur Kern + nützliche Extras
    await q.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // Sicherheitsnetz: falls jemand versehentlich Geocoder/Topology aktiviert hat
    await q.query(`DROP EXTENSION IF EXISTS postgis_tiger_geocoder CASCADE;`);
    await q.query(`DROP EXTENSION IF EXISTS postgis_topology CASCADE;`);
    await q.query(`DROP SCHEMA IF EXISTS tiger CASCADE;`);
    await q.query(`DROP SCHEMA IF EXISTS tiger_data CASCADE;`);
    await q.query(`DROP SCHEMA IF EXISTS topology CASCADE;`);
  }

  public async down(q: QueryRunner): Promise<void> {
    // Extensions droppen wir normalerweise nicht.
  }
}
