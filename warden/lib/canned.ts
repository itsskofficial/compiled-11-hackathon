/**
 * The silent fallback. trd.md §4.2 and §4.4.
 *
 * Two jobs. First, when the vision call fails or exceeds its 6-second budget,
 * this is what fills the threat card — the audience must never see a raw error,
 * only a slightly less specific behaviour string. Second, the `D` hotkey uses it
 * to complete the whole loop with no camera and no network.
 *
 * The canned assessment is disclosed in Classification.raw, so the evidence
 * report tells the truth about its own provenance rather than passing a
 * placeholder off as a live inference.
 */

import { sha256OfDataUri } from './hash';
import { isoWithOffset } from './time';
import type { Classification, EvidenceFrame } from './types';

export function cannedClassification(model: string, reason: string): Classification {
  const at = isoWithOffset();
  return {
    at,
    model,
    personDetected: true,
    personCount: 1,
    behavior: 'person at entry, interacting with door',
    uniformed: false,
    threat: 4,
    rationale:
      'A single adult is present at the entry and in contact with the door. No uniform, marked vehicle, or visible credential. The unit is unoccupied, which raises the significance of any interaction with the structure.',
    raw: {
      source: 'warden_canned_assessment',
      reason,
      note: 'Live model assessment unavailable at capture time. This record is a system-generated conservative assessment, disclosed as such.',
      person_detected: true,
      person_count: 1,
      behavior: 'person at entry, interacting with door',
      uniformed: false,
      threat: 4,
    },
    fallback: true,
  };
}

/**
 * Synthetic frames so `D` works with no camera at all. Deliberately plain: a
 * dark scene, a door, a figure that moves between frames. Used only when no real
 * frames have been captured this session.
 */
export async function makeSyntheticFrames(cameraId: string): Promise<EvidenceFrame[]> {
  const W = 320;
  const H = 240;
  const frames: EvidenceFrame[] = [];

  for (let i = 0; i < 3; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const c = canvas.getContext('2d');
    if (!c) continue;

    c.fillStyle = '#14181c';
    c.fillRect(0, 0, W, H);

    // wall and ground
    c.fillStyle = '#1b2127';
    c.fillRect(0, 0, W, 168);
    c.fillStyle = '#101418';
    c.fillRect(0, 168, W, H - 168);

    // doorway
    c.fillStyle = '#242c33';
    c.fillRect(196, 62, 74, 106);
    c.fillStyle = '#2f3941';
    c.fillRect(200, 66, 66, 98);
    c.fillStyle = '#5c6b78';
    c.fillRect(204, 112, 5, 5);

    // porch light falloff
    const grad = c.createRadialGradient(233, 52, 4, 233, 52, 120);
    grad.addColorStop(0, 'rgba(255,236,190,0.20)');
    grad.addColorStop(1, 'rgba(255,236,190,0)');
    c.fillStyle = grad;
    c.fillRect(120, 0, 200, 200);

    // figure, closing on the door across the three frames
    const x = 168 - i * 14;
    c.fillStyle = '#0b0e11';
    c.beginPath();
    c.ellipse(x, 92, 10, 12, 0, 0, Math.PI * 2); // head
    c.fill();
    c.fillRect(x - 13, 104, 26, 48); // torso
    c.fillRect(x - 10, 152, 9, 34); // legs
    c.fillRect(x + 2, 152, 9, 34);
    c.fillRect(x + 11, 112, 26, 7); // arm reaching for the handle

    // burn-in
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.fillRect(0, H - 20, W, 20);
    c.fillStyle = '#c9d4de';
    c.font = '11px monospace';
    c.fillText(`${cameraId}  ·  FRAME ${i + 1}/3`, 6, H - 6);

    const dataUri = canvas.toDataURL('image/jpeg', 0.7);
    frames.push({
      id: `FRM-${String(i + 1).padStart(2, '0')}`,
      index: i + 1,
      capturedAt: isoWithOffset(new Date(Date.now() - (2 - i) * 400)),
      cameraId,
      dataUri,
      // Hashed like any other frame, so the report never prints a placeholder.
      sha256: await sha256OfDataUri(dataUri),
      width: W,
      height: H,
      isTriggerFrame: i === 0,
    });
  }

  return frames;
}
