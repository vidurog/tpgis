// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerImport } from './customer_imports/customer_imports.entity';
import { Customer } from './customer/customer.entity';
import { CustomerImportRuns } from './customer_imports_runs/customer_imports_runs.entity';
import { CustomerImportsModule } from './customer_imports/customer_imports.module';
import { ReportsModule } from './reports/reports.module';

// ✅ Migration als Klasse importieren (sicherste Variante im Nest-Runtime)
import path from 'path';
import { CustomerError } from './customer/customer_errors.entity';
// (Alternative: per Glob – siehe Kommentar unten)

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        type: 'postgres',
        host: cs.get<string>('DB_HOST') ?? 'localhost',
        port: parseInt(cs.get<string>('DB_PORT') ?? '5432', 10),
        username: cs.get<string>('DB_USER') ?? 'app',
        password: cs.get<string>('DB_PASSWORD') ?? 'app',
        database: cs.get<string>('DB_NAME') ?? 'tpgis_healthcare',

        entities: [CustomerImport, Customer, CustomerImportRuns, CustomerError],
        migrations: [path.join(__dirname, 'migrations/*.migration.ts')],

        synchronize: false,
        migrationsRun: true,
      }),
    }),

    CustomerImportsModule,
    ReportsModule,
  ],
})
export class AppModule {}
