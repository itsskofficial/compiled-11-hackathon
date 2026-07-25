/**
 * All dashboard state, in one zustand store in the browser.
 *
 * No database and no persistence across reload — reload is the demo reset, which
 * is a feature between takes. The server holds incident state separately (see
 * lib/incidentServer.ts) only so the print route and the phone can read it.
 */

'use client';

import { create } from 'zustand';
import { PROPERTIES, ONCALL_MANAGER } from './fixtures';
import { numberFrames } from './frames';
import {
  appendAction,
  applyClassification,
  closeIncident as closeIncidentPure,
  computeBundleHash,
  makeIncident,
  markBroadcast,
  markEscalated as markEscalatedPure,
} from './incident';
import { isoWithOffset, incidentId as makeIncidentId } from './time';
import type {
  Action,
  ActionChannel,
  Actor,
  Classification,
  Disposition,
  EvidenceFrame,
  Incident,
  PropertyRef,
  ThreatLevel,
} from './types';
import { SYSTEM_ACTOR } from './types';

export interface FeedRow {
  id: string;
  at: string;
  propertyLabel: string;
  label: string;
  threat?: ThreatLevel;
  channel: ActionChannel;
  succeeded: boolean;
}

export type CallChannel = 'phonely' | 'warden_mobile';

interface WardenState {
  properties: PropertyRef[];
  incidents: Incident[];
  activeIncidentId: string | null;
  feed: FeedRow[];
  operator: Actor;
  seq: number;
  /** Real frames from the last run, so `D` can replay them instead of synthetics. */
  lastFrames: EvidenceFrame[];

  // camera + gate
  cameraOnline: boolean;
  cameraLabel: string;
  diffRatio: number;
  liveDiff: number;
  diffHistory: number[];
  debugOpen: boolean;
  scanning: boolean;

  // escalation surface
  ringing: boolean;
  callAnswered: boolean;
  callChannel: CallChannel | null;
  vendorVerdict: string | null;

  openIncident(propertyId: string, frames: EvidenceFrame[]): string;
  attachClassification(id: string, c: Classification): void;
  logAction(a: Omit<Action, 'id'>): void;
  markBroadcastState(id: string): void;
  markEscalated(id: string): void;
  closeIncident(id: string, d: Disposition, by: Actor, note?: string): void;
  getIncident(id: string): Incident | undefined;

  setDiffRatio(r: number): void;
  pushDiff(v: number): void;
  setCamera(online: boolean, label?: string): void;
  toggleDebug(): void;
  setScanning(v: boolean): void;
  setRinging(v: boolean): void;
  setCallAnswered(v: boolean): void;
  setCallChannel(c: CallChannel | null): void;
  setVendorVerdict(v: string | null): void;
  setOperator(a: Actor): void;
  seedBoot(): void;
  reset(): void;
}

function bootFeed(): FeedRow[] {
  const at = isoWithOffset();
  return [
    {
      id: 'boot-2',
      at,
      propertyLabel: 'Portfolio',
      label: 'PMS vacancy sync complete — 6 properties, 4 armed',
      channel: 'system',
      succeeded: true,
    },
    {
      id: 'boot-1',
      at,
      propertyLabel: 'Portfolio',
      label: 'Warden operations online',
      channel: 'system',
      succeeded: true,
    },
  ];
}

function propertyLabel(p: PropertyRef): string {
  return `${p.propertyName.replace(' Apartments', '')} ${p.unit}`;
}

/** Fire-and-forget mirror to the server so the print route can read the incident. */
function mirror(incident: Incident) {
  if (typeof window === 'undefined') return;
  fetch(`/api/incident/${encodeURIComponent(incident.id)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(incident),
  }).catch(() => {});
}

export const useWarden = create<WardenState>((set, get) => ({
  properties: PROPERTIES,
  incidents: [],
  activeIncidentId: null,
  // Empty on the server. The boot rows carry wall-clock times, and generating
  // those during render makes the server and client markup disagree.
  feed: [],
  operator: ONCALL_MANAGER,
  seq: 40,
  lastFrames: [],

  cameraOnline: false,
  cameraLabel: 'initialising',
  diffRatio: 0.025,
  liveDiff: 0,
  diffHistory: new Array(48).fill(0),
  debugOpen: false,
  scanning: false,

  ringing: false,
  callAnswered: false,
  callChannel: null,
  vendorVerdict: null,

  openIncident(propertyId, frames) {
    const seq = get().seq + 1;
    const id = makeIncidentId(seq);
    const property = get().properties.find((p) => p.propertyId === propertyId) ?? get().properties[0];
    // Frame ids carry the case number, which does not exist until now.
    const numbered = numberFrames(frames, id);
    const incident = makeIncident(id, property, numbered);
    set({
      seq,
      incidents: [...get().incidents, incident],
      activeIncidentId: id,
      lastFrames: numbered,
    });
    get().logAction({
      incidentId: id,
      at: incident.openedAt,
      kind: 'motion_detected',
      channel: 'system',
      actor: SYSTEM_ACTOR,
      summary: `Motion gate tripped — ${frames.length} frames captured`,
      detail: `camera ${property.cameraId} · diff threshold ${get().diffRatio.toFixed(3)}`,
      succeeded: true,
    });
    mirror(get().getIncident(id)!);
    return id;
  },

  attachClassification(id, c) {
    set({
      incidents: get().incidents.map((i) => (i.id === id ? applyClassification(i, c) : i)),
    });
    const inc = get().getIncident(id);
    if (inc) mirror(inc);
  },

  logAction(a) {
    const action: Action = { ...a, id: `ACT-${Math.random().toString(36).slice(2, 10)}` };
    const incidents = get().incidents.map((i) =>
      i.id === action.incidentId ? appendAction(i, action) : i,
    );
    const inc = incidents.find((i) => i.id === action.incidentId);
    const row: FeedRow = {
      id: action.id,
      at: action.at,
      propertyLabel: inc ? propertyLabel(inc.property) : 'Portfolio',
      label: action.summary,
      threat: action.kind === 'vision_classified' ? inc?.threat : undefined,
      channel: action.channel,
      succeeded: action.succeeded,
    };
    set({ incidents, feed: [row, ...get().feed].slice(0, 60) });
    if (inc) mirror(inc);
  },

  markBroadcastState(id) {
    set({ incidents: get().incidents.map((i) => (i.id === id ? markBroadcast(i) : i)) });
    const inc = get().getIncident(id);
    if (inc) mirror(inc);
  },

  markEscalated(id) {
    set({ incidents: get().incidents.map((i) => (i.id === id ? markEscalatedPure(i) : i)) });
    const inc = get().getIncident(id);
    if (inc) mirror(inc);
  },

  closeIncident(id, disposition, by, note) {
    set({
      incidents: get().incidents.map((i) =>
        i.id === id ? closeIncidentPure(i, disposition, by, note) : i,
      ),
    });
    const closed = get().getIncident(id);
    if (!closed) return;
    // Bundle hash covers frame hashes plus the action log, so it can only be
    // computed once the log is final.
    computeBundleHash(closed).then((bundleSha256) => {
      set({
        incidents: get().incidents.map((i) => (i.id === id ? { ...i, bundleSha256 } : i)),
      });
      const withHash = get().getIncident(id);
      if (withHash) mirror(withHash);
    });
    // callAnswered stays true so the on-call mirror keeps showing which key was
    // pressed. Only `R` clears it.
    set({ ringing: false });
    mirror(closed);
  },

  getIncident(id) {
    return get().incidents.find((i) => i.id === id);
  },

  setDiffRatio(r) {
    set({ diffRatio: r });
  },
  pushDiff(v) {
    const h = get().diffHistory;
    set({ liveDiff: v, diffHistory: [...h.slice(1), v] });
  },
  setCamera(online, label) {
    set({ cameraOnline: online, cameraLabel: label ?? get().cameraLabel });
  },
  toggleDebug() {
    set({ debugOpen: !get().debugOpen });
  },
  setScanning(v) {
    set({ scanning: v });
  },
  setRinging(v) {
    set({ ringing: v });
  },
  setCallAnswered(v) {
    set({ callAnswered: v });
  },
  setCallChannel(c) {
    set({ callChannel: c });
  },
  setVendorVerdict(v) {
    set({ vendorVerdict: v });
  },
  setOperator(a) {
    set({ operator: a });
  },
  seedBoot() {
    if (get().feed.length === 0) set({ feed: bootFeed() });
  },

  reset() {
    set({
      incidents: [],
      activeIncidentId: null,
      feed: bootFeed(),
      scanning: false,
      ringing: false,
      callAnswered: false,
      callChannel: null,
      vendorVerdict: null,
      liveDiff: 0,
      diffHistory: new Array(48).fill(0),
    });
    fetch('/api/escalate', { method: 'DELETE' }).catch(() => {});
  },
}));

export function activeIncident(state: WardenState): Incident | undefined {
  return state.activeIncidentId ? state.getIncident(state.activeIncidentId) : undefined;
}
