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
  Pflegegrad123 = '6 Monate', // Monate

  Pflegegrad45 = '3 Monate', // Monate

  KeinPflegegrad = '0',
}
