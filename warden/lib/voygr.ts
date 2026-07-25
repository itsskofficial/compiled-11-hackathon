/**
 * VOYGR business validation.
 *
 * Dispatching a guard to a vendor that closed last month is a real failure mode
 * in this business, and VOYGR's Business Validation API answers exactly that
 * question: is this place actually operating, closed, rebranded, or invalid.
 *
 * Dispatch itself remains simulated. The vendor check is real, and the UI says
 * precisely that: DISPATCH SIMULATED · VENDOR VALIDATED VIA VOYGR.
 */

const BASE_URL = process.env.VOYGR_BASE_URL ?? 'https://dev.voygr.tech';

export interface VendorVerdict {
  status: 'operating' | 'closed' | 'rebranded' | 'invalid' | 'unverified';
  label: string;
  source: 'voygr' | 'unconfigured';
  raw?: unknown;
}

export function voygrConfigured(): boolean {
  return Boolean(process.env.VOYGR_API_KEY);
}

function normalise(payload: unknown): VendorVerdict['status'] {
  const text = JSON.stringify(payload ?? '').toLowerCase();
  if (/\b(rebrand|renamed)/.test(text)) return 'rebranded';
  if (/\b(closed|permanently_closed|ceased)/.test(text)) return 'closed';
  if (/\b(invalid|not_found|nonexistent)/.test(text)) return 'invalid';
  if (/\b(open|operating|active|verified)/.test(text)) return 'operating';
  return 'unverified';
}

export async function validateBusiness(name: string, address: string): Promise<VendorVerdict> {
  const key = process.env.VOYGR_API_KEY;
  if (!key) {
    return {
      status: 'unverified',
      label: 'VENDOR CHECK UNAVAILABLE — VOYGR KEY NOT SET',
      source: 'unconfigured',
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/v1/business-status`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify({ name, address }),
      signal: AbortSignal.timeout(6000),
    });

    const raw: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        status: 'unverified',
        label: `VENDOR CHECK INCONCLUSIVE (${res.status})`,
        source: 'voygr',
        raw,
      };
    }

    const status = normalise(raw);
    const labels: Record<VendorVerdict['status'], string> = {
      operating: 'VENDOR VERIFIED OPERATING — VOYGR',
      closed: 'VENDOR REPORTED CLOSED — VOYGR · DISPATCH BLOCKED',
      rebranded: 'VENDOR REBRANDED — VOYGR · REVIEW BEFORE DISPATCH',
      invalid: 'VENDOR RECORD INVALID — VOYGR · DISPATCH BLOCKED',
      unverified: 'VENDOR STATUS UNCONFIRMED — VOYGR',
    };

    return { status, label: labels[status], source: 'voygr', raw };
  } catch (err) {
    return {
      status: 'unverified',
      label: 'VENDOR CHECK TIMED OUT — VOYGR',
      source: 'voygr',
      raw: err instanceof Error ? err.message : String(err),
    };
  }
}
