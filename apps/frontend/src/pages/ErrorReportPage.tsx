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

export default function ErrorReportPage() {
  const [filters, setFilters] = useState<ErrorsFilters>({});
  const [rows, setRows] = useState<ErrorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [orderBy, setOrderBy] = useState<ErrorOrderKey>("error_class");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("DESC");

  const [reloadKey, setReloadKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    load(); /* initial */
  }, []);
  useEffect(() => {
    load(); /* on deps */
  }, [limit, offset, orderBy, orderDir, filters, reloadKey]);

  const canPrev = offset > 0;
  const canNext = rows.length === limit; // simpel: nächste Seite probieren

  function onSort(col: ErrorOrderKey, dir: "ASC" | "DESC") {
    setOrderBy(col);
    setOrderDir(dir);
    setOffset(0);
  }

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
