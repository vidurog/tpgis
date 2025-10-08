import "./styles/Button.css";

/**
 * Zusätzliche Button-Varianten für die Darstellung.
 * @remarks
 * Erweitert die nativen {@link React.ButtonHTMLAttributes} um ein `variant`-Feld.
 */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * Visuelle Variante des Buttons.
   * - `"primary"`: Hauptaktion (Default)
   * - `"ghost"`: Unaufdringliche, sekundäre Aktion
   *
   * @defaultValue "primary"
   */
  variant?: "primary" | "ghost";
};

/**
 * Zusätzliche Button-Varianten für die Darstellung.
 * @remarks
 * Erweitert die nativen {@link React.ButtonHTMLAttributes} um ein `variant`-Feld.
 *
 * @example
 * ```tsx
 * <Button onClick={save}>Speichern</Button>
 * <Button variant="ghost" onClick={cancel}>Abbrechen</Button>
 * ```
 */
export default function Button({
  variant = "primary",
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`btn btn--${variant}`} {...props}>
      {children}
    </button>
  );
}
