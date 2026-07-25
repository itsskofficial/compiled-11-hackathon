/**
 * Unit test for the motion gate's arithmetic and its default threshold.
 *
 * This exists because the gate cannot be verified through a headless browser: a
 * synthetic capture source does not advance frames, so the measured ratio is
 * legitimately zero there. The arithmetic is pure, so test it directly.
 *
 *   npm run test:gate
 *
 * Named .mts so Node treats it as ESM without a package-level "type" field.
 */

import { changedRatio, MOTION_CONSTANTS, toGrayscale } from '../lib/motion.ts';

const { GRID_W, GRID_H, PIXEL_THRESHOLD } = MOTION_CONSTANTS;
const PIXELS = GRID_W * GRID_H;
const DEFAULT_DIFF_RATIO = 0.025; // the store's default

let failures = 0;
const check = (label: string, pass: boolean, extra = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? ` — ${extra}` : ''}`);
  if (!pass) failures++;
};

/** An RGBA buffer of a dark scene with one bright rectangle in it. */
function scene(rectX: number, rectW: number, rectH: number, luma = 210): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(PIXELS * 4);
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const i = (y * GRID_W + x) * 4;
      const inRect = x >= rectX && x < rectX + rectW && y >= 20 && y < 20 + rectH;
      const v = inRect ? luma : 22;
      rgba[i] = v;
      rgba[i + 1] = v;
      rgba[i + 2] = v;
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

const gray = (rgba: Uint8ClampedArray) => toGrayscale(rgba, PIXELS);

// 1. Grayscale conversion. Sampled inside the bright rectangle, which starts at
//    y = 20, so index into row 30.
const white = gray(scene(0, GRID_W, GRID_H, 255));
const insideRect = 30 * GRID_W + 4;
check('grayscale maps white to ~255', Math.abs(white[insideRect] - 255) < 0.5, white[insideRect].toFixed(2));
check('grayscale maps the dark background to ~22', Math.abs(white[0] - 22) < 0.5, white[0].toFixed(2));
check('grayscale produces one value per pixel', white.length === PIXELS, `${white.length}`);

// 2. A still scene must read as zero. This is the noise floor that decides
//    whether the gate sits quiet on an empty driveway.
const still = gray(scene(40, 20, 60));
check('identical frames give a ratio of exactly 0', changedRatio(still, still) === 0);

// 3. Sub-threshold luma drift — a cloud passing, auto-exposure breathing — must
//    not register. This is the single most important property of the gate.
const dim = gray(scene(40, 20, 60, 210 - (PIXEL_THRESHOLD - 5)));
const drift = changedRatio(still, dim);
check(
  'luma drift below the pixel threshold is ignored',
  drift === 0,
  `ratio ${drift.toFixed(5)} for a ${PIXEL_THRESHOLD - 5}-level shift`,
);

// 4. A person-sized object appearing must clear the default DIFF_RATIO. At
//    160x120 a body occupies roughly 14x60 of the grid.
const empty = gray(scene(-100, 0, 0));
const occupied = gray(scene(70, 14, 60));
const appears = changedRatio(empty, occupied);
check(
  'a person-sized object clears the default DIFF_RATIO',
  appears > DEFAULT_DIFF_RATIO,
  `ratio ${appears.toFixed(4)} vs threshold ${DEFAULT_DIFF_RATIO}`,
);

// 5. A person-sized object moving across the frame must also clear it.
const moved = changedRatio(gray(scene(70, 14, 60)), gray(scene(88, 14, 60)));
check(
  'lateral movement clears the default DIFF_RATIO',
  moved > DEFAULT_DIFF_RATIO,
  `ratio ${moved.toFixed(4)}`,
);

// 6. A small distant object — a cat, a leaf — must stay below it, or the gate
//    burns API calls all night.
const small = changedRatio(empty, gray(scene(70, 4, 6)));
check(
  'a small object stays below the default DIFF_RATIO',
  small < DEFAULT_DIFF_RATIO,
  `ratio ${small.toFixed(5)}`,
);

// 7. Two consecutive samples are required to fire, so a single-frame artifact
//    cannot trigger an incident on its own.
check(
  'gate requires consecutive samples',
  MOTION_CONSTANTS.CONSECUTIVE_SAMPLES >= 2,
  `${MOTION_CONSTANTS.CONSECUTIVE_SAMPLES} samples at ${MOTION_CONSTANTS.SAMPLE_MS}ms`,
);

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
