/**
 * Shared types. Mirrors trd.md §6 and §2.
 *
 * Every timestamp in this system is an offset-bearing ISO 8601 string, never a
 * Date and never an epoch. The evidence report prints timezones, and timezone
 * math at the last minute is how that goes wrong. See lib/time.ts.
 */

export type LeaseState = 'occupied' | 'notice' | 'vacant' | 'seasonal_vacant' | 'construction';
export type Posture = 'passive' | 'standard' | 'armed';

export const POSTURE: Record<LeaseState, Posture> = {
  occupied: 'passive',
  notice: 'standard',
  vacant: 'armed',
  seasonal_vacant: 'armed',
  construction: 'armed',
};

/** Armed properties escalate one threat level lower than occupied ones. */
export const ESCALATION_THRESHOLD: Record<Posture, number> = {
  passive: 4,
  standard: 3,
  armed: 3,
};

export type ThreatLevel = 1 | 2 | 3 | 4 | 5;

export type Disposition =
  | 'false_alarm'
  | 'deterred_by_voice'
  | 'dismissed_by_manager'
  | 'guard_dispatched'
  | 'police_report'
  | 'eviction_filed'
  | 'claim_paid';

export const DISPOSITION_LABEL: Record<Disposition, string> = {
  false_alarm: 'FALSE ALARM',
  deterred_by_voice: 'DETERRED BY VOICE',
  dismissed_by_manager: 'DISMISSED BY MANAGER',
  guard_dispatched: 'GUARD DISPATCHED',
  police_report: 'POLICE REPORT FILED',
  eviction_filed: 'EVICTION FILED',
  claim_paid: 'CLAIM PAID',
};

export type IncidentState =
  | 'motion_detected'
  | 'classifying'
  | 'assessed'
  | 'deterrent_broadcast'
  | 'escalated'
  | 'closed';

export interface EvidenceFrame {
  id: string;
  index: number;
  capturedAt: string;
  cameraId: string;
  dataUri: string;
  sha256: string;
  width: number;
  height: number;
  isTriggerFrame: boolean;
}

export interface Classification {
  at: string;
  model: string;
  personDetected: boolean;
  personCount: number;
  behavior: string;
  uniformed: boolean;
  threat: ThreatLevel;
  rationale: string;
  /** Verbatim model JSON. The report prints this rather than a prose summary. */
  raw: unknown;
  /** True when the 6s timeout or an API failure produced a canned assessment. */
  fallback?: boolean;
}

export type ActionKind =
  | 'motion_detected'
  | 'vision_classified'
  | 'voice_down'
  | 'escalation_call_placed'
  | 'escalation_call_answered'
  | 'operator_response'
  | 'vendor_validated'
  | 'guard_dispatch_requested'
  | 'police_notified'
  | 'report_generated';

export type ActionChannel =
  | 'system'
  | 'speaker'
  | 'phonely'
  | 'callwright'
  | 'warden_mobile'
  | 'voygr'
  | 'dashboard';

export interface Actor {
  kind: 'system' | 'human';
  id: string;
  displayName: string;
  role?: string;
}

export const SYSTEM_ACTOR: Actor = {
  kind: 'system',
  id: 'SYSTEM',
  displayName: 'Warden Automation',
};

export interface Action {
  id: string;
  incidentId: string;
  at: string;
  kind: ActionKind;
  channel: ActionChannel;
  actor: Actor;
  summary: string;
  detail?: string;
  succeeded: boolean;
}

export interface PropertyRef {
  propertyId: string;
  propertyName: string;
  unit: string;
  addressLine: string;
  cityStateZip: string;
  ownerOfRecord: string;
  managingAgent: string;
  leaseState: LeaseState;
  turnoverDay?: number;
  turnoverLength?: number;
  lastAuthorizedEntry?: { at: string; by: string };
  cameraId: string;
  /** Short line for the property rail, e.g. "Turnover day 12". */
  detail: string;
  timezone: string;
}

export interface Incident {
  id: string;
  property: PropertyRef;
  state: IncidentState;
  openedAt: string;
  closedAt?: string;
  timezone: string;
  cameraId: string;
  threat: ThreatLevel;
  classifications: Classification[];
  frames: EvidenceFrame[];
  actions: Action[];
  disposition?: Disposition;
  dispositionAt?: string;
  dispositionBy?: Actor;
  dispositionNote?: string;
  bundleSha256?: string;
}

export function posture(p: PropertyRef): Posture {
  return POSTURE[p.leaseState];
}

export function escalationThreshold(p: PropertyRef): number {
  return ESCALATION_THRESHOLD[posture(p)];
}

/**
 * Prose for the vision prompt. The model reasons better about "no legitimate
 * visitor at night" when it knows why the unit is empty.
 */
export function vacancyNarrative(p: PropertyRef): string {
  switch (p.leaseState) {
    case 'vacant':
      return p.turnoverDay
        ? `unoccupied and has been vacant for ${p.turnoverDay} days during turnover. No tenant has keys. Only vendors on the authorized-entry list should be present, and only during daylight hours`
        : 'unoccupied and vacant. No tenant has keys';
    case 'seasonal_vacant':
      return 'a seasonally occupied residence with the owner absent. No one is expected on site';
    case 'construction':
      return 'an active construction site with no occupants. Materials and copper are on site overnight';
    case 'notice':
      return 'still occupied but the tenant has given notice and is moving out shortly';
    case 'occupied':
      return 'occupied by a tenant who may legitimately come and go at any hour';
  }
}

/**
 * Model id resolution. trd.md §4.2 specifies claude-sonnet-5 as a latency
 * decision. Model ids move, so the route tries these in order and advances past
 * a 404 rather than failing the demo. Override with ANTHROPIC_MODEL.
 */
export const MODEL_CANDIDATES: string[] = [
  process.env.ANTHROPIC_MODEL,
  'claude-sonnet-5',
  'claude-sonnet-4-5',
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-latest',
].filter((m): m is string => Boolean(m));
