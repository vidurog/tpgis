import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CustomerImportsService } from './services/customer_imports.service';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'node:path';

@Controller('customer-imports')
export class CustomerImportsController {
  constructor(private readonly svc: CustomerImportsService) {}

  @Get()
  hello(): string {
    return this.svc.getHello();
  }

  @Post('xlsx') // http Endpunkt
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) =>
          cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
      }),
      fileFilter: (_req, file, cb) =>
        cb(null, /\.xlsx$/i.test(file.originalname)),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async importXlsx(@UploadedFile() file: Express.Multer.File) {
    const full = path.resolve(file.path);
    const run = { importId: String(Date.now()), user: 'leon' }; // später aus Auth
    return this.svc.importXlsxToStaging(full, run);
  }

  /*
  Morgen
  */
  @Post(':importId/merge')
  async merge(@Param('importId') importId: string) {
    return this.svc.mergeToCustomers(BigInt(importId));
  }
}
