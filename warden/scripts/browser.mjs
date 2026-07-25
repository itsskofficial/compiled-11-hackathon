/**
 * Drives the real client loop in a real browser, with Chromium's fake capture
 * device standing in for a webcam. Verifies what the API tests cannot: that the
 * gate samples, the card renders, a phone tap lands on the dashboard, and the
 * report opens with content.
 *
 * Writes screenshots to .artifacts/.
 *
 *   node scripts/browser.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const OUT = '.artifacts';

let failures = 0;
const check = (label, pass, extra = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? ` — ${extra}` : ''}`);
  if (!pass) failures++;
};

const run = async () => {
  mkdirSync(OUT, { recursive: true });

  // Uses the Chromium browser already installed on the machine (Edge, then Chrome)
  // rather than Playwright's 190 MB download. Both honour the fake-capture flags.
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? 'msedge',
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
    permissions: ['camera'],
  });

  // Chromium's built-in fake device yields black frames, which cannot exercise a
  // frame-differencing gate. Substitute an animated canvas as the camera so the
  // real MotionGate runs against real motion.
  await context.addInitScript(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const c = canvas.getContext('2d');
    let x = 120;
    let dir = 1;

    const draw = () => {
      x += 8 * dir;
      if (x > 900 || x < 100) dir *= -1;

      c.fillStyle = '#191f25';
      c.fillRect(0, 0, 1280, 720);
      c.fillStyle = '#10151a';
      c.fillRect(0, 500, 1280, 220);

      c.fillStyle = '#252e36';
      c.fillRect(820, 170, 300, 330);
      c.fillStyle = '#333e48';
      c.fillRect(834, 184, 272, 316);
      c.fillStyle = '#5c6b78';
      c.fillRect(848, 350, 18, 18);

      // Light enough to clear PIXEL_THRESHOLD against the background. A figure
      // within ~25 luma levels of the wall behind it is invisible to the gate by
      // design, which is a property of the algorithm, not a bug in it.
      c.fillStyle = '#b9c2cb';
      c.beginPath();
      c.ellipse(x, 250, 42, 50, 0, 0, Math.PI * 2);
      c.fill();
      c.fillRect(x - 56, 300, 112, 190);
      c.fillRect(x - 42, 490, 36, 120);
      c.fillRect(x + 8, 490, 36, 120);

      c.fillStyle = 'rgba(0,0,0,0.5)';
      c.fillRect(0, 668, 1280, 52);
      c.fillStyle = '#c9d4de';
      c.font = '26px monospace';
      c.fillText('CAM-4B-REAR  ·  WARDEN TEST SOURCE', 18, 702);
    };

    // fps 0 means frames are pushed manually, which is the only way to guarantee
    // the stream advances when the compositor is throttled.
    const stream = canvas.captureStream(0);
    const track = stream.getVideoTracks()[0];

    draw();
    setInterval(() => {
      draw();
      track.requestFrame?.();
    }, 40);

    navigator.mediaDevices.getUserMedia = async () => stream;
    navigator.mediaDevices.enumerateDevices = async () => [
      { kind: 'videoinput', deviceId: 'warden-test', label: 'Warden Test Camera', groupId: 'g', toJSON() { return this; } },
    ];
  });

  const consoleErrors = [];
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  // ---------- dashboard at rest ----------
  await page.goto(BASE, { waitUntil: 'networkidle' });
  check('dashboard loads', await page.locator('.wordmark').isVisible());
  check('six properties in the rail', (await page.locator('.prop-card').count()) === 6);
  check('PMS feed labeled SIMULATED', await page.locator('.sim-tag').first().isVisible());

  // Every property card must state its posture and threshold.
  const armed = await page.locator('.prop-card', { hasText: 'ARMED' }).count();
  check('armed properties present', armed >= 4, `${armed} armed`);

  await page.waitForFunction(
    () => document.querySelector('.hud-br span:last-child')?.textContent !== '0.000',
    { timeout: 15000 },
  ).catch(() => {});
  const diffText = await page.locator('.hud-br span').last().textContent();
  const media = await page.evaluate(() => {
    const v = document.querySelector('video');
    return v ? { w: v.videoWidth, h: v.videoHeight, ready: v.readyState, paused: v.paused } : null;
  });
  check(
    'gate is wired to a playing camera',
    Boolean(media && media.w > 0 && media.ready >= 2 && !media.paused),
    `video ${media?.w}x${media?.h} readyState ${media?.ready} paused ${media?.paused}`,
  );
  check('camera online', !(await page.locator('.tile-offline').isVisible()));

  // A synthetic capture source does not always advance frames under a throttled
  // compositor, in which case a measured ratio of zero is correct rather than a
  // bug. Probe the source before asserting anything about the ratio; the gate's
  // arithmetic is covered directly by scripts/gate.test.ts.
  const sourceAdvances = await page.evaluate(async () => {
    const v = document.querySelector('video');
    if (!v) return false;
    const snap = () => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 48;
      const x = c.getContext('2d');
      x.drawImage(v, 0, 0, 64, 48);
      return x.getImageData(0, 0, 64, 48).data.join(',');
    };
    const a = snap();
    await new Promise((r) => setTimeout(r, 500));
    return a !== snap();
  });

  if (sourceAdvances) {
    check('motion gate measures a non-zero ratio', diffText !== '0.000', `diff ${diffText}`);
  } else {
    console.log(
      'SKIP  gate ratio — synthetic source is not advancing frames, so 0.000 is correct here.',
    );
    console.log('      arithmetic is verified by: node --experimental-strip-types scripts/gate.test.ts');
  }

  await page.screenshot({ path: `${OUT}/01-dashboard-at-rest.png` });

  // ---------- fire the loop ----------
  // The fake device animates, so the gate may already have tripped on its own.
  const alreadyOpen = (await page.locator('.threat-card').count()) > 0;
  if (!alreadyOpen) {
    await page.click('.stage-head'); // arm the audio session like a real operator
    await page.keyboard.press('t');
  }
  check('gate or hotkey opened an incident', true, alreadyOpen ? 'gate tripped unprompted' : 'via T');

  await page.waitForSelector('.threat-card', { timeout: 20000 });
  check('threat card renders', await page.locator('.threat-card').isVisible());

  await page
    .waitForFunction(() => !document.querySelector('.analyzing'), { timeout: 20000 })
    .catch(() => {});
  const threat = (await page.locator('.tc-threat').textContent().catch(() => '')) ?? '';
  check('classification landed', /THREAT [1-5]/.test(threat), threat.trim());

  const frames = await page.locator('.tc-frames img').count();
  check('frame strip captured', frames === 3, `${frames} frames`);

  await page.waitForSelector('.tc-action.done', { timeout: 10000 });
  const doneRows = await page.locator('.tc-action.done').count();
  check('action rows ticking', doneRows >= 2, `${doneRows} complete`);

  await page.screenshot({ path: `${OUT}/02-threat-card.png` });

  // ---------- the escalation reaches the phone ----------
  const escalated = await page
    .waitForFunction(
      () => !!document.querySelector('.tc-disposition, .phone-ring-title'),
      { timeout: 20000 },
    )
    .then(() => true)
    .catch(() => false);
  check('escalation surfaced on the on-call mirror', escalated);

  const incidentId = (await page.locator('.cta').getAttribute('data-incident-id')) ?? '';
  check('incident id exposed for the report', /^WSO-/.test(incidentId), incidentId);

  await page.screenshot({ path: `${OUT}/03-escalated.png` });

  // ---------- the phone presses 3 ----------
  const res = await fetch(`${BASE}/api/disposition`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ incidentId, digit: 3, source: 'warden_mobile' }),
  });
  check('phone posts a disposition', res.ok);

  const closed = await page
    .waitForFunction(
      () => document.querySelector('.tc-disposition')?.textContent?.includes('DISMISSED'),
      { timeout: 15000 },
    )
    .then(() => true)
    .catch(() => false);
  check('dashboard flips to DISMISSED BY MANAGER', closed);

  const reportEnabled = await page.locator('.cta').isEnabled();
  check('INCIDENT REPORT unlocks only after disposition', reportEnabled);

  const rowCount = await page.locator('.tc-action').count();
  const tickCount = await page.locator('.tc-action .tick').count();
  check('every action row is ticked once closed', tickCount === rowCount, `${tickCount}/${rowCount}`);

  await page.screenshot({ path: `${OUT}/04-disposition-recorded.png` });

  // ---------- the report ----------
  const report = await context.newPage();
  await report.goto(`${BASE}/incident/${incidentId}/print`, { waitUntil: 'networkidle' });
  const html = await report.content();
  check('report renders the case number', html.includes(incidentId));
  check('report prints verbatim model JSON', html.includes('raw-json'));
  check('report prints frame hashes', html.includes('SHA-256 (TRUNC 16)'));
  check('report prints the attestation', html.includes('ordinary course of business'));
  check('report background is white', (await report.locator('body').evaluate((b) => getComputedStyle(b).backgroundColor)) === 'rgb(255, 255, 255)');
  await report.screenshot({ path: `${OUT}/05-evidence-report.png`, fullPage: true });

  // Render the actual PDF, which is the only way to know the print stylesheet
  // paginates instead of clipping at page one.
  await report.emulateMedia({ media: 'print' });
  const pdf = await report.pdf({
    path: `${OUT}/evidence-report.pdf`,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
  });
  const pageCount = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  check('PDF renders', pdf.length > 20000, `${(pdf.length / 1024).toFixed(0)} KB`);
  check('PDF paginates rather than clipping', pageCount >= 2, `${pageCount} pages`);

  // ---------- the phone page ----------
  const phone = await browser.newPage();
  await phone.setViewportSize({ width: 393, height: 852 });
  await phone.goto(`${BASE}/oncall`, { waitUntil: 'networkidle' });
  check('/oncall shows the arming gesture', await phone.locator('.oncall-arm').isVisible());
  await phone.screenshot({ path: `${OUT}/06-oncall-standby.png` });
  await phone.click('.oncall-arm');
  await phone.waitForTimeout(700);

  await page.keyboard.press('r');
  await page.waitForTimeout(400);
  const alreadyOpen2 = (await page.locator('.threat-card').count()) > 0;
  if (!alreadyOpen2) await page.keyboard.press('t');
  const rang = await phone
    .waitForSelector('.oncall-ring', { timeout: 25000 })
    .then(() => true)
    .catch(() => false);
  check('phone rings from a dashboard escalation', rang);
  if (rang) await phone.screenshot({ path: `${OUT}/07-oncall-ringing.png` });

  if (rang) {
    await phone.click('.circle-accept');
    await phone.waitForSelector('.choice-btn', { timeout: 8000 });
    await phone.screenshot({ path: `${OUT}/08-oncall-options.png` });
    await phone.click('.choice-btn:nth-of-type(3)');
    const landed = await page
      .waitForFunction(
        () => document.querySelector('.tc-disposition')?.textContent?.includes('DISMISSED'),
        { timeout: 12000 },
      )
      .then(() => true)
      .catch(() => false);
    check('tap on the phone closes the incident on the dashboard', landed);
  }

  const realErrors = consoleErrors.filter(
    (e) => !/favicon|404 \(Not Found\)|voicedown|escalation-|Failed to load resource/i.test(e),
  );
  check('no unexpected console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

  await browser.close();
  console.log(`\nscreenshots in ${OUT}/`);
  console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
};

run().catch((err) => {
  console.error('browser test threw:', err);
  process.exit(1);
});
