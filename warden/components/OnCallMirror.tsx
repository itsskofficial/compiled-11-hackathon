'use client';

/**
 * A phone-shaped panel mirroring what the on-call device is showing.
 *
 * This is the detail that makes the escalation legible: a real phone's screen is
 * invisible to a room, and to a camera. Mirroring it puts the decision surface —
 * which is the product — on screen next to the dashboard, with no
 * picture-in-picture edit.
 */

import { useWarden } from '@/lib/store';
import type { Incident } from '@/lib/types';

const CHOICES = [
  { digit: 1, label: 'DISPATCH GUARD' },
  { digit: 2, label: 'NOTIFY POLICE' },
  { digit: 3, label: 'DISMISS' },
];

export default function OnCallMirror({ incident }: { incident?: Incident }) {
  const ringing = useWarden((s) => s.ringing);
  const answered = useWarden((s) => s.callAnswered);
  const channel = useWarden((s) => s.callChannel);
  const operator = useWarden((s) => s.operator);

  const decided = Boolean(incident?.disposition);
  const pressed = incident?.disposition
    ? incident.disposition === 'guard_dispatched'
      ? 1
      : incident.disposition === 'police_report'
        ? 2
        : incident.disposition === 'dismissed_by_manager'
          ? 3
          : null
    : null;

  return (
    <div className="mirror">
      <div className="mirror-label">
        On-call device — {operator.displayName}, {operator.role ?? 'Regional Ops'}
        {channel === 'phonely' ? ' · via Phonely' : ''}
      </div>
      <div className="phone">
        {!ringing && !answered && !decided && (
          <div className="phone-standby">
            WARDEN OPS
            <br />
            ON CALL
            <br />
            MAPLE GROVE RESIDENTIAL
          </div>
        )}

        {ringing && !answered && (
          <>
            <div className="phone-ring-title">WARDEN OPS</div>
            <div className="phone-ring-sub">
              {incident ? `${incident.property.propertyName} — ${incident.property.unit}` : 'Incoming'}
            </div>
            <div className="phone-standby" style={{ marginTop: 4 }}>
              INCOMING PRIORITY ALERT
            </div>
          </>
        )}

        {(answered || decided) && (
          <div className="phone-keys">
            {CHOICES.map((c) => (
              <div key={c.digit} className={`phone-key${pressed === c.digit ? ' pressed' : ''}`}>
                {c.digit}  {c.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
