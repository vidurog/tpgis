// apps/backend/src/imports/import-validation.service.ts
import { Injectable } from '@nestjs/common';
import { StagingDto, ValidationError } from '../dto/stage-import.dto';
import { trimNull } from 'src/util/customer_import.util';

@Injectable()
export class ImportValidationService {
  /**
   * Prüft ein {@link StagingDto} auf **Pflichtfelder** und Basistypen.
   *
   * @param dto Staging-Datensatz
   * @returns `{ ok: true }` wenn valide, sonst `{ ok: false, errors }`
   *
   * @remarks
   * Aktuell werden die Metafelder (`import_id`, `imported_at`, `imported_by`)
   * sowie `kunde` geprüft. Weitere Regeln können schrittweise ergänzt werden.
   */
  validate(
    dto: StagingDto,
  ): { ok: true } | { ok: false; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // Meta Felder müssen ausgefüllt sein
    if (!dto.import_id) {
      errors.push({
        field: 'import_id',
        message: 'import_id fehlt',
      });
    }
    if (!(dto.imported_at instanceof Date) || isNaN(+dto.imported_at)) {
      errors.push({
        field: 'imported_at',
        message: 'imported_at ist nicht gültig',
      });
    }
    if (!dto.imported_by) {
      errors.push({
        field: 'imported_by',
        message: 'imported_by fehlt',
      });
    }

    if (!dto.kunde) {
      errors.push({
        field: 'kunde',
        message: 'kunde fehlt',
      });
    }

    // TODO weitere Validierungen

    return errors.length ? { ok: false, errors } : { ok: true };
  }

  /**
   * Erzwingt eine defensive **Normalisierung** offensichtlicher Fälle
   * (Trim, Entfernen von Leerzeichen, Null-Handling).
   *
   * @param dto Staging-Datensatz (Rohwerte)
   * @returns Staging-Datensatz mit bereinigten Feldern
   */
  coerce(dto: StagingDto): StagingDto {
    return {
      ...dto,
      kunde: trimNull(dto.kunde),
      strasse: trimNull(dto.strasse),
      plz: dto.plz ? dto.plz.replace(/\s+/g, '') : null,
      ort: trimNull(dto.ort),
      telefon: trimNull(dto.telefon),
      mobil: trimNull(dto.mobil),
      geburtstag: dto.geburtstag ?? null,
      kennung: trimNull(dto.kennung),
      start: dto.start ?? null,
      ende: dto.ende ?? null,
      auftraege: trimNull(dto.auftraege),
      serviceberater: trimNull(dto.serviceberater),
      besuchrhythmus: trimNull(dto.besuchrhythmus),
      qs_besuch_datum: dto.qs_besuch_datum ?? null,
      qs_besuch_art: trimNull(dto.qs_besuch_art),
      qs_besuch_historik: trimNull(dto.qs_besuch_historik),
      qs_besuch_hinweis_1: trimNull(dto.qs_besuch_hinweis_1),
      qs_besuch_hinweis_2: trimNull(dto.qs_besuch_hinweis_2),
    };
  }
}
