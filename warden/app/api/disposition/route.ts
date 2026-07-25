/**
 * The on-call manager's answer, coming home.
 *
 * Two producers write here and they are indistinguishable downstream: Phonely's
 * live API Request block during the real call, and the /oncall page's buttons.
 * First one wins. That convergence is what makes the real call additive rather
 * than load-bearing.
 *
 * The dashboard polls GET while an incident is escalated. SSE only flows
 * server -> phone, so this is the return path.
 */

import { NextResponse } from 'next/server';
import {
  broadcast,
  latestEscalatedId,
  readDisposition,
  recordDisposition,
} from '@/lib/incidentServer';
import { isoWithOffset } from '@/lib/time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function coerceDigit(value: unknown): 1 | 2 | 3 | null {
  const n = Number(String(value ?? '').replace(/\D/g, ''));
  return n === 1 || n === 2 || n === 3 ? (n as 1 | 2 | 3) : null;
}

export async function POST(req: Request) {
  // The body can only be read once, so take the raw text and then decide. Phonely's
  // API Request block may send form-encoded data rather than JSON, and a failed
  // req.json() would already have consumed the stream.
  let body: Record<string, unknown> = {};
  const raw = await req.text().catch(() => '');
  if (raw) {
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      body = Object.fromEntries(new URLSearchParams(raw).entries());
    }
  }

  const digit = coerceDigit(body.digit ?? body.choice ?? body.response ?? body.dtmf);
  if (!digit) {
    return NextResponse.json(
      { ok: false, error: 'digit must be 1, 2, or 3' },
      { status: 400 },
    );
  }

  // The incident id may not survive Phonely's round trip. There is exactly one
  // escalated incident at a time, so falling back to it is correct, not a hack.
  const incidentId = (body.incidentId as string) || (body.incident_id as string) || latestEscalatedId();
  if (!incidentId) {
    return NextResponse.json({ ok: false, error: 'no escalated incident' }, { status: 409 });
  }

  const source =
    (body.source as 'phonely' | 'warden_mobile' | 'callwright') ??
    (body.incidentId ? 'warden_mobile' : 'phonely');

  const record = { incidentId, digit, at: isoWithOffset(), source } as const;
  recordDisposition(record);
  broadcast('disposition', record);

  return NextResponse.json({ ok: true, ...record });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const incidentId = url.searchParams.get('incidentId') ?? undefined;
  const record = readDisposition(incidentId);
  return NextResponse.json(record ?? {}, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
