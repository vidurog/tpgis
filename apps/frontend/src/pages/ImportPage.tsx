import "./styles/ImportPage.css";
import { useState } from "react";
import Toolbar from "../components/Toolbar";
import ExcelUpload from "../components/ExcelUpload";
import RunsList from "../components/RunsList";
import ImportTable from "../components/ImportTable";
import MergeButton from "../components/MergeButton";

export default function ImportPage() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runsReloadKey, setRunsReloadKey] = useState(0);

  return (
    <section className="import">
      <Toolbar title="Kunden Import" />

      <div className="import__grid">
        <ExcelUpload
          onUploaded={(r) => {
            console.log("Upload fertig:", r);
            setRunsReloadKey((k) => k + 1); // Runs neu laden
          }}
        />

        <RunsList
          onSelect={setSelectedRunId}
          reloadKey={runsReloadKey}
          selectedId={selectedRunId ?? undefined}
        />
      </div>

      <div className="import__table">
        <ImportTable /* später: runId-Filter */ />
      </div>

      <div className="import__merge">
        <MergeButton
          runId={selectedRunId}
          onClick={(id) => console.log("MERGE ausgelöst für Run", id)}
        />
      </div>
    </section>
  );
}
