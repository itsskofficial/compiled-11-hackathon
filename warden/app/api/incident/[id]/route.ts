/**
 * The incident mirror.
 *
 * The dashboard PUTs on every state change; the print route GETs on mount. This
 * exists because /incident/[id]/print is a fresh page load and cannot see the
 * dashboard tab's zustand store — without it the evidence report renders blank.
 *
 * It also means a judge can open the report on their own phone over the tunnel.
 */

import { NextResponse } from 'next/server';
import { getIncident, putIncident } from '@/lib/incidentServer';
import type { Incident } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incident = (await req.json()) as Incident;
  if (!incident?.id || incident.id !== id) {
    return NextResponse.json({ ok: false, error: 'id mismatch' }, { status: 400 });
  }
  putIncident(incident);
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incident = getIncident(id);
  if (!incident) {
    return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(incident, { headers: { 'Cache-Control': 'no-store' } });
}
