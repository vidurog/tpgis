// src/reports/reports.controller.ts
import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ImportHistoryQueryDto } from './dto/import-history-query.dto';
import { ReportsHistoryService } from './reports_history.service';
import { RunsQueryDto } from './dto/runs-query.dto';
import { ReportsErrorsQueryDto } from './dto/reports-error-query.dto';
import { ReportsErrorService } from './reports_error.service';
import type { Response } from 'express';

// 🔹 Swagger
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';

// Einheitliches Fehler-Schema (nur zur Doku)
const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer', example: 400 },
    code: { type: 'string', example: 'MIGRATION_FAILED' },
    message: { type: 'string', example: 'Migration fehlgeschlagen.' },
  },
  required: ['statusCode', 'message'],
};

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly history: ReportsHistoryService,
    private readonly reportErrors: ReportsErrorService,
  ) {}

  // GET /reports/runs
  @Get('runs')
  @ApiOperation({ summary: 'Import-Runs auflisten' })
  @ApiOkResponse({
    description: 'Liste von Runs',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 5 },
            limit: { type: 'integer', example: 50 },
            offset: { type: 'integer', example: 0 },
            orderBy: { type: 'string', example: 'imported_at' },
            orderDir: {
              type: 'string',
              enum: ['ASC', 'DESC'],
              example: 'DESC',
            },
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  import_id: { type: 'string', example: '1759868781964' },
                  imported_at: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-10-07T20:26:21.964Z',
                  },
                  imported_by: { type: 'string', example: 'leon' },
                  merged: { type: 'boolean', example: true },
                  inserted_rows: { type: 'integer', example: 18 },
                },
                required: ['import_id', 'imported_at', 'imported_by'],
              },
            },
          },
          required: ['total', 'limit', 'offset', 'rows'],
        },
        example: {
          total: 5,
          limit: 50,
          offset: 0,
          orderBy: 'imported_at',
          orderDir: 'DESC',
          rows: [
            {
              import_id: '1759868781964',
              imported_at: '2025-10-07T20:26:21.964Z',
              imported_by: 'leon',
              merged: true,
              inserted_rows: 18,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Serverfehler',
    content: { 'application/json': { schema: errorSchema } },
  })
  getRuns(@Query() dto: RunsQueryDto) {
    const res = this.history.listRuns(dto);
    return res;
  }

  // GET /reports/import-history
  @Get('import-history')
  @ApiOperation({ summary: 'Historie aller Importe' })
  @ApiOkResponse({
    description: 'Historie-Einträge',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 294 },

              import_id: { type: 'integer', example: 1759868781964 },
              imported_at: {
                type: 'string',
                example: '2025-10-07T20:26:21.964Z',
              },
              imported_by: { type: 'string', example: 'admin' },
              kunde: { type: 'string | null', example: 'Max, Mustermann' },
              strasse: { type: 'string | null', example: 'Musterstraße 3n' },
              plz: { type: 'string | null', example: '45481' },
              ort: { type: 'string | null', example: 'Mülheim' },
              telefon: { type: 'string | null', example: '0123 456789' },
              mobil: { type: 'string | null', example: '0123 456789' },
              geburtstag: { type: 'string | null', example: '1981-11-05' },
              kennung: { type: 'string | null', example: 'Pflegegrad 3' },
              start: { type: 'string | null', example: '2025-11-17' },
              ende: { type: 'string | null', example: '2025-11-17' },
              auftraege: { type: 'string | null', example: '§ 37.3 SGB XI' },
              serviceberater: {
                type: 'string | null',
                example: 'Madame Musterfrau',
              },
              besuchrhythmus: { type: 'string | null', example: '3 Monate' },
              qs_besuch_datum: { type: 'string | null', example: '2025-02-12' },
              qs_besuch_art: {
                type: 'string | null',
                example: 'Physiotherapie',
              },
              qs_besuch_historik: {
                type: 'string | null',
                example: '2025-04-28',
              },
              qs_besuch_hinweis_1: { type: 'string | null', example: null },
              qs_besuch_hinweis_2: { type: 'string | null', example: null },
            },
          },
        },
        example: [
          {
            id: 294,
            import_id: 1759868781964,
            imported_at: '2025-10-07T20:26:21.964Z',
            imported_by: 'admin',
            kunde: 'Max, Mustermann',
            strasse: 'Musterstraße 3n',
            plz: '45481',
            ort: 'Mülheim',
            telefon: '0123 456789',
            mobil: '0123 456789',
            geburtstag: '1981-11-05',
            kennung: 'Pflegegrad 3',
            start: '2025-11-17',
            ende: '2025-11-17',
            auftraege: '§ 37.3 SGB XI',
            serviceberater: 'Madame Musterfrau',
            besuchrhythmus: '3 Monate',
            qs_besuch_datum: '2025-02-12',
            qs_besuch_art: 'Physiotherapie',
            qs_besuch_historik: '2025-04-28',
            qs_besuch_hinweis_1: null,
            qs_besuch_hinweis_2: null,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Serverfehler',
    content: { 'application/json': { schema: errorSchema } },
  })
  async getHistory(@Query() dto: ImportHistoryQueryDto) {
    const res = await this.history.listAll(dto);
    return res;
  }

  /* GET /reports/import-history/:importId
  @Get('import-history/:importId')
  @ApiOperation({ summary: 'Historie nach Import-ID' })
  @ApiParam({
    name: 'importId',
    example: '1759862061432',
    description: 'Import-ID',
  })
  @ApiOkResponse({
    description: 'Historie-Einträge zu einer Import-ID',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: { $ref: '#/components/schemas/ImportHistoryItem' },
        },
        example: [
          {
            import_id: '1759862061432',
            file: '2025-10-07-kunden.xlsx',
            seen: 127,
            staged: 127,
            failed: 0,
            created_at: '2025-10-07T17:31:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Import nicht gefunden',
    content: { 'application/json': { schema: errorSchema } },
  })
  @ApiResponse({
    status: 500,
    description: 'Serverfehler',
    content: { 'application/json': { schema: errorSchema } },
  })
  getHistoryOfImportId(
    @Param('importId') importId: string,
    @Query() dto: ImportHistoryQueryDto,
  ) {
    dto.import_id = importId;
    const res = this.history.listAll(dto);
    console.log('reports/impHist/:impId res:', res);
    return res;
  }
    */

  // GET /reports/errors
  @Get('errors')
  @ApiOperation({ summary: 'Aktuelle Datenfehler-Liste' })
  @ApiOkResponse({
    description: 'Fehlerliste',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 18 },
            limit: { type: 'integer', example: 50 },
            offset: { type: 'integer', example: 0 },
            orderBy: { type: 'string', example: 'error_class' },
            orderDir: {
              type: 'string',
              enum: ['ASC', 'DESC'],
              example: 'DESC',
            },
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  // Basisdaten
                  kundennummer: { type: 'string', example: 'MUSMAXMUS12' },
                  nachname: { type: 'string', example: 'Mustermann' },
                  vorname: { type: 'string', example: 'Max' },
                  strasse: { type: 'string', example: 'Musterstraße' },
                  hnr: { type: 'string', example: '12' },
                  adz: {
                    type: 'string | null',
                    example: null,
                    description: 'Adresszusatz',
                  },
                  plz: { type: 'string', example: '12345' },
                  ort: { type: 'string', example: 'Musterstadt' },
                  telefon: { type: 'string', example: '+49 171 0000000' },
                  mobil: { type: 'string | null', example: null },

                  geburtstag: {
                    type: 'string',
                    format: 'date-time',
                    example: '1980-01-01T00:00:00.000Z',
                  },
                  kennung: { type: 'string', example: 'Pflegegrad 3' },
                  start: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-05-22T00:00:00.000Z',
                  },
                  ende: {
                    type: 'string | null',
                    format: 'date-time',
                    example: null,
                  },

                  // Geometrie (vereinfacht)
                  geom: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', example: 'Point' },
                      coordinates: {
                        type: 'array',
                        items: { type: 'number' },
                        example: [7.0001, 51.0002],
                      },
                    },
                  },
                  gebref_oid: { type: 'string', example: 'DENW25HK0000467Y' },

                  // Status / Flags
                  datenfehler: { type: 'boolean', example: true },
                  begruendung_datenfehler: {
                    type: 'string',
                    example: 'Kein Besuchrhythmus',
                  },
                  aktiv: { type: 'boolean', example: true },
                  geocodable: { type: 'boolean', example: true },

                  // Fehlerklassifizierung & Counter
                  error_class: { type: 'string', example: 'NO_ADDRESS_ISSUE' },
                  error_count: { type: 'integer', example: 1 },

                  // Detail-Fehlerflags
                  err_missing_rhythmus: { type: 'boolean', example: true },
                  err_missing_kennung: { type: 'boolean', example: false },
                  err_inconsistent_kennung_rhythmus: {
                    type: 'boolean',
                    example: false,
                  },
                  err_missing_history: { type: 'boolean', example: false },
                  err_missing_contact: { type: 'boolean', example: false },
                  err_no_geocoding: { type: 'boolean', example: false },
                  err_address_changed: { type: 'boolean', example: false },
                },
                required: [
                  'kundennummer',
                  'nachname',
                  'vorname',
                  'strasse',
                  'plz',
                  'ort',
                  'error_class',
                ],
                additionalProperties: true,
              },
            },
          },
          required: ['total', 'limit', 'offset', 'rows'],
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Serverfehler',
    content: { 'application/json': { schema: errorSchema } },
  })
  getErrorReport(@Query() dto: ReportsErrorsQueryDto) {
    const res = this.reportErrors.listLatestErrors(dto);
    return res;
  }

  // GET /reports/errors.xlsx
  @Get('errors.xlsx')
  @ApiOperation({ summary: 'Fehlerliste als Excel (XLSX) herunterladen' })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOkResponse({
    description: 'XLSX-Datei',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Export fehlgeschlagen',
    content: { 'application/json': { schema: errorSchema } },
  })
  async getLatestErrorsXlsx(
    @Query() dto: ReportsErrorsQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.reportErrors.exportLatestErrorsXlsx(dto);

    // Response-Header für Datei-Download setzen
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.send(buffer);
  }
}
