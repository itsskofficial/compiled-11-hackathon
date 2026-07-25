/**
 * Timestamps. Every string this module produces carries a UTC offset, because
 * the evidence report prints one on every row and a naive ISO string would
 * silently drop it.
 */

const pad = (n: number, w = 2) => String(Math.abs(Math.trunc(n))).padStart(w, '0');

/** 2026-07-24T21:42:07.412-07:00 */
export function isoWithOffset(d: Date = new Date()): string {
  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}` +
    `${sign}${pad(offsetMinutes / 60)}:${pad(offsetMinutes % 60)}`
  );
}

/** IANA zone, e.g. America/Los_Angeles */
export function ianaZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Short zone abbreviation, e.g. PDT. */
export function zoneAbbrev(d: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(d);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? 'UTC';
  } catch {
    return 'UTC';
  }
}

/** +HH:MM */
export function offsetLabel(d: Date = new Date()): string {
  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  return `${sign}${pad(offsetMinutes / 60)}:${pad(offsetMinutes % 60)}`;
}

/** 21:42:07 PDT — the dashboard clock and log rows. */
export function clockWithZone(iso: string | Date = new Date()): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${zoneAbbrev(d)}`;
}

/** 21:42:07 — log rows where the zone is stated in the column header. */
export function clockOnly(iso: string | Date = new Date()): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 2026-07-24 21:47:13 PDT (UTC-07:00) — the report's full form. */
export function fullStamp(iso: string | Date = new Date()): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ` +
    `${zoneAbbrev(d)} (UTC${offsetLabel(d)})`
  );
}

/** WSO-2026-0724-0041 — also the case number on the report. */
export function incidentId(seq: number, d: Date = new Date()): string {
  return `WSO-${d.getFullYear()}-${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(seq, 4)}`;
}
