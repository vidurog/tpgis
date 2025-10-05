import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerImport } from './customer_imports/customer_imports.entity';
import { CustomerImportsModule } from './customer_imports/customer_imports.module';
import { Customer } from './customer/customer.entity';
import { CustomerImportRuns } from './customer_imports_runs/customer_imports_runs.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        type: 'postgres',
        host: cs.get('DB_HOST'),
        port: parseInt(cs.get('DB_PORT') ?? '5432', 10),
        username: cs.get('DB_USER'),
        password: cs.get('DB_PASS'),
        database: cs.get('DB_NAME'),
        entities: [CustomerImport, Customer, CustomerImportRuns],
        synchronize: false,
        migrationsRun: true,
      }),
    }),
    CustomerImportsModule,
  ], // end of imports
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
