'use client';

/**
 * The on-call device. trd.md §5.2.
 *
 * This page is deliberately not the fallback. When the real Phonely call
 * connects, the phone's own call screen is invisible to a camera; this is the
 * surface that shows the decision being made. Either producer can supply the
 * disposition and they are indistinguishable downstream, so the real call is
 * additive rather than load-bearing.
 *
 * iOS realities this is built around:
 *  - The audio session unlocks only inside a user gesture, and is lost on
 *    reload. Never reload after arming.
 *  - navigator.vibrate does not exist in Safari at all. The ringtone is the only
 *    signal, so the ring switch must be on and the volume up.
 *  - Wake Lock needs a secure context, which the tunnel provides and a plain
 *    http LAN address does not. Auto-Lock Never is the real insurance.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_LINES } from '@/lib/voice';

interface Escalation {
  incidentId: string;
  propertyName: string;
  unit: string;
  threat: number;
  behavior: string;
  personCount: number;
  leaseState: string;
  turnoverDay: number | null;
}

type Phase = 'idle' | 'standby' | 'ringing' | 'answered' | 'closed';

const DEMO_COUNTDOWN_MS = 45_000;

export default function OnCallPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  /** Separate from phase so the SSE subscription is not torn down on every ring. */
  const [armed, setArmed] = useState(false);
  const [incident, setIncident] = useState<Escalation | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const ctxRef = useRef<AudioContext | null>(null);
  const ringTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scriptRef = useRef<HTMLAudioElement | null>(null);
  const closeRef = useRef<HTMLAudioElement | null>(null);

  /* ---------- ringtone, synthesised so there is no asset to miss ---------- */

  const ringOnce = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, now);

    // US ringback is a 440 Hz and 480 Hz pair, two seconds on.
    [440, 480].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 2);
    });

    gain.gain.linearRampToValueAtTime(0.5, now + 0.04);
    gain.gain.setValueAtTime(0.5, now + 1.9);
    gain.gain.linearRampToValueAtTime(0, now + 2);
  }, []);

  const startRinging = useCallback(() => {
    setPhase('ringing');
    ringOnce();
    if (ringTimer.current) clearInterval(ringTimer.current);
    ringTimer.current = setInterval(ringOnce, 4000);
    // A no-op on iOS, harmless on Android.
    try {
      navigator.vibrate?.([400, 200, 400]);
    } catch {
      /* not supported */
    }
  }, [ringOnce]);

  const stopRinging = useCallback(() => {
    if (ringTimer.current) clearInterval(ringTimer.current);
    ringTimer.current = null;
  }, []);

  /* ---------- arming: one gesture unlocks everything ---------- */

  const arm = useCallback(async () => {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      await ctx.resume();
      // A single silent frame is what actually unlocks the session.
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      ctxRef.current = ctx;
    } catch {
      setNote('Audio session could not be unlocked — check the ring switch.');
    }

    // Unlock the two MP3 elements in the same gesture.
    for (const [ref, file] of [
      [scriptRef, VOICE_LINES.callScript.file],
      [closeRef, VOICE_LINES.callClose.file],
    ] as const) {
      try {
        const audio = new Audio(file);
        audio.preload = 'auto';
        // Not in the HTMLAudioElement type, but Safari honours the attribute.
        audio.setAttribute('playsinline', '');
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        ref.current = audio;
      } catch {
        ref.current = null; // speechSynthesis covers it
      }
    }

    try {
      const wl = (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<unknown> } }).wakeLock;
      await wl?.request('screen');
    } catch {
      /* Auto-Lock Never is the real answer */
    }

    setPhase('standby');
    setArmed(true);

    if (new URLSearchParams(window.location.search).get('demo') === '1') {
      setIncident({
        incidentId: 'WSO-DEMO-0001',
        propertyName: 'Maple Grove Apartments',
        unit: '4B',
        threat: 4,
        behavior: 'attempting door, no uniform',
        personCount: 1,
        leaseState: 'vacant',
        turnoverDay: 12,
      });
      setTimeout(startRinging, DEMO_COUNTDOWN_MS);
      setNote(`Offline rehearsal mode — ringing in ${DEMO_COUNTDOWN_MS / 1000}s`);
    }
  }, [startRinging]);

  /* ---------- SSE: the phone's only subscription ---------- */

  useEffect(() => {
    if (!armed) return;
    if (new URLSearchParams(window.location.search).get('demo') === '1') return;

    const es = new EventSource('/api/oncall/stream');

    es.addEventListener('escalation', (e) => {
      try {
        setIncident(JSON.parse((e as MessageEvent).data) as Escalation);
        setChosen(null);
        startRinging();
      } catch {
        /* malformed event */
      }
    });

    es.addEventListener('disposition', () => {
      // Phonely may have collected the digit first. Stand down quietly.
      stopRinging();
      setPhase((p) => (p === 'answered' ? p : 'closed'));
    });

    es.addEventListener('standby', () => {
      stopRinging();
      setChosen(null);
      setIncident(null);
      setPhase('standby');
    });

    return () => es.close();
  }, [armed, startRinging, stopRinging]);

  useEffect(() => () => stopRinging(), [stopRinging]);

  /* ---------- answering ---------- */

  const answer = useCallback(async () => {
    stopRinging();
    setPhase('answered');
    const audio = scriptRef.current;
    if (audio) {
      try {
        audio.currentTime = 0;
        await audio.play();
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      const u = new SpeechSynthesisUtterance(VOICE_LINES.callScript.text);
      u.rate = 0.95;
      speechSynthesis.speak(u);
    } catch {
      /* the buttons are numbered to match, so silence is survivable */
    }
  }, [stopRinging]);

  const choose = useCallback(
    async (digit: 1 | 2 | 3) => {
      setChosen(digit);
      try {
        scriptRef.current?.pause();
      } catch {
        /* ignore */
      }

      try {
        await fetch('/api/disposition', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            incidentId: incident?.incidentId,
            digit,
            source: 'warden_mobile',
          }),
        });
      } catch {
        setNote('Could not reach the server — say the decision out loud.');
      }

      if (digit === 3) {
        const closer = closeRef.current;
        if (closer) {
          try {
            closer.currentTime = 0;
            await closer.play();
          } catch {
            /* ignore */
          }
        } else {
          try {
            speechSynthesis.speak(new SpeechSynthesisUtterance(VOICE_LINES.callClose.text));
          } catch {
            /* ignore */
          }
        }
      }

      setTimeout(() => setPhase('closed'), 1200);
    },
    [incident],
  );

  /* ---------- render ---------- */

  if (phase === 'idle') {
    return (
      <main className="oncall">
        <div className="oncall-standby">WARDEN OPS · ON-CALL DEVICE</div>
        <button className="oncall-arm" onClick={() => void arm()}>
          GO ON DUTY
        </button>
        <div className="oncall-standby" style={{ fontSize: 11, maxWidth: 330 }}>
          Ring switch ON · volume up · Auto-Lock NEVER · Do Not Disturb ON
          <br />
          Do not reload this page after arming.
        </div>
      </main>
    );
  }

  if (phase === 'ringing') {
    return (
      <div className="oncall-ring">
        <div>
          <div className="oncall-caller">WARDEN OPS</div>
          <div className="oncall-callee">
            {incident ? `${incident.propertyName} — Unit ${incident.unit}` : 'Priority alert'}
          </div>
          <div className="oncall-standby" style={{ marginTop: 18, fontSize: 12 }}>
            INCOMING PRIORITY ALERT
          </div>
        </div>
        <div className="oncall-circles">
          <button className="circle circle-decline" onClick={() => setPhase('closed')}>
            DECLINE
          </button>
          <button className="circle circle-accept" onClick={() => void answer()}>
            ANSWER
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'answered') {
    return (
      <main className="oncall">
        <div className="oncall-standby">
          {incident ? `${incident.propertyName} · Unit ${incident.unit}` : 'Priority alert'}
          <br />
          THREAT {incident?.threat ?? 4} · {incident?.behavior ?? 'person at entry'}
        </div>
        <div className="oncall-choice">
          <button className="choice-btn" onClick={() => void choose(1)} disabled={chosen !== null}>
            <span className="choice-digit">1</span> DISPATCH GUARD
          </button>
          <button className="choice-btn" onClick={() => void choose(2)} disabled={chosen !== null}>
            <span className="choice-digit">2</span> NOTIFY POLICE
          </button>
          <button className="choice-btn" onClick={() => void choose(3)} disabled={chosen !== null}>
            <span className="choice-digit">3</span> DISMISS
          </button>
        </div>
        {chosen && <div className="oncall-standby">RECORDED — PRESSED {chosen}</div>}
        {note && <div className="oncall-standby" style={{ fontSize: 11 }}>{note}</div>}
      </main>
    );
  }

  if (phase === 'closed') {
    return (
      <main className="oncall">
        <div className="oncall-standby">
          CALL ENDED
          <br />
          {chosen ? `LOGGED — PRESSED ${chosen}` : 'NO ACTION RECORDED'}
          <br />
          EVIDENCE REPORT ON DASHBOARD
        </div>
        <button className="oncall-arm" style={{ fontSize: 13 }} onClick={() => setPhase('standby')}>
          BACK ON DUTY
        </button>
      </main>
    );
  }

  return (
    <main className="oncall">
      <div className="oncall-standby">
        WARDEN OPS
        <br />
        ON CALL
        <br />
        MAPLE GROVE RESIDENTIAL (14 PROPERTIES)
      </div>
      <div className="oncall-standby" style={{ fontSize: 11, color: '#3d4650' }}>
        {note || 'Standing by for escalation'}
      </div>
    </main>
  );
}
