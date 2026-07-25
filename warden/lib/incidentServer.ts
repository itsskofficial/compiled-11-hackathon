/**
 * The only server-side state in the system.
 *
 * trd.md §3 argues the dashboard needs no event bus, because the camera, the
 * gate and the UI all live in one browser tab. Three things do need the server
 * though, and they are the reason this module exists:
 *
 *   1. The print route is a fresh page load, so it cannot see the tab's store.
 *   2. The phone is a different device and must be pushed to.
 *   3. Phonely's callback arrives from the public internet with no session.
 *
 * Held in globalThis so it survives hot reloads in development.
 */

import type { Incident } from './types';

export interface DispositionRecord {
  incidentId: string;
  digit: 1 | 2 | 3;
  at: string;
  source: 'phonely' | 'warden_mobile' | 'callwright';
}

interface WardenServerState {
  incidents: Map<string, Incident>;
  latestEscalatedId: string | null;
  dispositions: Map<string, DispositionRecord>;
  subscribers: Set<(chunk: string) => void>;
}

const globalRef = globalThis as unknown as { __wardenServer?: WardenServerState };

const state: WardenServerState =
  globalRef.__wardenServer ??
  (globalRef.__wardenServer = {
    incidents: new Map(),
    latestEscalatedId: null,
    dispositions: new Map(),
    subscribers: new Set(),
  });

export function putIncident(incident: Incident) {
  state.incidents.set(incident.id, incident);
}

export function getIncident(id: string): Incident | undefined {
  return state.incidents.get(id);
}

export function allIncidents(): Incident[] {
  return [...state.incidents.values()];
}

export function setEscalated(id: string) {
  state.latestEscalatedId = id;
}

export function latestEscalatedId(): string | null {
  return state.latestEscalatedId;
}

export function recordDisposition(rec: DispositionRecord) {
  state.dispositions.set(rec.incidentId, rec);
}

export function readDisposition(incidentId?: string): DispositionRecord | undefined {
  const id = incidentId ?? state.latestEscalatedId;
  if (!id) return undefined;
  return state.dispositions.get(id);
}

export function clearEscalation() {
  state.latestEscalatedId = null;
  state.dispositions.clear();
}

/* ---------- SSE, the phone's only subscription ---------- */

export function subscribe(send: (chunk: string) => void): () => void {
  state.subscribers.add(send);
  return () => state.subscribers.delete(send);
}

export function broadcast(event: string, payload: unknown) {
  const chunk = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const send of state.subscribers) {
    try {
      send(chunk);
    } catch {
      state.subscribers.delete(send);
    }
  }
}

export function subscriberCount(): number {
  return state.subscribers.size;
}
