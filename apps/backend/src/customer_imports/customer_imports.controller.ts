// src/customer_imports/customer_imports.controller.ts
import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CustomerImportsService } from './services/customer_imports.service';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'node:path';
import { CustomerMergeService } from 'src/customer/customer-merge.service';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { ErrorFactory } from 'src/util/ErrorFactory';

/**
 * Gemeinsames Schema für Fehlerantworten in Swagger.
 * (Nur für die Doku – der tatsächliche Error-Body kommt von deiner ErrorFactory/Exceptions.)
 */
const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer', example: 400 },
    message: { type: 'string', example: 'Nur .xlsx Dateien erlaubt' },
    error: { type: 'string', example: 'IMPORT_NOT_XLSX' },
  },
};

@ApiTags('customer-imports') // → Gruppiert Endpunkte unter "customer-imports"
@Controller('customer-imports')
export class CustomerImportsController {
  constructor(
    private readonly importService: CustomerImportsService,
    private readonly mergeService: CustomerMergeService,
  ) {}

  /**
   * Upload einer **Excel (.xlsx)**-Datei und Import ins **Staging**.
   *
   * - Verwendet `FileInterceptor('file', …)` für Multipart-Uploads.
   * - Speichert temporär unter `./uploads` (Dateiname: `<timestamp>-<original>`).
   * - Filtert **nicht-`.xlsx`** schon auf Interceptor-Ebene heraus.
   * - Antwort-Body dokumentiert mit `@ApiCreatedResponse` (201).
   */
  @Post('xlsx')
  @ApiOperation({
    summary: 'Excel (.xlsx) hochladen und in Staging importieren',
  })
  @ApiConsumes('multipart/form-data') // → Swagger: zeigt Upload-Form an
  @ApiBody({
    description: 'Excel-Datei im Feld "file" hochladen',
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({
    description: 'Import-Ergebnis',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            seen: { type: 'integer', example: 127 },
            staged: { type: 'integer', example: 127 },
            failed: { type: 'integer', example: 0 },
            import_id: { type: 'string', example: '1759862061432' },
          },
          required: ['seen', 'staged', 'failed', 'import_id'],
        },
        example: {
          seen: 127,
          staged: 127,
          failed: 0,
          import_id: '1759862061432',
        },
      },
    },
  })
  /**
   * Hinweis: Zwei getrennte 400-Responses sind erlaubt; sie dokumentieren jeweils unterschiedliche Fehlerfälle.
   * (Swagger zeigt beide an.)
   */
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          NotXlsx: {
            summary: 'Nur .xlsx erlaubt',
            value: {
              statusCode: 400,
              message: 'Nur .xlsx Dateien erlaubt',
              error: 'Bad Request',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          NotXlsx: {
            summary: 'Datei ist leer',
            value: {
              statusCode: 400,
              message: 'Die hochgeladene Datei ist leer oder fehlt.',
              error: 'Bad Request',
            },
          },
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) =>
          cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
      }),
      // ❗ lässt nur .xlsx-Dateien durch; sonst wird die Route gar nicht ausgeführt
      fileFilter: (_req, file, cb) =>
        cb(null, /\.xlsx$/i.test(file.originalname)),
      // Max. 50 MB pro Upload
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async importXlsx(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw ErrorFactory.emptyFile(); // Absicherung, falls Multer doch nichts lieferte
    const full = path.resolve(file.path);
    const run = { import_id: String(Date.now()), user: 'leon' }; // später aus Auth
    // Falls importXlsx Error wirft, handled NestJS das automatisch → Exception-Filter/HTTP-Response.
    return this.importService.importXlsxToStaging(full, run);
  }

  /**
   * Merge der importierten **Staging-Daten** in den **Kundenbestand**.
   *
   * - Nimmt eine `importId` (Pfadparam).
   * - Liefert Kennzahlen: `inserted`, `updated`, `total`.
   */
  @Post(':importId/merge')
  @ApiOperation({
    summary: 'Staging-Daten eines Imports in Kundenbestand mergen',
  })
  @ApiParam({
    name: 'importId',
    example: '1759862061432',
    description: 'Import ID',
  })
  @ApiCreatedResponse({
    description: 'Merge-Ergebnis',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            import_id: { type: 'string', example: '1759862061432' },
            inserted: { type: 'integer', example: 10 },
            updated: { type: 'integer', example: 2 },
            total: { type: 'integer', example: 12 },
          },
          required: ['import_id', 'inserted', 'updated', 'total'],
        },
        example: {
          import_id: '1759862061432',
          inserted: 10,
          updated: 2,
          total: 12,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Upload fehlgeschlagen',
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          NotXlsx: {
            summary: 'Upload fehlgeschlagen',
            value: {
              statusCode: 500,
              message: 'Upload von 123445678 fehlgeschlagen.',
              error: 'UPLOAD_FAILED',
            },
          },
        },
      },
    },
  })
  async merge(@Param('importId') importId: string) {
    const res = await this.mergeService.mergeToCustomer(importId);
    return res;
  }
}
