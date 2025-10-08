import "./styles/ErrorFilters.css";
import Button from "./Button";
import { useState } from "react";
import type { ErrorsFilters, ErrorClass } from "../api/errors.api";

/**
 * Filterleiste für den Fehlerreport.
 *
 * @param initial  Startwerte der Filter (optional)
 * @param onApply  Callback bei „Anwenden“ mit dem aktuellen {@link ErrorsFilters}
 * @param onReset  Optionaler Callback bei „Zurücksetzen“
 *
 * @example
 * ```tsx
 * <ErrorFilters
 *   initial={{ geocodable: false }}
 *   onApply={(f) => setFilters(f)}
 *   onReset={() => setFilters({})}
 * />
 * ```
 */
export default function ErrorFilters({
  initial,
  onApply,
  onReset,
}: {
  /** Vorbelegung der Filterwerte. */
  initial?: ErrorsFilters;
  /** Übergibt die aktuellen Filter nach Klick auf „Anwenden“. */
  onApply: (f: ErrorsFilters) => void;
  /** Optional: Wird zusätzlich beim Zurücksetzen aufgerufen. */
  onReset?: () => void;
}) {
  const [plz, setPlz] = useState(String(initial?.plz ?? ""));
  const [ort, setOrt] = useState(initial?.ort ?? "");
  const [datenfehler, setDatenfehler] = useState<boolean | undefined>(
    initial?.datenfehler
  );
  const [geocodable, setGeocodable] = useState<boolean | undefined>(
    initial?.geocodable
  );
  const [errorClass, setErrorClass] = useState<ErrorClass | "">(
    (initial?.error_class ?? "") as any
  );
  const [kundennummer, setKundennummer] = useState(initial?.kundennummer ?? "");
  const [kundenname, setKundenname] = useState(initial?.kundenname ?? "");

  /** Wendet die aktuellen Eingaben als {@link ErrorsFilters} an. */
  function apply() {
    onApply({
      plz: plz.trim() ? plz.trim() : undefined,
      ort: ort.trim() ? ort.trim() : undefined,
      datenfehler,
      geocodable,
      error_class: (errorClass || undefined) as ErrorClass | undefined,
      kundennummer: kundennummer.trim() || undefined,
      kundenname: kundenname.trim() || undefined,
    });
  }

  /** Setzt alle Eingaben zurück und meldet leere Filter an {@link onApply}. */
  function reset() {
    setPlz("");
    setOrt("");
    setDatenfehler(undefined);
    setGeocodable(undefined);
    setErrorClass("");
    setKundennummer("");
    setKundenname("");
    onReset?.();
    onApply({});
  }

  return (
    <div className="efilters">
      <div className="efilters__row">
        <input
          className="efilters__input"
          placeholder="Kundennummer"
          value={kundennummer}
          onChange={(e) => setKundennummer(e.target.value)}
        />

        <input
          className="efilters__input"
          placeholder="Kundenname"
          value={kundenname}
          onChange={(e) => setKundenname(e.target.value)}
        />

        <input
          className="efilters__input"
          placeholder="PLZ"
          value={plz}
          onChange={(e) => setPlz(e.target.value)}
        />

        <input
          className="efilters__input"
          placeholder="Ort"
          value={ort}
          onChange={(e) => setOrt(e.target.value)}
        />

        <select
          className="efilters__select"
          value={
            datenfehler === undefined ? "" : datenfehler ? "true" : "false"
          }
          onChange={(e) =>
            setDatenfehler(
              e.target.value === "" ? undefined : e.target.value === "true"
            )
          }
        >
          <option value="">Datenfehler: egal</option>
          <option value="true">Datenfehler: ja</option>
          <option value="false">Datenfehler: nein</option>
        </select>

        <select
          className="efilters__select"
          value={geocodable === undefined ? "" : geocodable ? "true" : "false"}
          onChange={(e) =>
            setGeocodable(
              e.target.value === "" ? undefined : e.target.value === "true"
            )
          }
        >
          <option value="">Geocodierbar: egal</option>
          <option value="true">Geocodierbar: ja</option>
          <option value="false">Geocodierbar: nein</option>
        </select>

        <select
          className="efilters__select"
          value={errorClass}
          onChange={(e) => setErrorClass(e.target.value as ErrorClass | "")}
        >
          <option value="">Error Class: alle</option>
          <option value="NO_ADDRESS_ISSUE">NO_ADDRESS_ISSUE</option>
          <option value="ADDRESS_GEOCODABLE">ADDRESS_GEOCODABLE</option>
          <option value="ADDRESS_NOT_GEOCODABLE">ADDRESS_NOT_GEOCODABLE</option>
        </select>

        <div style={{ flex: 1 }} />
        <Button variant="ghost" onClick={reset}>
          Zurücksetzen
        </Button>
        <Button onClick={apply}>Anwenden</Button>
      </div>
    </div>
  );
}
