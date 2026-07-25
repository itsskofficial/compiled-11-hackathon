/**
 * Frame capture, at two resolutions on purpose.
 *
 * The API gets 3 JPEGs at 640x480 captured 400ms apart — three rather than one
 * because behaviour is the product. "Attempting door" is a claim about motion
 * across time; a single still can only support "a person is present".
 *
 * The evidence record gets 320px copies, because a full-resolution base64 PNG is
 * multiple megabytes and four of them visibly hang Chrome's print job.
 */

import { sha256OfDataUri } from './hash';
import { isoWithOffset } from './time';
import type { EvidenceFrame } from './types';

const API_W = 640;
const API_H = 480;
const API_QUALITY = 0.7;
const EVIDENCE_W = 320;
const EVIDENCE_QUALITY = 0.7;
const GAP_MS = 400;
const FRAME_COUNT = 3;

export interface CapturedSet {
  /** Data URIs at 640x480 for the vision call. */
  apiFrames: string[];
  /** Downscaled, hashed frames for the incident record and the report. */
  evidence: EvidenceFrame[];
  capturedAt: string;
}

function drawTo(video: HTMLVideoElement, w: number, h: number, quality: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function captureFrames(
  video: HTMLVideoElement,
  cameraId: string,
  count = FRAME_COUNT,
): Promise<CapturedSet> {
  const capturedAt = isoWithOffset();
  const apiFrames: string[] = [];
  const evidence: EvidenceFrame[] = [];

  for (let i = 0; i < count; i++) {
    const at = isoWithOffset();
    apiFrames.push(drawTo(video, API_W, API_H, API_QUALITY));

    const ratio = video.videoHeight && video.videoWidth ? video.videoHeight / video.videoWidth : 0.75;
    const evidenceH = Math.round(EVIDENCE_W * ratio);
    const dataUri = drawTo(video, EVIDENCE_W, evidenceH, EVIDENCE_QUALITY);
    evidence.push({
      id: `FRM-${String(i + 1).padStart(2, '0')}`, // renumbered against the incident id
      index: i + 1,
      capturedAt: at,
      cameraId,
      dataUri,
      sha256: await sha256OfDataUri(dataUri),
      width: EVIDENCE_W,
      height: evidenceH,
      isTriggerFrame: i === 0,
    });

    if (i < count - 1) await wait(GAP_MS);
  }

  return { apiFrames, evidence, capturedAt };
}

/** Ids carry the incident's case number, which does not exist until the incident does. */
export function numberFrames(frames: EvidenceFrame[], incidentId: string): EvidenceFrame[] {
  const suffix = incidentId.slice(-4);
  return frames.map((f, i) => ({ ...f, id: `FRM-${suffix}-${String(i + 1).padStart(2, '0')}` }));
}

export const FRAME_CONSTANTS = { API_W, API_H, EVIDENCE_W, GAP_MS, FRAME_COUNT };
