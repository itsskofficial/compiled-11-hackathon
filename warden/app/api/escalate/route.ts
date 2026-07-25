/**
 * Laptop -> server: an incident escalated.
 *
 * This is the one thing the server relays, and it exists because the on-call
 * device is a different machine. It also triggers the real Phonely call, which
 * is fired and never awaited.
 */

import { NextResponse } from 'next/server';
import {
  broadcast,
  clearEscalation,
  putIncident,
  setEscalated,
  subscriberCount,
} from '@/lib/incidentServer';
import { placeEscalationCall, phonelyConfigured } from '@/lib/phonely';
import { escalationThreshold, posture } from '@/lib/types';
import type { Incident } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { incident } = (await req.json()) as { incident: Incident };
  if (!incident?.id) {
    return NextResponse.json({ ok: false, error: 'incident required' }, { status: 400 });
  }

  putIncident(incident);
  setEscalated(incident.id);

  const latest = incident.classifications[incident.classifications.length - 1];
  broadcast('escalation', {
    incidentId: incident.id,
    propertyName: incident.property.propertyName,
    unit: incident.property.unit,
    leaseState: incident.property.leaseState,
    posture: posture(incident.property),
    threshold: escalationThreshold(incident.property),
    threat: incident.threat,
    behavior: latest?.behavior ?? 'person at entry',
    personCount: latest?.personCount ?? 1,
    turnoverDay: incident.property.turnoverDay ?? null,
    openedAt: incident.openedAt,
  });

  // Fired, never awaited. Awaiting it would hold this response for up to eight
  // seconds, and the dashboard does not start polling for the disposition until
  // this returns — so an awaited call would put a visible stall between the
  // voice-down and the phone. The disposition is always resolvable from /oncall,
  // which is what makes the real call additive rather than load-bearing.
  const attempted = phonelyConfigured();
  if (attempted) {
    void placeEscalationCall(incident).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    subscribers: subscriberCount(),
    call: {
      attempted,
      ok: attempted,
      detail: attempted
        ? 'Phonely campaign webhook fired; delivery not awaited'
        : 'Phonely not configured — on-call device path only',
    },
  });
}

/** The `R` reset clears server-side escalation state between takes. */
export async function DELETE() {
  clearEscalation();
  broadcast('standby', { at: Date.now() });
  return NextResponse.json({ ok: true });
}
