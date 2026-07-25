# Warden

AI security operations for real estate portfolios. A vacant unit sees motion, the
system decides what it is, talks the intruder down, wakes the on-call manager, and
closes the incident with a labeled outcome and a court-ready evidence report.

**For setup, keys, and everything that needs a human, read `../SETUP.md`.** This
file is the code tour.

```bash
npm run dev     # then open http://localhost:3000 and press T
npm run verify  # typecheck + four test suites
```

It runs with zero configuration. Without `ANTHROPIC_API_KEY` the classifier
returns a canned assessment that the evidence report explicitly discloses as a
fallback; everything else works identically.

## The loop

```
motion gate -> 3 frames -> Claude vision -> threat score
   -> below threshold: closed [false_alarm]
   -> at or above:     voice-down -> escalation -> phone -> closed [disposition]
```

`lib/pipeline.ts` is that sequence, top to bottom, in one file. Start there.

## Layout

| Path | What it is |
|---|---|
| `lib/types.ts` | Shared types, posture map, escalation thresholds |
| `lib/pipeline.ts` | The loop. The single place sequencing lives |
| `lib/motion.ts` | Frame-differencing gate. `changedRatio` is pure and unit-tested |
| `lib/incident.ts` | Lifecycle as pure functions. `closeIncident` is the only close path |
| `lib/store.ts` | All dashboard state, one zustand store |
| `lib/incidentServer.ts` | The only server state: incident mirror, SSE, dispositions |
| `app/api/classify` | Frames to Anthropic with a strict tool schema. Never returns non-200 |
| `app/oncall` | The on-call device. Rings, answers, three buttons |
| `app/incident/[id]/print` | The evidence report. Never cut |
| `components/Dashboard.tsx` | Three columns, hotkeys, composition |

## Things that look odd and are deliberate

- **The dashboard has no event bus.** Camera, gate, and UI share one browser tab,
  so state is one store. The server exists to hold the API key, mirror incidents
  for the print route, and relay one escalation event to the phone.
- **`/api/classify` never returns an error status.** On a missing key, a model
  failure, or the 6s timeout it answers with a canned assessment. The audience
  never sees a stack trace and the client has no failure branch.
- **The escalation call is fired, never awaited.** Awaiting it would stall the
  dashboard's disposition polling behind an 8-second webhook.
- **The escalation threshold is per-property.** Lease state gives posture gives
  threshold. A vacant unit escalates at 3, an occupied one at 4. Never hardcode it.
- **Every timestamp is an offset-bearing ISO string.** The report prints timezones;
  `Date` objects and epochs are not allowed to enter the model.
- **ESLint is off on purpose.** `npm run typecheck` is the gate.

## Verification

| Command | Covers |
|---|---|
| `npm run test:gate` | The gate's arithmetic and its default threshold, with no browser |
| `npm run test:api` | Incident mirror, escalation, disposition, full report contents |
| `npm run test:sse` | The laptop to phone push |
| `npm run test:browser` | The real loop in a real browser, plus a rendered PDF |

`test:api`, `test:sse`, and `test:browser` need `npm run dev` running.
`test:browser` drives the installed Edge or Chrome and writes screenshots and a
sample PDF to `.artifacts/`.

The one invariant worth protecting: **`closeIncident()` in `lib/incident.ts` is the
only path to a closed incident.** That is what makes "every incident has a
disposition" a property of the code rather than a claim on a slide.
