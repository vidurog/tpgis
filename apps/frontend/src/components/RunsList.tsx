import "./styles/RunsList.css";
import { useEffect, useState } from "react";
import Button from "./Button";
import { listImportRuns, type ImportRun } from "../api/imports.api";

/**
 * Liste der Import-Runs (Metadaten).
 *
 * @param onSelect   Optional: meldet ausgewählte `runId` (derzeit auskommentiert)
 * @param reloadKey  Ändert sich der Key, wird neu geladen
 * @param selectedId Vorbelegung der Selektion
 */
export default function RunsList({
  onSelect,
  reloadKey = 0, // ändert sich => neu laden
  selectedId, // optional: von außen gesetzte Auswahl
}: {
  onSelect?: (runId: string | null) => void;
  reloadKey?: number;
  selectedId?: string | null;
}) {
  const [activeId, setActiveId] = useState<string | null>(selectedId ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // API Values
  const [rows, setRows] = useState<ImportRun[]>([]);

  /** Lädt Runs von der API. */
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listImportRuns();

      setRows(data.rows);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Konnte Runs nicht laden.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  // Reload bei Key Änderung (z. B. nach Upload/Merge))
  useEffect(() => {
    load();
  }, [reloadKey]);
  // Sync selectedId von außen
  useEffect(() => {
    setActiveId(selectedId ?? null);
  }, [selectedId]);

  /**
   * Item-Klick: toggelt Auswahl (derzeit nur lokale Markierung).
   * @remarks
   * Das Setzen/Auslösen über `onSelect` ist bewusst auskommentiert.
   */
  function handleClick(run: ImportRun) {
    const id = String(run.id);
    const next = activeId === id ? null : id;
    //setActiveId(next); TODO
    //onSelect?.(next);
  }

  return (
    <div className="runs">
      <div className="runs__header">
        <h2 className="runs__title">Import Metadaten</h2>
        <div className="runs__actions">
          <Button variant="ghost" onClick={load} disabled={loading}>
            {loading ? "Lade..." : "Neu laden"}
          </Button>
        </div>
      </div>
      {error && <div className="runs__error">{error}</div>}
      {loading && !rows.length ? (
        <ul className="runs__list">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="runs__item runs__item--skeleton">
              <div className="runs__row">
                <span className="skl" />
              </div>
              <div className="runs__row">
                <span className="skl" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="runs__list">
          {rows.map((run) => {
            const id = String(run.id);
            return (
              <li
                key={id}
                className={`runs__item ${activeId === id ? "is-active" : ""}`}
                onClick={() => handleClick(run)}
              >
                <div className="runs__row">
                  <span className="runs__id">#{id}</span>
                  <span className="runs__meta">
                    {run.imported_at} · {run.imported_by} · {run.inserted_rows}{" "}
                    Zeilen · {run.merged ? "merged" : "not merged"}
                  </span>
                </div>
              </li>
            );
          })}

          {!loading && !error && rows.length === 0 && (
            <li className="runs__empty">Noch keine Importe vorhanden.</li>
          )}
        </ul>
      )}
    </div>
  );
}
