import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export type errorSortable =
  | 'kundennummer'
  | 'nachname'
  | 'vorname'
  | 'strasse'
  | 'plz'
  | 'ort'
  | 'datenfehler'
  | 'err_missing_rhythmus'
  | 'err_missing_kennung'
  | 'err_inconsistent_kennung_rhythmus'
  | 'err_missing_history'
  | 'err_missing_contact'
  | 'err_no_geocoding'
  | 'err_address_changed'
  | 'geocodable'
  | 'error_class'
  | 'error_count';

const parseBool = (v: any) => {
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
};

/** Typ für Error Statistik */
export class ReportsErrorsStatsDto {
  total_filtered!: number;
  datenfehler_count!: number;
  by_error_class!: {
    NO_ADDRESS_ISSUE: number;
    ADDRESS_GEOCODABLE: number;
    ADDRESS_NOT_GEOCODABLE: number;
  };
}

/** Typ für die Antwort vom Backend */
export class ReportsErrorsListDto {
  total!: number;
  limit!: number;
  offset!: number;
  orderBy!: errorSortable;
  orderDir!: 'ASC' | 'DESC';
  rows!: any[]; // TODO typisierung
  stats!: ReportsErrorsStatsDto;
}

export class ReportsErrorsQueryDto {
  // Pagination
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

  // Sortierung
  @IsOptional()
  @IsIn([
    'kundennummer',
    'nachname',
    'vorname',
    'strasse',
    'plz',
    'ort',
    'datenfehler',
    'err_missing_rhythmus',
    'err_missing_kennung',
    'err_inconsistent_kennung_rhythmus',
    'err_missing_history',
    'err_missing_contact',
    'err_no_geocoding',
    'err_address_changed',
    'geocodable',
    'error_class',
    'error_count',
  ])
  orderBy: errorSortable = 'error_class';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDir: 'ASC' | 'DESC' = 'DESC';

  // Filter
  @IsOptional()
  @IsString()
  plz?: string;

  @IsOptional()
  @IsString()
  ort?: string; // ILIKE '%ort%'

  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  datenfehler?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  geocodable?: boolean;

  // Flags aus dem Validator
  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  err_missing_rhythmus?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  err_missing_kennung?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  err_inconsistent_kennung_rhythmus?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  err_missing_history?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  err_missing_contact?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  err_no_geocoding?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  err_address_changed?: boolean;

  // Klassen-Filter (abgeleitet)
  @IsOptional()
  @IsIn(['ADDRESS_GEOCODABLE', 'ADDRESS_NOT_GEOCODABLE', 'NO_ADDRESS_ISSUE'])
  error_class?:
    | 'ADDRESS_GEOCODABLE'
    | 'ADDRESS_NOT_GEOCODABLE'
    | 'NO_ADDRESS_ISSUE';

  @IsOptional()
  @IsString()
  kundennummer?: string; // exakte oder partielle Suche

  @IsOptional()
  @IsString()
  kundenname?: string;
}
