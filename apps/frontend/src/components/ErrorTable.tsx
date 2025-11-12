import "./styles/ErrorTable.css";
import type { ErrorRow, ErrorOrderKey } from "../api/errors.api";

/** Sortierrichtung für Tabellenköpfe. */
type SortDir = "ASC" | "DESC";

/**
 * Tabelle für Fehlerdatensätze.
 *
 * @param rows    Zeilen des Reports
 * @param loading Ladezustand; zeigt Skeleton/Leerzeile an
 * @param orderBy Aktive Sortierspalte
 * @param orderDir Aktive Sortierrichtung
 * @param onSort  Callback bei Sortierwechsel
 *
 * @example
 * ```tsx
 * <ErrorTable
 *   rows={data.rows}
 *   loading={isLoading}
 *   orderBy="error_class"
 *   orderDir="DESC"
 *   onSort={(col, dir) => setSort({ col, dir })}
 * />
 * ```
 */
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
  /** Wechselt Sortierung auf die angeklickte Spalte. */
  function change(col: ErrorOrderKey) {
    const dir: SortDir =
      orderBy === col ? (orderDir === "ASC" ? "DESC" : "ASC") : "ASC";
    onSort(col, dir);
  }

  /** Erzeugt einen klickbaren Tabellenkopf mit Sortierindikator. */
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
  const boolToJaNein = (v: boolean | null | undefined | string) =>
    v ? "ja" : "nein";

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
              <th>Kennung</th>
              <th>Rhytmus</th>
              {toggableHeader("§37.3", "sgb_37_3")}
              {toggableHeader("Pflegefirma", "pflegefirma")}
              {toggableHeader("Datenfehler", "datenfehler")}
              {toggableHeader("Fehleranzahl", "error_count")}
              {toggableHeader("Geom-Fehler", "err_no_geocoding")}
              {toggableHeader("Adr. geändert", "err_address_changed")}
              {toggableHeader("Rhythmus fehlt", "err_missing_rhythmus")}
              {toggableHeader("Kennung fehlt", "err_missing_kennung")}
              {toggableHeader(
                "Inkon. Kenn/Rhyt",
                "err_inconsistent_kennung_rhythmus"
              )}
              {toggableHeader("Historik-Fehler", "err_missing_history")}
              {toggableHeader("Kontakt-Fehler", "err_missing_contact")}
              <th>Geburtstag-Fehler</th>
              {toggableHeader("Error-Class", "error_class")}
            </tr>
          </thead>
          <tbody>
            {loading && !hasRows ? (
              <tr>
                <td className="etable__empty" colSpan={20}>
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

                  <td>{r.kennung ?? "—"}</td>
                  <td>{r.besuchrhythmus ?? "—"}</td>
                  <td>{boolToJaNein(r.sgb_37_3)}</td>
                  <td>{boolToJaNein(r.pflegefirma)}</td>
                  <td>{boolToJaNein(r.datenfehler)}</td>
                  <td>{r.error_count}</td>

                  <td>{boolToJaNein(r.geom_fehler)}</td>
                  <td>{boolToJaNein(r.adresse_neu)}</td>
                  <td>{boolToJaNein(r.rhythmus_fehler)}</td>
                  <td>{boolToJaNein(r.kennung_fehler)}</td>
                  <td>{boolToJaNein(r.inkonsistenz)}</td>
                  <td>{boolToJaNein(r.historik_fehler)}</td>
                  <td>{boolToJaNein(r.kontakt_fehler)}</td>
                  <td>{boolToJaNein(r.geburtstag_fehler)}</td>
                  <td>{r.error_class}</td>
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
