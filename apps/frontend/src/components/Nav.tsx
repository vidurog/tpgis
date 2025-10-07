import "./styles/Nav.css";

export type Tab = "import" | "errors";

export default function Nav({
  current,
  onChange,
}: {
  current: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <header className="nav">
      <button
        className={`nav__link ${current === "import" ? "is-active" : ""}`}
        onClick={() => onChange("import")}
      >
        Kunden Import
      </button>
      <button
        className={`nav__link ${current === "errors" ? "is-active" : ""}`}
        onClick={() => onChange("errors")}
      >
        Fehlerreport
      </button>
    </header>
  );
}
