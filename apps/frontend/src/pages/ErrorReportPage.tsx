import "./styles/ErrorReportPage.css";
import Toolbar from "../components/Toolbar";
import Button from "../components/Button";
import ErrorFilters from "../components/ErrorFilters";
import ErrorTable from "../components/ErrorTable";
import { useEffect, useState } from "react";
import {
  listErrors,
  errorsExportUrl,
  type ErrorsFilters,
  type ErrorRow,
  type ErrorOrderKey,
} from "../api/errors.api";

/**
 * Seite „Fehlerreport“.
 *
 * - Zeigt eine filter-/sortierbare Tabelle mit Fehlerdatensätzen.
 * - Bietet Export als Excel (XLSX).
 * - Clientseitige Pagination via `limit`/`offset`.
 *
 * @remarks
 * Diese Seite koordiniert lediglich UI-State und API-Calls
 * (via {@link listErrors} / {@link errorsExportUrl}). Die Darstellung liegt in
 * {@link ErrorFilters} und {@link ErrorTable}.
 *
 * @example
 * ```tsx
 * // In einem Router:
 * <Route path="/reports/errors" element={<ErrorReportPage />} />
 * ```
 */
export default function ErrorReportPage() {
  /** Aktive Filter (PLZ, Ort, Flags, etc.). */
  const [filters, setFilters] = useState<ErrorsFilters>({});
  /** Zeilen des aktuellen Resultsets. */
  const [rows, setRows] = useState<ErrorRow[]>([]);
  /** Lade-/Fehlerzustand. */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Pagination + Sortierung. */
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [orderBy, setOrderBy] = useState<ErrorOrderKey>("error_class");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("DESC");

  /** Key zum manuell getriggerten Reload. */
  const [reloadKey, setReloadKey] = useState(0);
  /** Sichtbarkeit der Filterleiste. */
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Lädt die aktuelle Seite basierend auf State (Filter, Sortierung, Pagination).
   * @internal
   */
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const dto = await listErrors({
        limit,
        offset,
        orderBy,
        orderDir,
        filters,
      });
      setRows(dto.rows);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          e?.message ??
          "Konnte Fehlerreport nicht laden."
      );
    } finally {
      setLoading(false);
    }
  }

  // Initialer Load
  useEffect(() => {
    load(); /* initial */
  }, []);
  // Reload bei Abhängigkeiten
  useEffect(() => {
    load(); /* on deps */
  }, [limit, offset, orderBy, orderDir, filters, reloadKey]);

  /** Pager: Zurück möglich? */
  const canPrev = offset > 0;
  /** Pager: Weiter möglich? (Heuristik über Seitengröße) */
  const canNext = rows.length === limit;

  /**
   * Sortierwechsel-Handler aus der Tabelle.
   * @param col Spalte
   * @param dir Richtung
   */
  function onSort(col: ErrorOrderKey, dir: "ASC" | "DESC") {
    setOrderBy(col);
    setOrderDir(dir);
    setOffset(0);
  }

  /**
   * Öffnet die XLSX-Export-URL in einem neuen Tab.
   * @remarks Verwendet die aktuellen Filter/Sortierparameter.
   */
  function exportXlsx() {
    const url = errorsExportUrl({ filters, orderBy, orderDir });
    window.open(url, "_blank");
  }

  return (
    <section className="errors">
      <Toolbar
        title="Fehlerreport"
        right={
          <>
            <Button variant="ghost" onClick={() => setShowFilters((v) => !v)}>
              {showFilters ? "Filter ausblenden" : "Filter einblenden"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading}
            >
              Neu laden
            </Button>
            <Button variant="ghost" onClick={exportXlsx}>
              Excel Download
            </Button>
          </>
        }
      />

      {showFilters && (
        <ErrorFilters
          initial={filters}
          onApply={(f: any) => {
            setFilters(f);
            setOffset(0);
            setReloadKey((k) => k + 1);
          }}
          onReset={() => {
            setFilters({});
            setOffset(0);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {error && <div className="etable__error">{error}</div>}

      <ErrorTable
        rows={rows}
        loading={loading}
        orderBy={orderBy}
        orderDir={orderDir}
        onSort={onSort}
      />

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
          marginTop: 10,
        }}
      >
        <Button
          variant="ghost"
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={!canPrev || loading}
        >
          ◀︎ Zurück
        </Button>
        <span style={{ color: "#475569", fontSize: 12 }}>
          Seite {Math.floor(offset / limit) + 1}
        </span>
        <Button
          variant="ghost"
          onClick={() => setOffset(offset + limit)}
          disabled={!canNext || loading}
        >
          Weiter ▶︎
        </Button>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setOffset(0);
          }}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: "6px",
          }}
          disabled={loading}
        >
          <option value={25}>25 / Seite</option>
          <option value={50}>50 / Seite</option>
          <option value={100}>100 / Seite</option>
        </select>
      </div>
    </section>
  );
}
