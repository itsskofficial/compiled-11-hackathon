/**
 * The escalation call, placed through Phonely. trd.md §5.1 and §5.3.
 *
 * Phonely's outbound path is a campaign whose trigger source is a webhook: you
 * POST lead data to /webhook/campaign/{campaignId} and the agent runs the call
 * flow. The flow's live API Request block posts the pressed digit back to
 * /api/disposition, which is what lets the dashboard flip mid-call.
 *
 * This is NEVER awaited by the escalation path. The call either happens or it
 * does not; the disposition is always resolvable from /oncall, so a telephony
 * failure costs a retake and never a broken loop.
 */

import type { Incident } from './types';

export interface PlaceCallResult {
  attempted: boolean;
  ok: boolean;
  detail: string;
}

function describe(incident: Incident): Record<string, string> {
  const c = incident.classifications[incident.classifications.length - 1];
  const p = incident.property;
  return {
    property_name: p.propertyName,
    unit: p.unit,
    lease_state: p.leaseState,
    turnover_day: p.turnoverDay ? String(p.turnoverDay) : '',
    behavior: c?.behavior ?? 'person at entry',
    person_count: String(c?.personCount ?? 1),
    threat: String(incident.threat),
    incident_id: incident.id,
  };
}

export async function placeEscalationCall(incident: Incident): Promise<PlaceCallResult> {
  const webhook = process.env.PHONELY_CAMPAIGN_WEBHOOK;
  const phone = process.env.ONCALL_PHONE_NUMBER;

  if (!webhook || !phone) {
    return {
      attempted: false,
      ok: false,
      detail: 'Phonely not configured — on-call device path only',
    };
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.PHONELY_API_KEY
          ? { authorization: `Bearer ${process.env.PHONELY_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        phone_number: phone,
        name: 'Jordan Reyes',
        ...describe(incident),
      }),
      signal: AbortSignal.timeout(8000),
    });

    const text = await res.text().catch(() => '');
    return {
      attempted: true,
      ok: res.ok,
      detail: res.ok
        ? `Phonely campaign triggered (${res.status})`
        : `Phonely responded ${res.status}: ${text.slice(0, 160)}`,
    };
  } catch (err) {
    return {
      attempted: true,
      ok: false,
      detail: err instanceof Error ? `Phonely error: ${err.message}` : 'Phonely error',
    };
  }
}

export function phonelyConfigured(): boolean {
  return Boolean(process.env.PHONELY_CAMPAIGN_WEBHOOK && process.env.ONCALL_PHONE_NUMBER);
}
