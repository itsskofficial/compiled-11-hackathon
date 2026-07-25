# Product captures — for the edit

Four screen-capture segments from `voiceover.md` §4. Mix these with the Higgsfield clips; do not re-record VO until picture is locked.

## Files (use the `.mp4`s)

| File | VO segment | Duration | What it shows |
|---|---|---|---|
| `01-dashboard-at-rest.mp4` | §4.1 · 0:10–0:20 | ~13s | Idle dashboard, six properties, Maple Grove 4B armed, live tile, SIMULATED tag |
| `02-detection-threat-card.mp4` | §4.2 · 0:32–0:47 | ~24s | Gate → scan → threat card with live Claude classification → voice-down → calling |
| `03-call-resolves.mp4` | §4.3 · 1:05–1:15 | ~19s | Three options on the on-call mirror → `DISMISSED BY MANAGER` |
| `04-incident-report.mp4` | §4.4 · 1:15–1:38 | ~40s | Click INCIDENT REPORT → white evidence doc → slow scroll → hold on attestation |

`.webm` originals are also here if you prefer them.

## FILL values for the VO (from segment 2 — the detection take)

Read these into the narration. Do **not** invent a different behavior string.

| Placeholder | Value |
|---|---|
| Threat level | **THREAT 4** |
| Behavior string | **approaching rear door, reaching for handle, vacant unit at night** |
| Case number | **WSO-2026-0724-0041** |

## Edit notes

- Trim handles freely — every clip is longer than the VO slot on purpose.
- Segment 2 starts a few seconds before the card lands so you have room for the 1s silence beat.
- Segment 4 opens on the dashboard with the button click, then cuts to the white report. Scroll lands on the attestation for the last line.
- The figure inside the camera tile is a capture stand-in (silhouette). Cut wide Higgsfield exterior coverage around it; never claim Claude classified the Higgsfield wide shots.
- Re-record any segment: `cd warden && node scripts/record-product.mjs` (all four) or `node scripts/record-report-only.mjs` (report only). Dev server must be running.
