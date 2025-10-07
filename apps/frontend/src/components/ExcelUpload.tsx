import "./styles/ExcelUpload.css";
import { useState, useRef } from "react";
import Button from "./Button";
import { mergeExcelFile, uploadImportExcel } from "../api/excel.api";

type Props = {
  maxSizeMB?: number;
  onSelect?: (file: File | null) => void;
  onUploaded?: (result: { importId?: string | number }) => void; // neu: Callback nach erfolgreichem Upload
};

export default function ExcelUpload({
  maxSizeMB = 20,
  onSelect,
  onUploaded,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function reset() {
    setFile(null);
    setError(null);
    setUpdateSuccess(null);
    setMergeSuccess(null);
    if (inputRef.current) inputRef.current.value = "";
    onSelect?.(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setUpdateSuccess(null);
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

  async function handleSubmit() {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setUpdateSuccess(null);

    try {
      // Datei Hochladen zu kunden_import
      const updateRes = await uploadImportExcel(file);
      const import_id = updateRes.import_id;
      setUpdateSuccess(
        `Upload erfolgreich${import_id ? ` (Import ID #${import_id})` : ""}.`
      );

      // Datei mergen zu kunden
      const mergeRes = await mergeExcelFile(import_id);
      setMergeSuccess(
        `Merge erfolgreich${
          import_id
            ? ` (Import ID #${import_id}, inserted: ${mergeRes.inserted}, updated: ${mergeRes.updated})` // TODO inserted, updated, deduped
            : ""
        }.`
      );

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
        disabled={loading}
      />

      {file && (
        <div className="xl__file">
          <span className="xl__name" title={file.name}>
            {file.name}
          </span>
          <Button variant="ghost" onClick={reset} disabled={loading}>
            Entfernen
          </Button>
        </div>
      )}

      {error && <div className="xl__error">{error}</div>}
      {updateSuccess && <div className="xl__success">{updateSuccess}</div>}
      {mergeSuccess && <div className="xl__success">{mergeSuccess}</div>}

      <div className="xl__actions">
        <Button onClick={handleSubmit} disabled={!file || loading}>
          {loading ? "Lade hoch..." : "Hochladen"}
        </Button>
      </div>
    </div>
  );
}
