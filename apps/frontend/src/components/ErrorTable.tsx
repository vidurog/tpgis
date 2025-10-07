import "./styles/ErrorTable.css";
import type { ErrorRow, ErrorOrderKey } from "../api/errors.api";

type SortDir = "ASC" | "DESC";

export default function ErrorTable({
  rows,
  loading,
  orderBy,
  orderDir,
  onSort,
}: {
  rows: ErrorRow[];
  loading?: boolean;
  orderBy: ErrorOrderKey;
  orderDir: SortDir;
  onSort: (col: ErrorOrderKey, dir: SortDir) => void;
}) {
  function change(col: ErrorOrderKey) {
    const dir: SortDir =
      orderBy === col ? (orderDir === "ASC" ? "DESC" : "ASC") : "ASC";
    onSort(col, dir);
  }

  // Sortierung
  function toggableHeader(label: string, col: ErrorOrderKey) {
    const active = orderBy === col;
    const aria = active
      ? orderDir === "ASC"
        ? "ascending"
        : "descending"
      : "none";
    return (
      <th className="etable__th-sortable">
        <button onClick={() => change(col)} aria-sort={aria}>
          {label}{" "}
          <span className="etable__sort">
            {active ? (orderDir === "ASC" ? "▲" : "▼") : "↕"}
          </span>
        </button>
      </th>
    );
  }

  const hasRows = rows.length > 0;

  return (
    <div className="etable">
      <div className="etable__wrap">
        <table className="etable__table">
          <thead>
            <tr>
              {toggableHeader("Kundennr.", "kundennummer")}
              {toggableHeader("Nachname", "nachname")}
              {toggableHeader("Vorname", "vorname")}
              {toggableHeader("Straße", "strasse")}
              {toggableHeader("PLZ", "plz")}
              {toggableHeader("Ort", "ort")}
              {toggableHeader("Datenfehler", "datenfehler")}
              {toggableHeader("Error-Class", "error_class")}
              {toggableHeader("Fehleranzahl", "error_count")}
            </tr>
          </thead>
          <tbody>
            {loading && !hasRows ? (
              <tr>
                <td className="etable__empty" colSpan={9}>
                  Lade…
                </td>
              </tr>
            ) : hasRows ? (
              rows.map((r, i) => (
                <tr key={`${r.kundennummer ?? "row"}-${i}`}>
                  <td>{r.kundennummer ?? "—"}</td>
                  <td>{r.nachname ?? "—"}</td>
                  <td>{r.vorname ?? "—"}</td>
                  <td>{[r.strasse, r.hnr].filter(Boolean).join(" ") || "—"}</td>
                  <td>{r.plz ?? "—"}</td>
                  <td>{r.ort ?? "—"}</td>
                  <td>{r.datenfehler ? "ja" : "nein"}</td>
                  <td>{r.error_class}</td>
                  <td>{r.error_count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="etable__empty" colSpan={9}>
                  Keine Fehler gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
