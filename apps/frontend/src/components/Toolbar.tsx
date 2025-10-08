import "./styles/Toolbar.css";

/**
 * Einfache Toolbar mit linkem Titel und optionalem rechten Inhalt.
 *
 * @param title Überschrift in der Toolbar
 * @param right  Optionaler rechter Bereich (Buttons, Filter, etc.)
 *
 * @example
 * ```tsx
 * <Toolbar
 *   title="Fehlerreport"
 *   right={<Button onClick={reload}>Neu laden</Button>}
 * />
 * ```
 */
export default function Toolbar({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="toolbar">
      <h1 className="toolbar__title">{title}</h1>
      <div className="toolbar__right">{right}</div>
    </div>
  );
}
