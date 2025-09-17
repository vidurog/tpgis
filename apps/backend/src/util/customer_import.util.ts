export function normalizeCellValue(v: any): any {
  if (v == null) return null;
  if (typeof v === 'object') {
    if ('result' in v) return normalizeCellValue(v.result); // Formel → Ergebnis
    if ('text' in v) return String((v as any).text);
    if ('richText' in v)
      return (v as any).richText.map((r: any) => r.text).join('');
  }
  if (v instanceof Date) return v;
  if (typeof v === 'number') return v;
  return String(v).trim();
}

export function normCell(v: any): any {
  if (v == null) return null;
  if (typeof v === 'object') {
    if ('result' in v) return normCell(v.result); // Formel → Ergebnis
    if ('text' in v) return String(v.text);
    if ('richText' in v) return v.richText.map((r: any) => r.text).join('');
  }
  return v instanceof Date ? v : typeof v === 'number' ? v : String(v).trim();
}

export function normalizeKey(k: any): string {
  const s = String(k ?? '')
    .trim()
    .toLowerCase();
  return s
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[\(\)\[\],.;:/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const toStr = (v: any) => String(v ?? '').trim();
export const toStrOrNull = (v: any) => {
  const x = toStr(v);
  return x.length ? x : null;
};
export const toPLZ = (v: any) => {
  const x = toStr(v).replace(/\s+/g, '');
  return x.length ? x : null; // String behalten (führende Nullen!)
};
export const toISODate = (v: any) => {
  if (!v && v !== 0) return null;

  if (v instanceof Date && !isNaN(+v)) return v.toISOString().slice(0, 10);

  // Excel-Seriennummer (1900-System)
  if (typeof v === 'number' && isFinite(v)) {
    const ms = (v - 25569) * 86400000; // 25569 = Tage bis 1970-01-01
    const d = new Date(ms);
    return isNaN(+d) ? null : d.toISOString().slice(0, 10);
  }

  const s = toStr(v);
  const dmy = s.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(+date) ? null : date.toISOString().slice(0, 10);
  }
  const ymd = s.match(/^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})$/);
  if (ymd)
    return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  return null;
};

export function isISODate(v: any): boolean {
  if (v == null) return true; // null ist erlaubt
  const s = String(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function isGermanPLZ(v: any): boolean {
  if (v == null) return true;
  const s = String(v).trim();
  return /^\d{5}$/.test(s); // führende 0 erlaubt
}

export function hasMinDigits(v: any, min: number): boolean {
  if (v == null) return true;
  const digits = String(v).replace(/\D+/g, '');
  return digits.length >= min;
}

export function trimNull(s: string | null): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t.length ? t : null;
}
