'use client';

/**
 * DIFF_RATIO is the single knob, and lighting where this was written will not
 * match lighting where it is filmed. Tune it once in the actual room, then close
 * this panel and leave it closed — it must not appear in a single frame of the
 * recording.
 */

import { useWarden } from '@/lib/store';

export default function DebugPanel() {
  const open = useWarden((s) => s.debugOpen);
  const diffRatio = useWarden((s) => s.diffRatio);
  const liveDiff = useWarden((s) => s.liveDiff);
  const setDiffRatio = useWarden((s) => s.setDiffRatio);
  const cameraLabel = useWarden((s) => s.cameraLabel);

  if (!open) return null;

  return (
    <div className="debug">
      <span className="debug-key">DIFF_RATIO</span>
      <input
        type="range"
        min={0.002}
        max={0.14}
        step={0.001}
        value={diffRatio}
        onChange={(e) => setDiffRatio(Number(e.target.value))}
      />
      <span className="debug-key" style={{ minWidth: 52 }}>
        {diffRatio.toFixed(3)}
      </span>
      <span>
        live <span className={liveDiff > diffRatio ? 'debug-key' : ''}>{liveDiff.toFixed(4)}</span>
      </span>
      <span style={{ color: '#5b6672', maxWidth: 190, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {cameraLabel}
      </span>
      <span style={{ color: '#5b6672' }}>T trigger · D canned · R reset · ` close</span>
    </div>
  );
}
