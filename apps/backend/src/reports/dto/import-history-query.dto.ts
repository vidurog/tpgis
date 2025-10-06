import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export type importSortable =
  | 'id'
  | 'import_id'
  | 'imported_at'
  | 'imported_by'
  | 'kunde'
  | 'strasse'
  | 'plz'
  | 'ort';

export class ImportHistoryQueryDto {
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
  @IsIn([
    'id',
    'import_id',
    'imported_at',
    'imported_by',
    'kunde',
    'strasse',
    'plz',
    'ort',
  ])
  orderBy: importSortable = 'imported_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDir: 'ASC' | 'DESC' = 'DESC';

  // ------ Filter --------
  @IsOptional()
  @IsString()
  import_id?: string; // exakter Match, z.B. Drilldown auf Run

  @IsOptional()
  @IsString()
  imported_by?: string; // exakter Match auf Benutzer

  @IsOptional()
  @IsString()
  kunde?: string; // Teilstring (ILIKE)

  @IsOptional()
  @IsString()
  strasse?: string; // Teilstring (ILIKE)

  @IsOptional()
  @IsString()
  ort?: string; // Teilstring (ILIKE)

  @IsOptional()
  @IsString()
  plz?: string; // exakter Match; als String behandelt (robust bei int/text)

  // Zeitraumfilter auf imported_at
  @IsOptional()
  @IsDateString()
  from?: string; // inklusiv:  >= from

  @IsOptional()
  @IsDateString()
  to?: string; // exklusiv:  <  to
}
