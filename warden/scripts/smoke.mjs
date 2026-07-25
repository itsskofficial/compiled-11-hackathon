/**
 * End-to-end smoke test of the server-side chain, with no browser involved:
 *   mirror an incident -> escalate -> record a disposition -> render the report
 *
 * Run against a live dev server:  node scripts/smoke.mjs
 */

const BASE = process.env.BASE ?? 'http://localhost:3000';
const ID = 'WSO-2026-0724-0041';

const ok = (label, pass, extra = '') =>
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? ` — ${extra}` : ''}`);

const frame = (i) => ({
  id: `FRM-0041-0${i}`,
  index: i,
  capturedAt: '2026-07-24T21:42:0' + i + '.412-07:00',
  cameraId: 'CAM-4B-REAR',
  dataUri:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmgA//9k=',
  sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  width: 320,
  height: 240,
  isTriggerFrame: i === 1,
});

const action = (kind, channel, summary, actor) => ({
  id: `ACT-${kind}`,
  incidentId: ID,
  at: '2026-07-24T21:42:09.100-07:00',
  kind,
  channel,
  actor,
  summary,
  succeeded: true,
});

const SYSTEM = { kind: 'system', id: 'SYSTEM', displayName: 'Warden Automation' };
const HUMAN = {
  kind: 'human',
  id: 'user_jreyes',
  displayName: 'Jordan Reyes',
  role: 'Regional Operations Manager',
};

const incident = {
  id: ID,
  property: {
    propertyId: 'PROP-MAPLE-GROVE-4B',
    propertyName: 'Maple Grove Apartments',
    unit: '4B',
    addressLine: '1841 Maple Grove Terrace, Building 4',
    cityStateZip: 'Sacramento, CA 95818',
    ownerOfRecord: 'Maple Grove Residential Holdings, LLC',
    managingAgent: 'Northbridge Property Management',
    leaseState: 'vacant',
    turnoverDay: 12,
    turnoverLength: 21,
    lastAuthorizedEntry: { at: '2026-07-22T14:05:00.000-07:00', by: 'Vantage Flooring' },
    cameraId: 'CAM-4B-REAR',
    detail: 'Turnover day 12 of 21',
    timezone: 'America/Los_Angeles',
  },
  state: 'escalated',
  openedAt: '2026-07-24T21:42:07.412-07:00',
  timezone: 'America/Los_Angeles',
  cameraId: 'CAM-4B-REAR',
  threat: 4,
  classifications: [
    {
      at: '2026-07-24T21:42:10.900-07:00',
      model: 'claude-sonnet-5',
      personDetected: true,
      personCount: 1,
      behavior: 'attempting door, no uniform',
      uniformed: false,
      threat: 4,
      rationale: 'One adult in contact with the door. No uniform or marked vehicle visible.',
      raw: { person_detected: true, person_count: 1, behavior: 'attempting door, no uniform', threat: 4 },
    },
  ],
  frames: [frame(1), frame(2), frame(3)],
  actions: [
    action('motion_detected', 'system', 'Motion gate tripped — 3 frames captured', SYSTEM),
    action('vision_classified', 'system', 'Vision assessment — threat 4', SYSTEM),
    action('voice_down', 'speaker', 'Voice deterrent broadcast — MISO ONE', SYSTEM),
    action('escalation_call_placed', 'phonely', 'Escalation call placed via Phonely', SYSTEM),
  ],
  bundleSha256: 'a3f9c1d2e4b5a6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f',
};

const run = async () => {
  let failures = 0;
  const check = (label, pass, extra) => {
    ok(label, pass, extra);
    if (!pass) failures++;
  };

  // 1. mirror
  let res = await fetch(`${BASE}/api/incident/${ID}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(incident),
  });
  check('PUT  /api/incident/[id]', res.ok, `status ${res.status}`);

  // 2. read back
  res = await fetch(`${BASE}/api/incident/${ID}`);
  const readBack = await res.json();
  check('GET  /api/incident/[id]', res.ok && readBack.id === ID);

  // 3. escalate
  res = await fetch(`${BASE}/api/escalate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ incident }),
  });
  const esc = await res.json();
  check('POST /api/escalate', res.ok && esc.ok === true, `phonely: ${esc.call?.detail ?? 'n/a'}`);

  // 4. no disposition yet
  res = await fetch(`${BASE}/api/disposition?incidentId=${ID}`);
  const empty = await res.json();
  check('GET  /api/disposition (empty)', res.ok && !empty.digit);

  // 5. the phone presses 3
  res = await fetch(`${BASE}/api/disposition`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ incidentId: ID, digit: 3, source: 'warden_mobile' }),
  });
  const posted = await res.json();
  check('POST /api/disposition', res.ok && posted.digit === 3);

  // 6. Phonely's shape: form-encoded, no incident id, digit as a spoken word
  res = await fetch(`${BASE}/api/disposition`, {
    method: 'POST',
    body: new URLSearchParams({ dtmf: '3', source: 'phonely' }),
  });
  const phonely = await res.json();
  check('POST /api/disposition (form, no id)', res.ok && phonely.digit === 3, 'falls back to latest escalated');

  // 7. the dashboard poll sees it
  res = await fetch(`${BASE}/api/disposition?incidentId=${ID}`);
  const seen = await res.json();
  check('GET  /api/disposition (polled)', seen.digit === 3);

  // 8. close it and render the report
  const closed = {
    ...incident,
    state: 'closed',
    closedAt: '2026-07-24T21:43:02.000-07:00',
    disposition: 'dismissed_by_manager',
    dispositionAt: '2026-07-24T21:43:02.000-07:00',
    dispositionBy: HUMAN,
    dispositionNote: 'Decision received from on-call manager over warden_mobile.',
  };
  await fetch(`${BASE}/api/incident/${ID}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(closed),
  });

  res = await fetch(`${BASE}/incident/${ID}/print`);
  const html = await res.text();
  check('GET  /incident/[id]/print', res.ok, `status ${res.status}`);

  const must = [
    ['case number', ID],
    ['lease state row', 'TURNOVER, DAY 12 OF 21'],
    ['occupancy row', 'VACANT'],
    ['posture and threshold', 'escalation threshold 3 of 5'],
    ['verbatim model output', 'attempting door, no uniform'],
    ['raw JSON block', 'person_detected'],
    ['frame hash caption', 'SHA-256 (TRUNC 16)'],
    ['unmodified originals note', 'unmodified originals'],
    ['disposition', 'DISMISSED BY MANAGER'],
    ['deciding party', 'Jordan Reyes'],
    ['chain of custody', 'append-only storage'],
    ['retention', 'Retention: 7 years'],
    ['attestation', 'ordinary course of business'],
    ['signature caption', 'Signature'],
    ['timezone on stamps', 'PDT (UTC-07:00)'],
    ['bundle hash', 'a3f9c1d2e4b5a6f7'],
  ];
  for (const [label, needle] of must) {
    check(`report contains ${label}`, html.includes(needle), needle.slice(0, 34));
  }

  // 9. reset clears server state
  res = await fetch(`${BASE}/api/escalate`, { method: 'DELETE' });
  check('DELETE /api/escalate (reset)', res.ok);
  res = await fetch(`${BASE}/api/disposition`);
  const afterReset = await res.json();
  check('disposition cleared after reset', !afterReset.digit);

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
};

run().catch((err) => {
  console.error('smoke test threw:', err);
  process.exit(1);
});
