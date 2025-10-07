import "./styles/RunsList.css";
import { useEffect, useState } from "react";
import Button from "./Button";
import { listImportRuns, type ImportRun } from "../api/imports.api";

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
  // TODO
  // const [limit, setLimit] = useRef(0);
  // const [offset, setOffset] = useRef(0);
  // const [orderBy, setOrderBy] = useRef<string>("");
  // const [orderDir, setOrderDir] = useRef<string>("");
  // const [total, setTotal] = useRef(0);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listImportRuns();
      // TODO
      // setLimit(data.limit);
      // setOffset(data.offset);
      // setOrderBy(data.orderBy);
      // setOrderDir(data.orderDir);
      // setTotal(data.total);

      setRows(data.rows);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Konnte Runs nicht laden.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [reloadKey]); //
  useEffect(() => {
    setActiveId(selectedId ?? null);
  }, [selectedId]);

  function handleClick(run: ImportRun) {
    const id = String(run.id);
    const next = activeId === id ? null : id;
    setActiveId(next);
    onSelect?.(next);
  }

  return (
    <div className="runs">
      <div className="runs__header">
        <h2 className="runs__title">Runs</h2>
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
                    {run.imported_at} · {run.imported_by} ·{" "}
                    {run.merged ? "merged" : "not merged"}
                  </span>
                </div>
                <div className="runs__row">
                  <span className="runs__rows">{run.inserted_rows} Zeilen</span>
                  <span className="runs__hint">
                    {activeId === id ? "ausgewählt" : "klicken zum Auswählen"}
                  </span>
                </div>
              </li>
            );
          })}

          {!loading && !error && rows.length === 0 && (
            <li className="runs__empty">Noch keine Runs vorhanden.</li>
          )}
        </ul>
      )}
    </div>
  );
}
