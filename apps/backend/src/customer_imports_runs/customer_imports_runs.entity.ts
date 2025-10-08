// src/customer_imports_runs/customer_imports_runs.entity.ts
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Entity für Import-Läufe der Kundenimporte.
 *
 * @remarks
 * - Persistiert **Meta-Informationen** pro Importlauf (wer, wann, wie viele Zeilen).
 * - Das Feld `merged` zeigt an, ob die Staging-Daten bereits in den Bestand
 *   übernommen wurden (siehe Service `mergeImport`).
 * - Primärschlüssel ist die fachliche `import_id` (als `bigint` in der DB).
 */
@Entity({ name: 'kunden_import_runs' })
export class CustomerImportRuns {
  /**
   * Fachliche Import-ID (z. B. Zeitstempel-basiert).
   * In der Datenbank als `bigint` abgelegt, hier als `string` geführt.
   */
  @PrimaryColumn({ name: 'import_id', type: 'bigint' })
  import_id!: string;

  /** Zeitpunkt des Einlesens/Schreibens ins Staging. */
  @Column({ name: 'imported_at', type: 'timestamptz' })
  imported_at!: Date;

  /** Benutzer/Konto, das den Import ausgeführt hat. */
  @Column({ name: 'imported_by', type: 'text' })
  imported_by!: string;

  /**
   * Flag: Wurden die Staging-Daten dieses Laufs bereits in den Kundenbestand gemerged?
   * Standard: `false`.
   */
  @Column({ name: 'merged', type: 'boolean', default: false })
  merged: boolean;

  /**
   * Anzahl der im Staging **eingefügten** Zeilen (ohne Validierungsfehler).
   * Dient als schnelle Kennzahl für den Lauf.
   */
  @Column({ name: 'inserted_rows', type: 'int' })
  inserted_rows: number;
}
