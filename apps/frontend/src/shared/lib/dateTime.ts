/**
 * Formatiert einen UTC-Zeitstempel (z. B. von der Datenbank) in die
 * Zeitzone „Europe/Berlin“.
 *
 * @param timestamp UTC-Zeitstempel als ISO-String oder {@link Date}.
 * @param opts Optionales Formatierungs-Objekt für `Intl.DateTimeFormat`.
 *             Standard: `{ dateStyle: "medium", timeStyle: "short" }`
 * @returns Lokalisiertes deutsches Datum/Zeit-Format oder `"-"` bei leerem Input.
 *
 * @example
 * ```ts
 * UtcDateTimeToBerlin("2025-10-08T12:30:00Z"); // "08.10.2025, 14:30"
 * ```
 */
export function UtcDateTimeToBerlin(
  timestamp?: string | Date,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }
): string {
  const BERLIN_TZ = "Europe/Berlin";
  if (!timestamp) return "-";
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp); // "Z" => UTC
  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: BERLIN_TZ,
      ...opts,
    }).format(d);
  } catch {
    // Fallback (ohne TZ-Anpassung, sollte selten nötig sein)
    return d.toLocaleString("de-DE");
  }
}

/**
 * Wandelt einen lokalen `datetime-local`-Input (z. B. aus Formularen)
 * in einen UTC-ISO-String um.
 *
 * @param input String wie `"2025-10-06T22:37"`.
 * @returns UTC-ISO-Zeitstempel oder `undefined`, wenn das Format ungültig ist.
 *
 * @example
 * ```ts
 * localDateTimeToUtcIso("2025-10-06T22:37");
 * // → "2025-10-06T20:37:00.000Z" (abhängig von Zeitzone)
 * ```
 */
export function localDateTimeToUtcIso(input?: string): string | undefined {
  if (!input) return undefined; // input z.B. "2025-10-06T22:37"
  const [date, time] = input.split("T");
  if (!date || !time) return undefined;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const local = new Date(y, m - 1, d, hh, mm, 0);
  return new Date(
    local.getTime() - local.getTimezoneOffset() * 60000
  ).toISOString();
}
