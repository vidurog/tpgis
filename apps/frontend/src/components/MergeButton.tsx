import "./styles/MergeButton.css";
import Button from "./Button";

/**
 * Aktionbutton zum Auslösen eines Merges für einen ausgewählten Import-Run.
 *
 * @param runId  Aktuell ausgewählte Run-ID; ohne ID ist der Button deaktiviert
 * @param onClick Callback, erhält die `runId` bei Klick
 *
 * @example
 * ```tsx
 * <MergeButton runId={selected} onClick={(id) => doMerge(id)} />
 * ```
 */
export default function MergeButton({
  runId,
  onClick,
}: {
  runId: string | null;
  onClick?: (runId: string) => void;
}) {
  const disabled = !runId;

  /** Klickhandler: meldet die aktuelle `runId` an {@link onClick}. */
  function handleClick() {
    if (!runId) return;
    // Noch kein Backend-Call – nur Demo:
    console.log("MERGE für Run:", runId);
    onClick?.(runId);
  }

  return (
    <div className="merge">
      <div className="merge__info">
        {runId ? (
          <span>
            Ausgewählter Run: <strong>#{runId}</strong>
          </span>
        ) : (
          <span>Kein Run ausgewählt</span>
        )}
      </div>
      <Button onClick={handleClick} disabled={disabled}>
        Merge für diesen Import ausführen
      </Button>
    </div>
  );
}
