import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ImportHistoryQueryDto } from './dto/import-history-query.dto';
import { ReportsHistoryService } from './reports_history.service';
import { RunsQueryDto } from './dto/runs-query.dto';
import { ReportsErrorsQueryDto } from './dto/reports-error-query.dto';
import { ReportsErrorService } from './reports_error.service';
import type { Response } from 'express';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly history: ReportsHistoryService,
    private readonly reportErrors: ReportsErrorService,
  ) {}

  @Get('runs')
  getRuns(@Query() dto: RunsQueryDto) {
    return this.history.listRuns(dto);
  }

  @Get('import-history')
  getHistory(@Query() dto: ImportHistoryQueryDto) {
    return this.history.listAll(dto);
  }

  @Get('import-history/:importId')
  getHistoryOfImportId(
    @Param('importId') importId: string,
    @Query() dto: ImportHistoryQueryDto,
  ) {
    dto.import_id = importId;
    return this.history.listAll(dto);
  }

  @Get('errors')
  getErrorReport(@Query() dto: ReportsErrorsQueryDto) {
    return this.reportErrors.listLatestErrors(dto);
  }

  @Get('errors.xlsx')
  async getLatestErrorsXlsx(
    @Query() dto: ReportsErrorsQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.reportErrors.exportLatestErrorsXlsx(dto);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }
}
