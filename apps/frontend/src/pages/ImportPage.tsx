import "./styles/ImportPage.css";
import { useState } from "react";
import Toolbar from "../components/Toolbar";
import ExcelUpload from "../components/ExcelUpload";
import RunsList from "../components/RunsList";
import ImportTable from "../components/ImportTable";
import MergeButton from "../components/MergeButton";

/**
 * Seite „Kunden Import“.
 *
 * - Hochladen & Mergen einer Excel-Datei via {@link ExcelUpload}.
 * - Anzeige der Import-Runs ({@link RunsList}).
 * - Tabelle der importierten Rohdaten ({@link ImportTable}).
 *
 * @remarks
 * Die Merge-Auslösung über {@link MergeButton} ist aktuell auskommentiert –
 * die Seite ist so vorbereitet, dass der Hook nur noch entkommentiert
 * und angebunden werden muss.
 *
 * @example
 * ```tsx
 * // In einem Router:
 * <Route path="/import" element={<ImportPage />} />
 * ```
 */
export default function ImportPage() {
  /** Aktuell ausgewählte Run-ID (für zukünftige Aktionen wie Merge). */
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  /** Trigger zum Reload der Runs-Liste nach Upload/Merge. */
  const [runsReloadKey, setRunsReloadKey] = useState(0);

  return (
    <section className="import">
      <Toolbar title="Kunden Import" />

      <div className="import__grid">
        <ExcelUpload
          onUploaded={(r) => {
            // Nach Upload/Merge Runs neu laden;
            // ggf. zusätzlich ImportTable filtern (z. B. über import_id).
            console.log("Upload fertig:", r);
            setRunsReloadKey((k) => k + 1);
          }}
        />
      </div>

      <div>
        <RunsList
          onSelect={setSelectedRunId}
          reloadKey={runsReloadKey}
          selectedId={selectedRunId ?? undefined}
        />
      </div>

      <div className="import__table">
        {/* Optional: ImportTable auf selectedRunId filtern*/}
        <ImportTable /* später: runId-Filter */ />
      </div>

      {/* 
      <div className="import__merge">
        <MergeButton
          runId={selectedRunId}
          onClick={(id) => console.log("MERGE ausgelöst für Run", id)}
        />
      </div>
      */}
    </section>
  );
}
