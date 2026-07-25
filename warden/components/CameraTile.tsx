'use client';

/**
 * The live tile: webcam, the motion gate, and the HUD.
 *
 * The frame-diff sparkline is not decoration. It lets a viewer see the gate
 * working, and it means a paused frame of the recording still explains itself.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MotionGate } from '@/lib/motion';
import { useWarden } from '@/lib/store';
import { clockWithZone } from '@/lib/time';
import type { PropertyRef } from '@/lib/types';

interface Props {
  property: PropertyRef;
  onVideo: (el: HTMLVideoElement | null) => void;
  onTrigger: () => void;
}

export default function CameraTile({ property, onVideo, onTrigger }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const gateRef = useRef<MotionGate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState<string>('');

  const cameraOnline = useWarden((s) => s.cameraOnline);
  const scanning = useWarden((s) => s.scanning);
  const diffHistory = useWarden((s) => s.diffHistory);
  const liveDiff = useWarden((s) => s.liveDiff);
  const diffRatio = useWarden((s) => s.diffRatio);
  const setCamera = useWarden((s) => s.setCamera);
  const pushDiff = useWarden((s) => s.pushDiff);

  // Rendered only after mount so the server and client markup agree.
  useEffect(() => {
    const tick = () => setClock(clockWithZone());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const triggerRef = useRef(onTrigger);
  triggerRef.current = onTrigger;

  const start = useCallback(async () => {
    // R1: the wrong camera on the demo machine is a real failure mode. Pin the
    // device id in .env.local once it is known.
    const pinnedId = process.env.NEXT_PUBLIC_CAMERA_DEVICE_ID;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: pinnedId
          ? { deviceId: { exact: pinnedId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const track = stream.getVideoTracks()[0];
      setCamera(true, track?.label || 'camera');
      onVideo(video);
      setError(null);

      gateRef.current?.stop();
      const gate = new MotionGate({
        video,
        getThreshold: () => useWarden.getState().diffRatio,
        onSample: (r) => pushDiff(r),
        onTrigger: () => triggerRef.current(),
      });
      gate.start();
      gateRef.current = gate;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'camera unavailable';
      setError(message);
      setCamera(false, 'offline');
      onVideo(null);
    }
  }, [onVideo, pushDiff, setCamera]);

  useEffect(() => {
    void start();
    return () => {
      gateRef.current?.stop();
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [start]);

  const max = Math.max(diffRatio * 2.2, ...diffHistory, 0.02);

  return (
    <div className="tile">
      <video ref={videoRef} muted playsInline autoPlay />

      {!cameraOnline && (
        <div className="tile-offline">
          <div>CAMERA OFFLINE — {property.cameraId}</div>
          {error && <div style={{ color: '#5b6672', maxWidth: 420 }}>{error}</div>}
          <button
            className="chip"
            style={{ cursor: 'pointer', padding: '7px 12px' }}
            onClick={() => void start()}
          >
            RETRY CAMERA
          </button>
          <div style={{ color: '#5b6672' }}>Press D to run a pre-captured incident</div>
        </div>
      )}

      <div className="hud">
        <div className="hud-tl">
          {property.propertyName} · {property.unit}
          <span style={{ color: '#7d8896' }}>  ·  {property.cameraId}</span>
        </div>

        <div className="hud-tr">
          <span className="rec-dot" />
          <span>REC</span>
          <span style={{ color: '#7d8896' }}>{clock}</span>
        </div>

        <div className="hud-bl">
          {property.leaseState.replace('_', ' ').toUpperCase()}
          {property.turnoverDay ? ` · TURNOVER DAY ${property.turnoverDay}` : ''}
        </div>

        <div className="hud-br">
          <span>GATE</span>
          <span className="sparkline">
            {diffHistory.map((v, i) => (
              <span
                key={i}
                className={`spark-bar${v > diffRatio ? ' hot' : ''}`}
                style={{ height: `${Math.min(100, (v / max) * 100)}%` }}
              />
            ))}
          </span>
          <span style={{ minWidth: 46, textAlign: 'right' }}>{liveDiff.toFixed(3)}</span>
        </div>
      </div>

      {scanning && <div className="scan" />}
    </div>
  );
}
