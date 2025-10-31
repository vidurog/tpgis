import "./styles/ExcelUpload.css";
import { useState, useRef } from "react";
import Button from "./Button";
import { uploadImportExcel } from "../api/excel.api";
import { mergeExcelFile } from "../api/imports.api";

/**
 * Eigenschaften für den Excel-Uploader.
 */
type Props = {
  /** Maximale Dateigröße in MB. @defaultValue 20 */
  maxSizeMB?: number;
  /** Callback bei Dateiauswahl (oder `null` bei Entfernen). */
  onSelect?: (file: File | null) => void;
  /**
   * Callback nach erfolgreichem Upload+Merge.
   * Liefert u. a. die `importId` des erzeugten Imports.
   */
  onUploaded?: (result: { importId?: string | number }) => void;
};

/**
 * UI-Komponente zum Hochladen und anschließenden Mergen einer Excel-Datei.
 *
 * - Validiert Dateiendung und Größe.
 * - Ruft `uploadImportExcel` (Upload) und `mergeExcelFile` (Merge) auf.
 * - Zeigt Erfolg-/Fehlerzustände an.
 *
 * @example
 * ```tsx
 * <ExcelUpload onUploaded={({ importId }) => reload(importId)} />
 * ```
 */
export default function ExcelUpload({
  maxSizeMB = 20,
  onSelect,
  onUploaded,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<string[] | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /** Entfernt die aktuelle Datei und setzt Meldungen zurück. */
  function reset() {
    setFile(null);
    setError(null);
    setUpdateSuccess(null);
    setMergeSuccess(null);
    setDuplicates(null);
    if (inputRef.current) inputRef.current.value = "";
    onSelect?.(null);
  }

  /** Validiert die gewählte Datei (Typ/Größe) und setzt State. */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setUpdateSuccess(null);
    setMergeSuccess(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      onSelect?.(null);
      return;
    }
    const isExcel =
      f.name.toLowerCase().endsWith(".xlsx") ||
      f.name.toLowerCase().endsWith(".xls");
    if (!isExcel) {
      setError("Nur Excel-Dateien (.xlsx, .xls) sind erlaubt.");
      setFile(null);
      onSelect?.(null);
      return;
    }
    const tooBig = f.size > maxSizeMB * 1024 * 1024;
    if (tooBig) {
      setError(`Datei ist größer als ${maxSizeMB} MB.`);
      setFile(null);
      onSelect?.(null);
      return;
    }
    setFile(f);
    onSelect?.(f);
  }

  /**
   * Führt Upload und Merge aus.
   *
   * @remarks
   * - Zeigt entsprechende Statusmeldungen an.
   * - Ruft {@link onUploaded} nach Erfolg auf.
   */
  async function handleSubmit() {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setUpdateSuccess(null);
    setMergeSuccess(null);
    setDuplicates(null);

    try {
      // Datei Hochladen zu kunden_import
      const updateRes = await uploadImportExcel(file);

      const import_id = updateRes.import_id;
      setUpdateSuccess(
        `Upload erfolgreich${import_id ? ` (Import ID #${import_id})` : ""}.`
      );
      setLoading(false);

      // Datei mergen zu kunden
      setMerging(true);
      const mergeRes = await mergeExcelFile(import_id);
      const duplicates = mergeRes.duplicates;
      const noUpsert =
        mergeRes.inserted === 0 &&
        mergeRes.updated === 0 &&
        mergeRes.deleted === 0;

      duplicates ? setDuplicates(duplicates) : setDuplicates(null);

      noUpsert
        ? setMergeSuccess("Merge erfolgreich. Keine neuen Daten.")
        : setMergeSuccess(
            `Merge erfolgreich. (inserted: ${mergeRes.inserted}, updated: ${mergeRes.updated}, deleted: ${mergeRes.deleted})`
          );

      setMerging(false);

      // FE neu rendern
      onUploaded?.({ importId: import_id });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.message ??
        "Upload/Merge fehlgeschlagen.";
      setError(String(msg));
    } finally {
      setLoading(false);
      setMerging(false);
    }
  }

  return (
    <div className="xl">
      <label htmlFor="excel" className="xl__label">
        Excel Datei hochladen
      </label>
      <input
        id="excel"
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleChange}
        className="xl__input"
        disabled={loading || merging}
      />

      {file && (
        <div className="xl__file">
          <span className="xl__name" title={file.name}>
            {file.name}
          </span>
          <Button variant="ghost" onClick={reset} disabled={loading || merging}>
            Entfernen
          </Button>
        </div>
      )}

      {error && <div className="xl__error">{error}</div>}
      {updateSuccess && <div className="xl__success">{updateSuccess}</div>}
      {mergeSuccess && <div className="xl__success">{mergeSuccess}</div>}
      {/* Warnbox für Duplikate */}
      {duplicates && duplicates.length > 0 && (
        <div className="xl__warn">
          <div className="xl__warn-title">
            <span role="img" aria-label="warning">
              ❗
            </span>{" "}
            Duplikate gefunden. Nur erster Eintrag wurde berücksichtigt!
          </div>
          <div className="xl__warn-list">
            [{duplicates.slice(0, 10).join(" ")}
            {duplicates.length > 10
              ? ` … (+${duplicates.length - 10} weitere)`
              : ""}
            ]
          </div>
        </div>
      )}
      {/* Ladeanzeige oder Hochladen Button */}
      {loading || merging ? (
        <div
          className="xl__loading"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="xl__spinner" aria-hidden="true"></span>
          <span className="xl__loadingText">
            {loading ? "Lade hoch..." : "Merge Daten..."}
          </span>
        </div>
      ) : (
        <div className="xl__actions">
          <Button onClick={handleSubmit} disabled={!file || loading || merging}>
            Hochladen
          </Button>
        </div>
      )}
    </div>
  );
}
