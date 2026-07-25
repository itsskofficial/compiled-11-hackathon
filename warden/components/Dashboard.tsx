'use client';

/**
 * The entire dashboard, one screen, no scrolling.
 *
 * Hotkeys (trd.md §4.4), repurposed for a recorded take:
 *   T  force-trigger the real pipeline on the real current frame. Only the
 *      gate's decision is skipped, so the classification is genuinely live —
 *      this starts a take on cue instead of waiting for the gate to notice.
 *   D  fire a fully canned incident. Completes the loop with no camera and no
 *      network, which is how camera moves get rehearsed without burning calls.
 *   `  debug panel. Must be closed in every frame that gets recorded.
 *   R  reset to a clean state between takes.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import CameraTile from '@/components/CameraTile';
import DebugPanel from '@/components/DebugPanel';
import EventStream from '@/components/EventStream';
import OnCallMirror from '@/components/OnCallMirror';
import PropertyRail from '@/components/PropertyRail';
import ThreatCard from '@/components/ThreatCard';
import { HERO_PROPERTY_ID } from '@/lib/fixtures';
import { cancelWatchers, runIncident } from '@/lib/pipeline';
import { useWarden } from '@/lib/store';
import { clockWithZone, fullStamp } from '@/lib/time';
import { initVoice, warmUpVoice } from '@/lib/voice';
import type { OperatorIdentity } from '@/hexclave/server';

export default function Dashboard({ operator }: { operator: OperatorIdentity }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stamp, setStamp] = useState('');

  const properties = useWarden((s) => s.properties);
  const incidents = useWarden((s) => s.incidents);
  const activeIncidentId = useWarden((s) => s.activeIncidentId);
  const setOperator = useWarden((s) => s.setOperator);
  const seedBoot = useWarden((s) => s.seedBoot);
  const toggleDebug = useWarden((s) => s.toggleDebug);
  const reset = useWarden((s) => s.reset);

  const hero = properties.find((p) => p.propertyId === HERO_PROPERTY_ID) ?? properties[0];
  const active = incidents.find((i) => i.id === activeIncidentId);

  useEffect(() => {
    setOperator({
      kind: 'human',
      id: operator.id,
      displayName: operator.displayName,
      role: operator.role,
    });
  }, [operator, setOperator]);

  useEffect(() => {
    initVoice();
    seedBoot();
    const stamped = () => setStamp(fullStamp());
    stamped();
    const t = setInterval(stamped, 1000);
    return () => {
      clearInterval(t);
      cancelWatchers();
    };
  }, [seedBoot]);

  // Stable identity matters here: CameraTile keys its start effect on this, and an
  // inline arrow would tear down and re-acquire the stream on every render.
  const registerVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
  }, []);

  const fire = useCallback((canned: boolean) => {
    warmUpVoice();
    void runIncident({
      video: videoRef.current,
      propertyId: HERO_PROPERTY_ID,
      canned,
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === 't') fire(false);
      else if (key === 'd') fire(true);
      else if (key === 'r') {
        cancelWatchers();
        reset();
      } else if (e.key === '`') toggleDebug();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fire, reset, toggleDebug]);

  const reportReady = Boolean(active?.disposition);

  return (
    <div className="ops-shell" onPointerDown={() => warmUpVoice()}>
      <PropertyRail heroId={HERO_PROPERTY_ID} />

      <main className="stage">
        <div className="stage-head">
          <div>
            <div className="stage-title">
              {hero.propertyName} — Unit {hero.unit}
            </div>
            <div className="stage-sub">
              {hero.addressLine}, {hero.cityStateZip} · {hero.ownerOfRecord}
            </div>
          </div>
          <div className="stage-clock">
            <div>{stamp}</div>
            <div style={{ color: '#5b6672', marginTop: 3 }}>
              CAM {hero.cameraId} · CONTINUOUS MONITORING
            </div>
          </div>
        </div>

        <div className="tile-wrap">
          <CameraTile property={hero} onVideo={registerVideo} onTrigger={() => fire(false)} />
        </div>
      </main>

      <aside className="rail rail-right">
        {active ? <ThreatCard incident={active} /> : null}
        <OnCallMirror incident={active} />
        <EventStream />
        <div className="cta-wrap">
          <button
            className="cta"
            data-incident-id={active?.id ?? ''}
            disabled={!reportReady}
            onClick={() => {
              if (!active) return;
              window.open(`/incident/${encodeURIComponent(active.id)}/print`, '_blank');
            }}
          >
            INCIDENT REPORT
          </button>
          <div className="cta-note">
            {reportReady
              ? `${active?.id} · READY TO FILE`
              : active
                ? 'AWAITING DISPOSITION'
                : 'NO OPEN INCIDENT'}
          </div>
        </div>
      </aside>

      <DebugPanel />
    </div>
  );
}
