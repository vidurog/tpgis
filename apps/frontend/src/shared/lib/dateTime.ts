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
