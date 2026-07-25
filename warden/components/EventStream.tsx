'use client';

/** Reverse-chronological log. Monospace, and every row carries a timezone. */

import { useWarden } from '@/lib/store';
import { clockOnly, zoneAbbrev } from '@/lib/time';
import { useEffect, useState } from 'react';

function threatClass(t: number): string {
  return t >= 4 ? 't-high' : t === 3 ? 't-mid' : 't-low';
}

export default function EventStream() {
  const feed = useWarden((s) => s.feed);
  const [zone, setZone] = useState('');

  useEffect(() => setZone(zoneAbbrev()), []);

  return (
    <>
      <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Event stream</span>
        <span className="mono" style={{ letterSpacing: '0.1em' }}>
          ALL TIMES {zone}
        </span>
      </div>
      <div className="feed">
        {feed.map((row) => (
          <div key={row.id} className="feed-row">
            <span className="feed-time">{clockOnly(row.at)}</span>
            <span>
              <span className="feed-label">{row.label}</span>
              <div className="feed-prop">
                {row.propertyLabel} · {row.channel.replace('_', ' ')}
              </div>
            </span>
            {row.threat ? (
              <span className={`threat-pill ${threatClass(row.threat)}`}>T{row.threat}</span>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
