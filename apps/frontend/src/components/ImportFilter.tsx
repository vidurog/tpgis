import "./styles/ImportFilter.css";
import { useState } from "react";
import Button from "./Button";
import type { CustomerImportFilter } from "../api/imports.api";
import { localDateTimeToUtcIso } from "../shared/lib/dateTime";

export default function ImportFilter({
  onApply,
  onReset,
  initial,
}: {
  onApply: (filters: CustomerImportFilter) => void;
  onReset?: () => void;
  initial?: CustomerImportFilter;
}) {
  const [import_id, setImportId] = useState<string>(
    initial?.import_id ? String(initial.import_id) : ""
  );
  const [imported_by, setImportedBy] = useState<string>(
    initial?.imported_by ?? ""
  );
  const [kunde, setKunde] = useState<string>(initial?.kunde ?? "");
  const [strasse, setStrasse] = useState<string>(initial?.strasse ?? "");
  const [ort, setOrt] = useState<string>(initial?.ort ?? "");
  const [plz, setPlz] = useState<string>(
    initial?.plz ? String(initial.plz) : ""
  );
  const [fromLocal, setFromLocal] = useState<string>("");
  const [toLocal, setToLocal] = useState<string>("");

  function apply() {
    onApply({
      import_id: import_id || undefined,
      imported_by: imported_by || undefined,
      kunde: kunde || undefined,
      strasse: strasse || undefined,
      ort: ort || undefined,
      plz: plz || undefined,
      from: localDateTimeToUtcIso(fromLocal),
      to: localDateTimeToUtcIso(toLocal),
    });
  }

  function reset() {
    setImportId("");
    setImportedBy("");
    setKunde("");
    setStrasse("");
    setOrt("");
    setPlz("");
    setFromLocal("");
    setToLocal("");
    onReset?.();
    onApply({}); // leere Filter
  }

  return (
    <div className="iflt">
      Filter
      <div className="iflt__row">
        <input
          className="iflt__input"
          placeholder="Import ID"
          value={import_id}
          onChange={(e) => setImportId(e.target.value)}
        />
        <input
          className="iflt__input"
          placeholder="Importiert von"
          value={imported_by}
          onChange={(e) => setImportedBy(e.target.value)}
        />
        <input
          className="iflt__input"
          placeholder="Kunde"
          value={kunde}
          onChange={(e) => setKunde(e.target.value)}
        />
      </div>
      <div className="iflt__row">
        <input
          className="iflt__input"
          placeholder="Straße"
          value={strasse}
          onChange={(e) => setStrasse(e.target.value)}
        />
        <input
          className="iflt__input"
          placeholder="Ort"
          value={ort}
          onChange={(e) => setOrt(e.target.value)}
        />
        <input
          className="iflt__input"
          placeholder="PLZ"
          value={plz}
          onChange={(e) => setPlz(e.target.value)}
        />
      </div>
      <div className="iflt__row">
        <label className="iflt__label">Von</label>
        <input
          type="datetime-local"
          className="iflt__input"
          value={fromLocal}
          onChange={(e) => setFromLocal(e.target.value)}
        />
        <label className="iflt__label">Bis</label>
        <input
          type="datetime-local"
          className="iflt__input"
          value={toLocal}
          onChange={(e) => setToLocal(e.target.value)}
        />
        <div className="iflt__spacer" />
        <Button variant="ghost" onClick={reset}>
          Zurücksetzen
        </Button>
        <Button onClick={apply}>Anwenden</Button>
      </div>
    </div>
  );
}
