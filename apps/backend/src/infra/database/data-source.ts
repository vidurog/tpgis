// -----------------------------------------------------------------------------
// Zentraler TypeORM-DataSource-Export für die App. Lädt .env, konfiguriert die
// Verbindung zu Postgres und steuert Migrations-/Schema-Verhalten.
// -----------------------------------------------------------------------------

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

// Lädt Umgebungsvariablen aus ".env" im Projekt-Root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Gemeinsame TypeORM DataSource.
 *
 * @remarks
 * - **Kein `synchronize`**: Schema nie automatisch verändern (Migrationen nutzen!)
 * - **`migrationsRun: true`**: Migrationen bei App-Start automatisch ausführen
 * - **Entities/Migrations**: Globs erlauben TS im Dev und JS im Build
 * - **SSL**: per ENV schaltbar (z. B. für Cloud-DBs)
 */
//-----

export const AppDataSource = new DataSource({
  // --- DB-Basis ---
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'app',
  password: process.env.DB_PASSWORD || 'app',
  database: process.env.DB_NAME || 'tpgis_healthcare',

  // Wichtig: keine Auto-Schema-Änderungen mehr → nur Migrationen!
  synchronize: false,

  // Optional, aber empfohlen: Migrationen automatisch beim App-Start ausführen
  migrationsRun: true,

  // --- Auflösung von Entities/Migrationen ---
  // Beide Muster erlauben .ts in Dev und .js nach Transpile/Build.
  entities: [path.join(__dirname, '../../**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '../../migrations/*.{ts,js}')],

  // --- SSL-Konfiguration (z. B. für Managed Postgres) ---
  // ENV DB_SSL=true schaltet SSL mit lockerem Zertifikatscheck ein.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
