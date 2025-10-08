import "./styles/ImportTable.css";
import { useEffect, useState } from "react";
import Button from "./Button";
import {
  listCustomerImports,
  type CustomerImport,
  type CustomerImportDTO,
  type CustomerImportFilter,
} from "../api/imports.api";
import ImportFilter from "./ImportFilter";

/** Spalten, nach denen die Tabelle sortiert werden kann. */
type OrderKey =
  | "imported_at"
  | "import_id"
  | "imported_by"
  | "kunde"
  | "strasse"
  | "plz"
  | "ort";

/**
 * Kleiner Sortindikator für den Tabellenkopf.
 * @internal
 */
function SortIndicator({
  active,
  dir,
}: {
  active: boolean;
  dir: "ASC" | "DESC";
}) {
  return (
    <span className="impt__sort-indicator">
      {active ? (dir === "ASC" ? "▲" : "▼") : "↕"}
    </span>
  );
}

/**
 * Paginierte und sortierbare Tabelle für `kunden_import`.
 *
 * @param import_id Optionaler externer Filter (zeigt nur betreffende Importe)
 *
 * @example
 * ```tsx
 * <ImportTable />
 * <ImportTable import_id="42" />
 * ```
 */
export default function ImportTable({
  import_id, // optional: Filter; default = alle
}: {
  import_id?: string | null;
}) {
  const [dto, setDto] = useState<CustomerImportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [orderBy, setOrderBy] = useState<OrderKey>("imported_at");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("DESC");

  const [filters, setFilters] = useState<CustomerImportFilter>({});

  const [showFilters, setShowFilters] = useState(false);

  /** Wechselt Sortierkriterium/-richtung. */
  function changeSort(key: OrderKey) {
    setOffset(0); // auf Seite 1
    if (orderBy === key) {
      setOrderDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setOrderBy(key);
      setOrderDir("ASC"); // Start-Richtung bei neuem Key
    }
  }

  /** Lädt die aktuelle Seite anhand von State (limit/offset/order/filters). */
  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data: CustomerImportDTO = await listCustomerImports({
        limit,
        offset,
        orderBy,
        orderDir,
        filters,
      });

      setDto(data);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.message ??
        "Konnte kunden_import nicht laden.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  /*
  useEffect(() => {
    // Wenn Filter sich ändert, zurück auf Seite 1 (offset=0)
    setOffset(0);
  }, [filters]);
*/

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset, orderBy, orderDir, import_id, reloadKey]);

  const rows: CustomerImport[] = dto?.rows ?? [];
  const total = dto?.total ?? 0;

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="impt">
      <div className="impt__header">
        <h2 className="impt__title">Stammdaten Import Historie</h2>
        <div className="impt__actions">
          <span className="impt__info">
            {loading ? "Lade…" : `${rows.length} / ${total} Einträge`}
          </span>
          <Button variant="ghost" onClick={() => setShowFilters((v) => !v)}>
            {showFilters ? "Filter ausblenden" : "Filter einblenden"}
          </Button>
          <Button variant="ghost" onClick={load} disabled={loading}>
            Neu laden
          </Button>
        </div>
      </div>

      {showFilters && (
        <ImportFilter
          initial={filters}
          onApply={(f) => {
            setFilters(f);
            setReloadKey((k) => k + 1);
          }}
          onReset={() => {
            setFilters({});
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {error && <div className="impt__error">{error}</div>}

      <div className="impt__tablewrap">
        <table className="impt__table">
          <thead>
            <tr>
              {/*<th>ID</th>*/}
              {FilterableHeader("Import ID", "import_id")}
              {FilterableHeader("Importiert am", "imported_at")}
              {FilterableHeader("Importiert von", "imported_by")}
              {FilterableHeader("Kunde", "kunde")}
              {FilterableHeader("Straße", "strasse")}
              {FilterableHeader("PLZ", "plz")}
              {FilterableHeader("Ort", "ort")}
              <th>Telefon</th>
              <th>Mobil</th>
              <th>Geburtstag</th>
              <th>Kennung</th>
              <th>Start</th>
              <th>Ende</th>
              <th>Auftäge</th>
              <th>Serviceberater</th>
              <th>Besuch Datum</th>
              <th>Besuch Art</th>
              <th>Besuch Historik</th>
              <th>Besuch Hinweis 1</th>
              <th>Besuch Hinweis 2</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="impt__empty">
                  Lade Daten…
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((r) => (
                <tr key={`${r.id}`}>
                  {/*<td>{r.id}</td>*/}
                  <td>#{r.import_id}</td>
                  <td>{r.imported_at}</td>
                  <td>{r.imported_by}</td>
                  <td>{r.kunde ?? "—"}</td>
                  <td>{r.strasse ?? "—"}</td>
                  <td>{r.plz ?? "—"}</td>
                  <td>{r.ort ?? "—"}</td>
                  <td>{r.telefon ?? "—"}</td>
                  <td>{r.mobil ?? "—"}</td>
                  <td>{r.geburtstag ?? "—"}</td>
                  <td>{r.kennung ?? "—"}</td>
                  <td>{r.start ?? "—"}</td>
                  <td>{r.ende ?? "—"}</td>
                  <td>{r.auftraege ?? "—"}</td>
                  <td>{r.serviceberater ?? "—"}</td>
                  <td>{r.qs_besuch_datum ?? "—"}</td>
                  <td>{r.qs_besuch_art ?? "—"}</td>
                  <td>{r.qs_besuch_historik ?? "—"}</td>
                  <td>{r.qs_besuch_hinweis_1 ?? "—"}</td>
                  <td>{r.qs_besuch_hinweis_2 ?? "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="impt__empty" colSpan={9}>
                  Keine Daten vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="impt__pager">
        <Button
          variant="ghost"
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={!canPrev || loading}
        >
          ◀︎ Zurück
        </Button>
        <span className="impt__pageinfo">
          Seite {Math.floor(offset / limit) + 1} /{" "}
          {Math.max(1, Math.ceil(total / limit))}
        </span>
        <Button
          variant="ghost"
          onClick={() => setOffset(offset + limit)}
          disabled={!canNext || loading}
        >
          Weiter ▶︎
        </Button>

        <select
          className="impt__limit"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          disabled={loading}
        >
          <option value={25}>25 / Seite</option>
          <option value={50}>50 / Seite</option>
          <option value={100}>100 / Seite</option>
        </select>
      </div>
    </div>
  );

  /**
   * Erzeugt einen sortierbaren Tabellenkopf.
   * @internal
   */
  function FilterableHeader(label: string, value: OrderKey) {
    const aria =
      orderBy === value
        ? orderDir === "ASC"
          ? "ascending"
          : "descending"
        : "none";
    return (
      <th className="impt__th-sortable">
        <button onClick={() => changeSort(value)} aria-sort={aria}>
          {label} <SortIndicator active={orderBy === value} dir={orderDir} />
        </button>
      </th>
    );
  }
}
