/**
 * The loop, start to finish, in one place.
 *
 *   motion -> frames -> classification -> voice-down -> escalation -> disposition
 *
 * Components stay presentational and the store stays dumb; the sequencing lives
 * here so it can be read top to bottom without chasing callbacks.
 *
 * State machine (trd.md §6):
 *   motion_detected -> classifying -> assessed
 *   assessed, threat >= threshold -> deterrent_broadcast -> escalated
 *   assessed, threat <  threshold -> closed [false_alarm]
 *   escalated, digit pressed      -> closed [disposition]
 *   escalated, no answer in 45s   -> closed [guard_dispatched]
 */

'use client';

import { cannedClassification, makeSyntheticFrames } from './canned';
import { captureFrames } from './frames';
import { GUARD_VENDOR, propertyById } from './fixtures';
import { useWarden } from './store';
import { isoWithOffset } from './time';
import { voiceDown, voiceSourceLabel } from './voice';
import { escalationThreshold, SYSTEM_ACTOR } from './types';
import type { Classification, Disposition, EvidenceFrame } from './types';

const NO_ANSWER_MS = 45_000;
const POLL_MS = 500;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let noAnswerTimer: ReturnType<typeof setTimeout> | null = null;
let running = false;

export function loopBusy(): boolean {
  return running;
}

function stopWatchers() {
  if (pollTimer) clearInterval(pollTimer);
  if (noAnswerTimer) clearTimeout(noAnswerTimer);
  pollTimer = null;
  noAnswerTimer = null;
}

async function classify(propertyId: string, apiFrames: string[]): Promise<Classification> {
  try {
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ propertyId, frames: apiFrames, capturedAt: isoWithOffset() }),
      signal: AbortSignal.timeout(9000),
    });
    const data = (await res.json()) as { classification: Classification };
    return data.classification;
  } catch (err) {
    // The route is built never to fail, so this only fires if the network itself
    // is gone — which is exactly when the canned path matters.
    return cannedClassification('offline', err instanceof Error ? err.message : 'network');
  }
}

export interface RunOptions {
  video?: HTMLVideoElement | null;
  propertyId?: string;
  /** `D`: complete the loop with no camera and no network. */
  canned?: boolean;
}

export async function runIncident(opts: RunOptions = {}): Promise<string | null> {
  if (running) return null;
  running = true;

  const store = useWarden.getState();
  const propertyId = opts.propertyId ?? store.properties[0].propertyId;
  const property = propertyById(propertyId);

  try {
    store.setScanning(true);

    // 1. Frames. Real capture where possible; the last real set, then synthetics.
    let apiFrames: string[] = [];
    let evidence: EvidenceFrame[];

    if (!opts.canned && opts.video) {
      const captured = await captureFrames(opts.video, property.cameraId);
      apiFrames = captured.apiFrames;
      evidence = captured.evidence;
    } else if (store.lastFrames.length) {
      evidence = store.lastFrames;
    } else {
      evidence = await makeSyntheticFrames(property.cameraId);
    }

    // 2. Open the incident immediately so the card can render optimistically in
    //    an ANALYZING state. The stage never sees dead air.
    const id = store.openIncident(propertyId, evidence);

    // 3. Classify.
    const classification = opts.canned && !apiFrames.length
      ? cannedClassification('pre-captured', 'canned incident (D)')
      : await classify(propertyId, apiFrames);

    useWarden.getState().attachClassification(id, classification);
    useWarden.getState().setScanning(false);
    useWarden.getState().logAction({
      incidentId: id,
      at: classification.at,
      kind: 'vision_classified',
      channel: 'system',
      actor: SYSTEM_ACTOR,
      summary: `Vision assessment — threat ${classification.threat}: "${classification.behavior}"`,
      detail: `${classification.model} · ${classification.personCount} person(s) · uniformed: ${classification.uniformed}`,
      succeeded: true,
    });

    const threshold = escalationThreshold(property);

    // 4. Below the property's threshold, close it. Posture comes from lease
    //    state, so this number is never hardcoded.
    if (classification.threat < threshold) {
      useWarden.getState().closeIncident(id, 'false_alarm', SYSTEM_ACTOR, `Threat ${classification.threat} below ${property.leaseState} threshold of ${threshold}.`);
      useWarden.getState().logAction({
        incidentId: id,
        at: isoWithOffset(),
        kind: 'operator_response',
        channel: 'system',
        actor: SYSTEM_ACTOR,
        summary: `Auto-resolved as false alarm — below threshold ${threshold}`,
        succeeded: true,
      });
      return id;
    }

    // 5. Voice-down.
    const source = await voiceDown('primary');
    useWarden.getState().markBroadcastState(id);
    useWarden.getState().logAction({
      incidentId: id,
      at: isoWithOffset(),
      kind: 'voice_down',
      channel: 'speaker',
      actor: SYSTEM_ACTOR,
      summary: `Voice deterrent broadcast — ${voiceSourceLabel(source)}`,
      detail: 'This property is monitored. Security has been notified. Leave the premises now.',
      succeeded: true,
    });

    // 6. Escalate: server relays to the phone and places the real call.
    await escalate(id);
    return id;
  } finally {
    running = false;
    useWarden.getState().setScanning(false);
  }
}

async function escalate(incidentId: string) {
  const incident = useWarden.getState().getIncident(incidentId);
  if (!incident) return;

  useWarden.getState().markEscalated(incidentId);
  useWarden.getState().setRinging(true);

  let call = { attempted: false, ok: false, detail: 'not attempted' };
  try {
    const res = await fetch('/api/escalate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ incident }),
    });
    const data = (await res.json()) as { call?: typeof call };
    if (data.call) call = data.call;
  } catch {
    /* the on-call device path still rings locally */
  }

  const channel = call.attempted && call.ok ? 'phonely' : 'warden_mobile';
  useWarden.getState().setCallChannel(channel);
  useWarden.getState().logAction({
    incidentId,
    at: isoWithOffset(),
    kind: 'escalation_call_placed',
    channel,
    actor: SYSTEM_ACTOR,
    summary:
      channel === 'phonely'
        ? 'Escalation call placed to on-call manager via Phonely'
        : 'On-call device alerted — Jordan Reyes, Regional Ops',
    detail: call.detail,
    succeeded: true,
  });

  watchForDisposition(incidentId);
}

/** SSE flows server -> phone only, so the dashboard polls for the answer. */
function watchForDisposition(incidentId: string) {
  stopWatchers();

  pollTimer = setInterval(async () => {
    try {
      const res = await fetch(`/api/disposition?incidentId=${encodeURIComponent(incidentId)}`, {
        cache: 'no-store',
      });
      const rec = (await res.json()) as { digit?: 1 | 2 | 3; source?: string; at?: string };
      if (!rec?.digit) return;
      stopWatchers();
      await applyDisposition(incidentId, rec.digit, rec.source ?? 'warden_mobile');
    } catch {
      /* keep polling */
    }
  }, POLL_MS);

  // "What happens when the manager is asleep?" We dispatch anyway, and the log
  // shows we tried. That is the operator posture, not the software posture.
  noAnswerTimer = setTimeout(async () => {
    stopWatchers();
    const incident = useWarden.getState().getIncident(incidentId);
    if (!incident || incident.state === 'closed') return;
    useWarden.getState().logAction({
      incidentId,
      at: isoWithOffset(),
      kind: 'operator_response',
      channel: 'warden_mobile',
      actor: SYSTEM_ACTOR,
      summary: 'No answer from on-call manager after 45s — dispatching under policy',
      succeeded: true,
    });
    await applyDisposition(incidentId, 1, 'policy_no_answer');
  }, NO_ANSWER_MS);
}

const DIGIT_MAP: Record<1 | 2 | 3, { disposition: Disposition; label: string }> = {
  1: { disposition: 'guard_dispatched', label: 'Guard dispatch requested' },
  2: { disposition: 'police_report', label: 'Police notification requested' },
  3: { disposition: 'dismissed_by_manager', label: 'Dismissed by on-call manager' },
};

export async function applyDisposition(
  incidentId: string,
  digit: 1 | 2 | 3,
  source: string,
): Promise<void> {
  stopWatchers();
  const state = useWarden.getState();
  const incident = state.getIncident(incidentId);
  if (!incident || incident.state === 'closed') return;

  const { disposition, label } = DIGIT_MAP[digit];

  // Nobody pressed anything on the no-answer path, and the log must not say they
  // did. This is an evidence product; the one thing it cannot do is attribute a
  // decision to a human who never made it.
  const byPolicy = source === 'policy_no_answer';
  const by = byPolicy ? SYSTEM_ACTOR : state.operator;
  const channel = source === 'phonely' ? 'phonely' : 'warden_mobile';

  if (!byPolicy) state.setCallAnswered(true);
  state.logAction({
    incidentId,
    at: isoWithOffset(),
    kind: 'operator_response',
    channel: byPolicy ? 'system' : channel,
    actor: by,
    summary: byPolicy ? `${label} under no-answer policy` : `${label} — pressed ${digit}`,
    detail: byPolicy
      ? 'On-call manager did not respond within the escalation window. Action taken automatically under monitoring policy.'
      : `Received over ${channel === 'phonely' ? 'Phonely voice call' : 'Warden on-call device'}`,
    succeeded: true,
  });

  // Guard dispatch validates the vendor is an operating business first. Dispatch
  // itself remains simulated; the check is real.
  if (digit === 1) {
    try {
      const res = await fetch('/api/voygr/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: GUARD_VENDOR.name,
          address: `${GUARD_VENDOR.addressLine}, ${GUARD_VENDOR.cityStateZip}`,
        }),
      });
      const data = (await res.json()) as { verdict?: { label: string; status: string } };
      const verdict = data.verdict?.label ?? 'VENDOR STATUS UNCONFIRMED';
      useWarden.getState().setVendorVerdict(verdict);
      useWarden.getState().logAction({
        incidentId,
        at: isoWithOffset(),
        kind: 'vendor_validated',
        channel: 'voygr',
        actor: SYSTEM_ACTOR,
        summary: verdict,
        detail: `${GUARD_VENDOR.name} — ${GUARD_VENDOR.addressLine}, ${GUARD_VENDOR.cityStateZip}`,
        succeeded: data.verdict?.status === 'operating',
      });
    } catch {
      /* dispatch still logs below */
    }

    useWarden.getState().logAction({
      incidentId,
      at: isoWithOffset(),
      kind: 'guard_dispatch_requested',
      channel: 'dashboard',
      actor: by,
      summary: `Guard dispatch requested — ${GUARD_VENDOR.name} (DISPATCH SIMULATED)`,
      succeeded: true,
    });
  }

  if (digit === 2) {
    useWarden.getState().logAction({
      incidentId,
      at: isoWithOffset(),
      kind: 'police_notified',
      channel: 'dashboard',
      actor: by,
      summary: 'Local law enforcement notification prepared (SIMULATED)',
      succeeded: true,
    });
  }

  useWarden.getState().closeIncident(
    incidentId,
    disposition,
    by,
    byPolicy
      ? 'No response from on-call manager within the escalation window. Closed automatically under monitoring policy.'
      : `Decision received from on-call manager over ${channel}.`,
  );
  useWarden.getState().setRinging(false);
}

export function cancelWatchers() {
  stopWatchers();
}
