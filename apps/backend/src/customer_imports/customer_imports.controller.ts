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
import { CustomerQueryService } from 'src/customer/services/customer-query.service';

@Controller('customer-imports')
export class CustomerImportsController {
  constructor(
    private readonly importService: CustomerImportsService,
    private readonly customerService: CustomerQueryService,
  ) {}

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
    return this.importService.importXlsxToStaging(full, run);
  }

  /*
  Morgen
  */
  // @Post(':importId/merge')
  @Get()
  // async merge(@Param('importId') importId: string) {
  async merge() {
    return this.customerService.mergeToCustomer(BigInt(1));
    // BigInt(importId));
  }
}
