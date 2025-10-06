import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  IsDateString,
  IsString,
  IsBoolean,
} from 'class-validator';

export type runsSortable =
  | 'import_id'
  | 'imported_at'
  | 'imported_by'
  | 'merged'
  | 'inserted_rows';

export class RunsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 50;

  @IsOptional()
  @IsIn(['import_id', 'imported_at', 'imported_by', 'row_count'])
  orderBy: runsSortable = 'imported_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDir: 'ASC' | 'DESC' = 'DESC';

  // Filter
  @IsOptional()
  @IsDateString()
  from?: string; // imported_at >= from

  @IsOptional()
  @IsDateString()
  to?: string; // imported_at <  to

  @IsOptional()
  @IsString()
  imported_by?: string; // exakter Match

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
  })
  @IsBoolean()
  merged?: boolean;
}
