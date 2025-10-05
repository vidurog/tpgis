import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'app',
  password: process.env.DB_PASSWORD || 'app',
  database: process.env.DB_NAME || 'tpgis_healthcare',
  // Wichtig: keine Auto-Schema-Änderungen mehr
  synchronize: false,
  // Migrationen automatisch beim App-Start laufen lassen (optional – ich empfehle zusätzlich)
  migrationsRun: true,
  // Entities & Migrations: TS im dev, JS im prod
  entities: [
    path.join(__dirname, '../../**/*.entity.{ts,js}'),
  ],
  migrations: [
    path.join(__dirname, '../../migrations/*.{ts,js}'),
  ],
  // SSL je nach Bedarf:
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
