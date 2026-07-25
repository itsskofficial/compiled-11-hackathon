'use client';

/**
 * Portfolio rail. The line to say out loud: the property management system
 * already knows which units are empty tonight, so posture just follows lease
 * state — nobody arms anything by hand.
 *
 * The PMS feed is faked and the footer says so. A judge who discovers an
 * unlabeled fake stops believing everything else on the screen.
 */

import { DOORS_MONITORED } from '@/lib/fixtures';
import { useWarden } from '@/lib/store';
import { ESCALATION_THRESHOLD, POSTURE } from '@/lib/types';
import type { PropertyRef } from '@/lib/types';

const LEASE_LABEL: Record<PropertyRef['leaseState'], string> = {
  occupied: 'OCCUPIED',
  notice: 'NOTICE',
  vacant: 'VACANT',
  seasonal_vacant: 'SEASONAL',
  construction: 'CONSTRUCTION',
};

export default function PropertyRail({ heroId }: { heroId: string }) {
  const properties = useWarden((s) => s.properties);
  const operator = useWarden((s) => s.operator);

  return (
    <aside className="rail">
      <div className="rail-head">
        <h1 className="wordmark">WARDEN</h1>
        <div className="wordmark-sub">Security Operations</div>
        <div className="counter mono">{DOORS_MONITORED.toLocaleString('en-US')}</div>
        <div className="counter-label">Doors monitored</div>
      </div>

      <div className="section-label">Portfolio · live posture</div>

      <div className="prop-list">
        {properties.map((p) => {
          const posture = POSTURE[p.leaseState];
          const threshold = ESCALATION_THRESHOLD[posture];
          const isHero = p.propertyId === heroId;
          return (
            <div key={p.propertyId} className={`prop-card${isHero ? ' armed-hero' : ''}`}>
              <div className="prop-name">
                {p.propertyName} <span className="prop-unit">· {p.unit}</span>
              </div>
              <div className="prop-detail">{p.detail}</div>
              <div className="prop-meta">
                <span
                  className={`chip${
                    posture === 'armed' ? ' chip-armed' : posture === 'standard' ? ' chip-standard' : ''
                  }`}
                >
                  {LEASE_LABEL[p.leaseState]}
                </span>
                <span className="posture-dot">
                  <span className={`dot dot-${posture}`} />
                  {posture.toUpperCase()} · ESC {threshold}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rail-foot">
        <span>PMS: Yardi · synced 4m ago</span>
        <span className="sim-tag">SIMULATED</span>
      </div>
      <div className="rail-foot" style={{ borderTop: 'none', paddingTop: 0 }}>
        <span>ON DUTY: {operator.displayName}</span>
      </div>
    </aside>
  );
}
