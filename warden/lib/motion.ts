/**
 * Frame-differencing motion gate. trd.md §4.1.
 *
 * Runs entirely client-side on a hidden canvas. No OpenCV, no Python, and no
 * server round-trip until something actually moves.
 *
 * DIFF_RATIO is the single knob. Stage or room lighting will differ from
 * wherever this was written: too sensitive and it fires on a shadow, too dull
 * and someone walks in unnoticed. It lives in the store so the debug slider can
 * tune it live.
 */

const SAMPLE_MS = 200; // 5 fps
const GRID_W = 160;
const GRID_H = 120;
const PIXEL_THRESHOLD = 25; // of 255
const CONSECUTIVE_SAMPLES = 2;
const DEFAULT_COOLDOWN_MS = 20_000; // one intruder must not fire 40 API calls

/**
 * Rec. 601 luma. Kept pure and exported so the gate's arithmetic can be tested
 * without a camera, a canvas, or a browser — see scripts/gate.test.ts.
 */
export function toGrayscale(rgba: Uint8ClampedArray | Uint8Array, pixels: number): Float32Array {
  const gray = new Float32Array(pixels);
  for (let i = 0, p = 0; p < pixels; i += 4, p++) {
    gray[p] = rgba[i] * 0.299 + rgba[i + 1] * 0.587 + rgba[i + 2] * 0.114;
  }
  return gray;
}

/** Fraction of pixels whose luma moved by more than the threshold. */
export function changedRatio(
  prev: Float32Array,
  next: Float32Array,
  pixelThreshold = PIXEL_THRESHOLD,
): number {
  const total = Math.min(prev.length, next.length);
  if (!total) return 0;
  let changed = 0;
  for (let p = 0; p < total; p++) {
    if (Math.abs(next[p] - prev[p]) > pixelThreshold) changed++;
  }
  return changed / total;
}

export interface MotionGateOptions {
  video: HTMLVideoElement;
  /** Read live so the debug slider takes effect without a restart. */
  getThreshold: () => number;
  onSample?: (ratio: number) => void;
  onTrigger: () => void;
  cooldownMs?: number;
}

export class MotionGate {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private prev: Float32Array | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private consecutive = 0;
  private cooldownUntil = 0;
  private opts: MotionGateOptions;

  constructor(opts: MotionGateOptions) {
    this.opts = opts;
    this.canvas = document.createElement('canvas');
    this.canvas.width = GRID_W;
    this.canvas.height = GRID_H;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.sample(), SAMPLE_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.prev = null;
    this.consecutive = 0;
  }

  /** Suppress the gate for a while — used after a manual trigger too. */
  cooldown(ms = DEFAULT_COOLDOWN_MS) {
    this.cooldownUntil = Date.now() + ms;
    this.consecutive = 0;
  }

  private sample() {
    const { video, getThreshold, onSample, onTrigger } = this.opts;
    if (!this.ctx || video.readyState < 2 || !video.videoWidth) return;

    this.ctx.drawImage(video, 0, 0, GRID_W, GRID_H);
    const { data } = this.ctx.getImageData(0, 0, GRID_W, GRID_H);
    const gray = toGrayscale(data, GRID_W * GRID_H);

    if (!this.prev) {
      this.prev = gray;
      return;
    }

    const ratio = changedRatio(this.prev, gray);
    this.prev = gray;
    onSample?.(ratio);

    if (Date.now() < this.cooldownUntil) return;

    if (ratio > getThreshold()) {
      this.consecutive++;
      if (this.consecutive >= CONSECUTIVE_SAMPLES) {
        this.cooldown();
        onTrigger();
      }
    } else {
      this.consecutive = 0;
    }
  }
}

export const MOTION_CONSTANTS = { SAMPLE_MS, GRID_W, GRID_H, PIXEL_THRESHOLD, CONSECUTIVE_SAMPLES };
