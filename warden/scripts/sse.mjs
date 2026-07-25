/**
 * Verifies the one channel that must be pushed: laptop -> server -> phone.
 * Subscribes like /oncall does, escalates, and asserts the event arrives.
 */

const BASE = process.env.BASE ?? 'http://localhost:3000';

const incident = {
  id: 'WSO-2026-0724-0099',
  property: {
    propertyId: 'PROP-MAPLE-GROVE-4B',
    propertyName: 'Maple Grove Apartments',
    unit: '4B',
    addressLine: '1841 Maple Grove Terrace',
    cityStateZip: 'Sacramento, CA 95818',
    ownerOfRecord: 'Maple Grove Residential Holdings, LLC',
    managingAgent: 'Northbridge Property Management',
    leaseState: 'vacant',
    turnoverDay: 12,
    turnoverLength: 21,
    cameraId: 'CAM-4B-REAR',
    detail: 'Turnover day 12 of 21',
    timezone: 'America/Los_Angeles',
  },
  state: 'escalated',
  openedAt: new Date().toISOString(),
  timezone: 'America/Los_Angeles',
  cameraId: 'CAM-4B-REAR',
  threat: 4,
  classifications: [
    {
      at: new Date().toISOString(),
      model: 'claude-sonnet-5',
      personDetected: true,
      personCount: 1,
      behavior: 'attempting door, no uniform',
      uniformed: false,
      threat: 4,
      rationale: 'test',
      raw: {},
    },
  ],
  frames: [],
  actions: [],
};

const run = async () => {
  const res = await fetch(`${BASE}/api/oncall/stream`, { headers: { accept: 'text/event-stream' } });
  if (!res.ok || !res.body) {
    console.log(`FAIL  stream did not open — status ${res.status}`);
    process.exit(1);
  }
  console.log('PASS  GET  /api/oncall/stream opened');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const seen = [];

  const pump = (async () => {
    while (seen.length < 3) {
      const { value, done } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      for (const m of text.matchAll(/^event: (\w+)/gm)) seen.push(m[1]);
    }
  })();

  await new Promise((r) => setTimeout(r, 400));

  await fetch(`${BASE}/api/escalate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ incident }),
  });

  await new Promise((r) => setTimeout(r, 400));

  await fetch(`${BASE}/api/disposition`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ incidentId: incident.id, digit: 3, source: 'warden_mobile' }),
  });

  await Promise.race([pump, new Promise((r) => setTimeout(r, 4000))]);
  await reader.cancel().catch(() => {});
  await fetch(`${BASE}/api/escalate`, { method: 'DELETE' });

  const checks = [
    ['ready handshake on connect', seen.includes('ready')],
    ['escalation event pushed to phone', seen.includes('escalation')],
    ['disposition event pushed to phone', seen.includes('disposition')],
  ];

  let failures = 0;
  for (const [label, pass] of checks) {
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}`);
    if (!pass) failures++;
  }
  console.log(`\nevents received: ${seen.join(', ') || 'none'}`);
  console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
};

run().catch((err) => {
  console.error('sse test threw:', err);
  process.exit(1);
});
