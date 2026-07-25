/**
 * Incident lifecycle, as pure functions.
 *
 * closeIncident is the only way an incident reaches the 'closed' state, which is
 * what makes "every incident closes with a disposition" a property of the code
 * rather than a claim on a slide. If someone asks what is actually defensible
 * here tonight, it is this function.
 */

import { sha256OfText, truncateHash } from './hash';
import { isoWithOffset } from './time';
import type {
  Action,
  Actor,
  Classification,
  Disposition,
  EvidenceFrame,
  Incident,
  PropertyRef,
  ThreatLevel,
} from './types';

export function makeIncident(
  id: string,
  property: PropertyRef,
  frames: EvidenceFrame[],
  openedAt = isoWithOffset(),
): Incident {
  return {
    id,
    property,
    state: frames.length ? 'classifying' : 'motion_detected',
    openedAt,
    timezone: property.timezone,
    cameraId: property.cameraId,
    threat: 1,
    classifications: [],
    frames,
    actions: [],
  };
}

export function applyClassification(incident: Incident, c: Classification): Incident {
  const threat = Math.max(incident.threat, c.threat) as ThreatLevel;
  return {
    ...incident,
    state: 'assessed',
    threat,
    classifications: [...incident.classifications, c],
  };
}

export function appendAction(incident: Incident, action: Action): Incident {
  return { ...incident, actions: [...incident.actions, action] };
}

export function markBroadcast(incident: Incident): Incident {
  return { ...incident, state: 'deterrent_broadcast' };
}

export function markEscalated(incident: Incident): Incident {
  return { ...incident, state: 'escalated' };
}

/** The only way to close an incident. Disposition is not optional in practice. */
export function closeIncident(
  incident: Incident,
  disposition: Disposition,
  by: Actor,
  note?: string,
): Incident {
  const at = isoWithOffset();
  return {
    ...incident,
    state: 'closed',
    closedAt: at,
    disposition,
    dispositionAt: at,
    dispositionBy: by,
    dispositionNote: note,
  };
}

/**
 * Hash over the frame hashes plus the action log, so the report can print one
 * identifier that covers the whole bundle rather than only the images.
 */
export async function computeBundleHash(incident: Incident): Promise<string> {
  const payload = [
    incident.id,
    incident.openedAt,
    ...incident.frames.map((f) => `${f.id}:${f.sha256}`),
    ...incident.actions.map((a) => `${a.at}:${a.kind}:${a.summary}`),
    incident.disposition ?? '',
  ].join('\n');
  return sha256OfText(payload);
}

export function shortBundle(hash?: string): string {
  return hash ? truncateHash(hash) : 'pending';
}
