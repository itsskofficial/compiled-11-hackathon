'use client';

/**
 * The money shot.
 *
 * It renders optimistically: the instant the gate trips the card is on screen
 * with the frame strip and an ANALYZING state, before the model has answered.
 * The classification fills in when it lands, so perceived latency is near zero
 * and there is never dead air.
 */

import { useWarden } from '@/lib/store';
import { clockWithZone } from '@/lib/time';
import { DISPOSITION_LABEL, escalationThreshold } from '@/lib/types';
import type { Incident } from '@/lib/types';

function threatClass(t: number): string {
  return t >= 4 ? 't-high' : t === 3 ? 't-mid' : 't-low';
}

function Row({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`tc-action${done ? ' done' : ''}`}>
      <span className={done ? 'tick' : ''} style={{ width: 11 }}>
        {done ? '✓' : '○'}
      </span>
      <span>{label}</span>
    </div>
  );
}

export default function ThreatCard({ incident }: { incident: Incident }) {
  const ringing = useWarden((s) => s.ringing);
  const callChannel = useWarden((s) => s.callChannel);
  const vendorVerdict = useWarden((s) => s.vendorVerdict);

  const classification = incident.classifications[incident.classifications.length - 1];
  const analyzing = !classification;
  const threshold = escalationThreshold(incident.property);
  const escalated = incident.state === 'escalated' || Boolean(incident.disposition);

  const broadcast =
    incident.state === 'deterrent_broadcast' || escalated || incident.actions.some((a) => a.kind === 'voice_down');

  return (
    <div className={`threat-card${(classification?.threat ?? 0) >= 4 ? ' high' : ''}`}>
      <div className="tc-head">
        {analyzing ? (
          <div className="analyzing">ANALYZING FRAMES…</div>
        ) : (
          <>
            <div className={`tc-threat ${threatClass(classification.threat)}`}>
              THREAT {classification.threat}
            </div>
            <div className="tc-behavior">&ldquo;{classification.behavior}&rdquo;</div>
            {/* Non-breaking spaces so a wrap never orphans the threshold digit. */}
            <div className="tc-meta">
              {`${classification.personCount}\u00A0${classification.personCount === 1 ? 'person' : 'people'} · ${clockWithZone(classification.at)} · ${classification.uniformed ? 'UNIFORMED' : 'NO\u00A0UNIFORM'} · THRESHOLD\u00A0${threshold}`}
            </div>
          </>
        )}
      </div>

      {incident.frames.length > 0 && (
        <div className="tc-frames">
          {incident.frames.slice(0, 3).map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f.id} src={f.dataUri} alt={`Frame ${f.index}`} width={f.width} height={f.height} />
          ))}
        </div>
      )}

      <div className="tc-actions">
        <Row done label={`MOTION GATE TRIPPED — ${incident.cameraId}`} />
        <Row done={!analyzing} label="VISION ASSESSMENT COMPLETE" />
        <Row done={broadcast} label="VOICE-DOWN BROADCAST" />
        <Row
          done={escalated}
          label={
            callChannel === 'phonely'
              ? 'ON-CALL NOTIFIED — PHONELY VOICE CALL'
              : 'ON-CALL NOTIFIED — J. REYES'
          }
        />
        <Row
          done={Boolean(incident.disposition)}
          label={incident.disposition ? 'DISPOSITION RECORDED' : 'AWAITING DISPOSITION'}
        />
        {vendorVerdict && <Row done label={vendorVerdict} />}
      </div>

      {incident.disposition ? (
        <div
          className={`tc-disposition ${
            incident.disposition === 'false_alarm' ? 't-low' : 't-mid'
          }`}
        >
          {DISPOSITION_LABEL[incident.disposition]}
          <div style={{ color: '#7d8896', fontSize: 10, marginTop: 5, letterSpacing: '0.06em' }}>
            {incident.dispositionBy?.displayName ?? 'SYSTEM'}
            {incident.dispositionBy?.role ? ` · ${incident.dispositionBy.role}` : ''} ·{' '}
            {incident.dispositionAt ? clockWithZone(incident.dispositionAt) : ''}
          </div>
        </div>
      ) : ringing ? (
        <div className="tc-disposition t-mid">CALLING ON-CALL MANAGER…</div>
      ) : null}
    </div>
  );
}
