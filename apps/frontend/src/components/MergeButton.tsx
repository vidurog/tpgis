import "./styles/MergeButton.css";
import Button from "./Button";

export default function MergeButton({
  runId,
  onClick,
}: {
  runId: string | null;
  onClick?: (runId: string) => void;
}) {
  const disabled = !runId;

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
