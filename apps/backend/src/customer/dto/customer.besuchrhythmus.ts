/**
 * Beschreibt den **Besuchs­rhythmus** abhängig vom Pflegegrad.
 *
 * - **Schlüssel**: interner, typsicherer Enum-Name (Pflegegrad1/2/3)
 * - **Wert**: menschenlesbarer Turnus (z. B. `"1 Monat"`)
 *
 * @remarks
 * Verwende diesen Enum z. B. zur Planung, Validierung und Berichterstellung.
 * Die konkreten String-Werte werden so in der API/Datenbank ausgegeben bzw. gespeichert.
 *
 * @example
 * ```ts
 * const r = CUSTOMER_BESUCHRHYTHMUS.Pflegegrad2;
 * // r === "3 Monate"
 * if (r === CUSTOMER_BESUCHRHYTHMUS.Pflegegrad2) {
 *   // Logik für vierteljährliche Besuche …
 * }
 * ```
 */
export enum CUSTOMER_BESUCHRHYTHMUS {
  /** Pflegegrad 1 → Besuchs­rhythmus **alle 1 Monat**. */
  Pflegegrad1 = '1 Monat',

  /** Pflegegrad 2 → Besuchs­rhythmus **alle 3 Monate**. */
  Pflegegrad2 = '3 Monate',

  /** Pflegegrad 3 → Besuchs­rhythmus **alle 6 Monate**. */
  Pflegegrad3 = '6 Monate',
}
