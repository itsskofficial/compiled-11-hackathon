# SETUP — everything that needs a human

The app is built and it runs. This document is the list of things I could not do
for you, because they need an email inbox, a credit card, a phone, or a webcam.

**Read §0 first.** It tells you what already works with zero configuration, so
you know what you are buying with each step that follows. Nothing below is
required for a working demo except §1, and even §1 has a fallback.

Everything lives in `warden/`. Commands assume you are in that directory.

---

## 0. What works right now, with no keys at all

```bash
cd warden
npm run dev
```

Open <http://localhost:3000>, allow the camera, and press `T`.

You will get the full loop: motion gate, three captured frames, a threat card, a
voice-down through your speakers, an escalation, and a printable evidence report.
The only difference without keys is where the pieces come from:

| Piece | With no keys | With keys |
|---|---|---|
| Threat assessment | Canned assessment, disclosed as such in the report | Live Claude vision call |
| Voice-down | Browser `speechSynthesis` | Pre-rendered Miso One MP3 |
| Escalation call | `/oncall` page on your phone | Real inbound phone call via Phonely |
| Vendor check | "VENDOR CHECK UNAVAILABLE" | Live VOYGR business validation |
| Operator name | Fixture manager, Jordan Reyes | The signed-in Hexclave user |
| Evidence report | Fully working | Identical |

Nothing crashes when a key is absent. Every integration degrades to a labeled
state instead of an error, because a visible stack trace during a take costs more
than a missing feature.

**Verify it yourself.** With `npm run dev` running in a second terminal:

```bash
npm run verify
```

That runs a typecheck plus four suites — 67 checks in total, all passing on a
clean checkout:

| Suite | Checks | What it proves |
|---|---|---|
| `npm run test:gate` | 9 | The motion gate's arithmetic and its default threshold, with no browser involved |
| `npm run test:api` | 26 | Incident mirror, escalation, disposition round trip, and every required section of the report |
| `npm run test:sse` | 4 | The laptop → server → phone push |
| `npm run test:browser` | 28 | The real loop in a real browser: gate samples, card renders, a phone tap closes the incident, and the PDF paginates |

`test:browser` drives the Edge or Chrome already on your machine and writes
screenshots plus a sample `evidence-report.pdf` into `warden/.artifacts/` — worth
opening, because it is what a judge will see.

If a check fails after you change something, the failing line names the endpoint
or the assertion.

---

## 1. REQUIRED — the Anthropic key

This is the one that turns the demo from a replay into a live inference, and it
is the single most important line in the file.

1. Go to <https://console.anthropic.com> → **API Keys** → **Create Key**.
2. Copy it. You cannot view it again.
3. Put it in `warden/.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

4. Restart the dev server. Env changes are not hot-reloaded.

### Confirm the model id

The classify route tries `claude-sonnet-5`, then `claude-sonnet-4-5`, then older
ids, advancing past a 404 automatically — so it works without you doing anything.
If you want to pin one, list what your key can actually see:

```bash
curl https://api.anthropic.com/v1/models \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

Then set `ANTHROPIC_MODEL=` to the exact id you want.

### How to tell it is genuinely live

Press `T` and read the behavior string on the threat card. The canned string is
always exactly `person at entry, interacting with door`. Anything else came from
the model. The report also prints the model id and the verbatim JSON, and it
prints a disclosure line when the fallback produced the assessment.

**Cost:** roughly a cent per trigger. Three frames at 640x480. A whole evening of
rehearsal is well under a dollar.

---

## 2. Miso One voice lines — 15 minutes, high value

The voice-down is the moment the demo stops being a dashboard and starts being a
security product. `speechSynthesis` works, but it sounds like a laptop; Miso
sounds like a building.

Miso open-sourced the 8B weights, but the hosted API is announced and not yet
available — so this is a manual render, which is also what `trd.md` asks for:
pre-render off stage, play back locally.

1. Go to <https://misolabs.ai>.
2. Render each of the four lines in `warden/public/audio/README.md`.
3. Save the MP3s into `warden/public/audio/` under **exactly** these names:
   - `voicedown-primary.mp3`
   - `voicedown-short.mp3`
   - `escalation-script.mp3`
   - `escalation-close.mp3`

No config needed. The app checks for the file, uses it if present, and falls back
silently if not. The action log records which source actually played, so the
report stays truthful either way.

Aim for a calm, institutional delivery. Keep "four-B" and "one, two, three"
spelled as words so digits are read correctly.

---

## 3. The real phone call — Phonely (needs Twilio underneath)

**Read this before starting: you do not need it.** `/oncall` on your phone gives
you the ring, the answer, and the three-button decision, and it is the primary
path by design. Phonely makes the phone ring *as a phone*, which is a better
shot — but it is additive, never on the critical path. If §3 stalls, stop and
move to §4; the demo is unaffected.

### 3a. Twilio (Phonely provisions numbers through it)

1. Sign up at <https://twilio.com/try-twilio>. Verify your email and phone.
2. On a trial account you can only call **verified** numbers. Go to
   **Phone Numbers → Verified Caller IDs** and add the mobile you will be
   holding on camera. Do this first; it is the step people discover last.
3. Buy a number with **Voice** capability (trial credit covers it).

### 3b. Phonely

1. Sign up at <https://phonely.ai>.
2. Connect the Twilio number, or buy one through Phonely directly.
3. Create an **agent**. Paste the script from
   `warden/public/audio/README.md` (`escalation-script.mp3`) as its opening line.
4. Create a **campaign** whose trigger source is **Webhook**. Copy the webhook
   URL it gives you — it looks like
   `https://api.phonely.ai/webhook/campaign/<campaignId>`.
5. In the call flow, add a step that collects the pressed digit and then an
   **API Request** block that POSTs to your tunnel URL from §4:

   - **URL:** `https://<your-tunnel>.trycloudflare.com/api/disposition`
   - **Method:** POST
   - **Body:** `{"digit": "{{digit}}", "source": "phonely"}`

   The variable name for the collected digit depends on how you named the step.
   The endpoint accepts `digit`, `choice`, `response`, or `dtmf`, as JSON or
   form-encoded, and it strips non-numeric characters — so `"pressed 3"` still
   resolves to `3`. It also does not need the incident id: there is exactly one
   escalated incident at a time, so it falls back to that. This tolerance is
   deliberate, because you will be configuring it at speed.

6. Add to `.env.local`:

```
PHONELY_CAMPAIGN_WEBHOOK=https://api.phonely.ai/webhook/campaign/<campaignId>
ONCALL_PHONE_NUMBER=+15551234567
# PHONELY_API_KEY=only-if-your-webhook-requires-a-bearer-token
```

### What happens when you escalate

The server fires the campaign webhook and **does not wait for it**. `/oncall`
arms at the same moment. Whichever produces the digit first wins and they are
indistinguishable downstream. So:

- Phone rings → great, film that.
- Phone does not ring → tap `/oncall`, and nothing on the dashboard differs.

The dashboard labels which channel carried the decision, and so does the report.

---

## 4. cloudflared tunnel — needed for §3, useful anyway

Phonely has to reach your laptop from the public internet, and iOS needs a secure
context for the Wake Lock API.

```bash
# Windows
winget install --id Cloudflare.cloudflared
# macOS
brew install cloudflared

cloudflared tunnel --url http://localhost:3000
```

It prints a `https://<random>.trycloudflare.com` URL. That address serves the
dashboard, `/oncall`, and every API route. Use it for the Phonely API Request
block and for opening `/oncall` on your phone.

```
PUBLIC_BASE_URL=https://<random>.trycloudflare.com
```

**The URL changes every restart.** If you restart the tunnel, update the Phonely
API Request block. Start the tunnel once and leave it running.

Without a tunnel, `/oncall` still works over your LAN — open
`http://<laptop-ip>:3000/oncall` on a phone on the same hotspot. You lose Wake
Lock (set Auto-Lock to Never instead) and you lose the Phonely callback.

---

## 5. VOYGR — vendor validation, about 3 minutes

Dispatching a guard to a vendor that closed last month is a real failure mode,
and this is the check that catches it. No identity verification, no card.

```bash
curl -X POST https://dev.voygr.tech/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

The key arrives by email.

```
VOYGR_API_KEY=...
```

When you press `1` (dispatch guard), the app validates
`Sentinel Response Group` before dispatching and prints the verdict in the action
log and in the report. Dispatch itself stays simulated and is labeled
`DISPATCH SIMULATED` on screen — the check is what is real, and saying so
precisely is the point.

If the response shape differs from what I guessed, the verdict degrades to
`VENDOR STATUS UNCONFIRMED — VOYGR` rather than breaking. The raw response is
kept, so if you want to tighten the mapping it is in `lib/voygr.ts`.

---

## 6. Hexclave — auth and attribution, about 10 minutes

Worth doing for one reason: the signed-in user becomes the deciding party in the
action log and **the printed name on the evidence report's signature line**. That
attribution chain is what makes the document read as a business record rather
than a printout. Do not put the login screen on camera; nobody is moved by a
login form.

1. Sign up at <https://app.hexclave.com>, create a project.
2. Enable email/password, and create one user for yourself.
3. Copy the three keys into `.env.local`:

```
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=...
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY=...
HEXCLAVE_SECRET_SERVER_KEY=...
```

4. Restart. `/` now redirects to `/handler/sign-in` until you log in.

**Scope, on purpose:** auth gates the dashboard and nothing else. `/oncall`, the
print route, and every `/api` route stay public — the phone has no session and
Phonely's callback certainly does not. A broken auth session must never be able to
block the phone, the call, or the PDF.

Set the display name on your Hexclave user to whatever should appear on the
report. If all three keys are absent the dashboard is simply public and the
operator is the fixture manager, so you can skip this entirely.

---

## 7. Callwright / Retell — do not start this tonight

Callwright runs on Retell, which requires KYC before outbound calling. That is a
business-verification queue measured in days, not an integration measured in
minutes. It cannot be on the critical path for a demo you are recording today.

If you want it anyway: submit KYC now so it is pending, and treat any approval as
a bonus. Nothing in the code needs to change — `lib/phonely.ts` is the only
telephony surface and the `callwright` channel label already exists in the types.

---

## 8. Pin the camera — 2 minutes, prevents a specific disaster

If the filming machine has more than one camera (built-in plus a capture card,
plus anything virtual), the browser may not pick the one you aimed at the door.

1. Open the dashboard, allow the camera, open the console, run:

```js
(await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput')
```

2. Copy the `deviceId` of the camera you want and add it:

```
NEXT_PUBLIC_CAMERA_DEVICE_ID=<deviceId>
```

Device ids are stable per browser profile and origin. If you switch browsers or
switch between `localhost` and the tunnel, re-run the snippet.

---

## 9. Tuning the motion gate — do this in the actual room

`DIFF_RATIO` is the only knob, and the lighting where this was written is not the
lighting where you will film. Too sensitive and it fires on a shadow; too dull
and someone walks in unnoticed.

1. Press `` ` `` to open the debug panel.
2. Watch the `live` number while the room is still. That is your noise floor.
3. Watch it while someone walks into frame. That is your signal.
4. Set the slider roughly halfway between, nearer the noise floor.
5. **Close the panel with `` ` `` and leave it closed.** It must not appear in a
   single recorded frame.

Default is `0.025`. It is not persisted, so re-set it after a reload — or write
your tuned number into the `diffRatio` default in `lib/store.ts` once you know it.

### One thing the slider cannot fix

The gate counts a pixel as changed only when its brightness moves by more than 25
levels out of 255. So a subject within roughly 25 brightness levels of the wall
behind them — dark clothing against a dark wall in a dim room — will not trip the
gate no matter how low you set `DIFF_RATIO`. I hit this while testing; it is a
property of the algorithm rather than a bug in it.

If the gate looks dead while somebody is plainly moving, the fix is contrast, not
the slider: add a light behind or beside the subject, or have them wear something
lighter than the background. `PIXEL_THRESHOLD` in `lib/motion.ts` is the number if
you would rather change it in code, but lowering it makes the gate sensitive to
sensor noise, which is the worse trade in a dim room.

---

## 10. Hotkeys

| Key | What it does | When to use it |
|---|---|---|
| `T` | Force-trigger the real pipeline on the real current frame | Start a take on cue. Only the gate's decision is skipped — the classification is genuinely live |
| `D` | Fully canned incident, no camera and no network needed | Rehearse camera moves without burning API calls. Replays the last real frames if there are any |
| `` ` `` | Debug panel | Tuning only. Closed during every take |
| `R` | Reset to a clean state, clears server escalation state too | Between takes |

`T` is what you will actually use on camera. Waiting for the gate to notice
someone is dead air, and dead air is what makes a recording feel slow.

---

## 11. Pre-flight, immediately before recording

- [ ] `npm run dev` running, and the tunnel running if you are using Phonely
- [ ] Phone on the same hotspot, `/oncall` open, **`GO ON DUTY` tapped**
- [ ] Phone: ring switch on, volume max, Auto-Lock **Never**, DND off
- [ ] **Do not reload `/oncall` after arming.** iOS drops the audio session and
      the ringtone dies silently
- [ ] Audio output set to speakers loud enough for the voice-down to reach the mic
- [ ] Camera permission granted, correct device, aimed at the door
- [ ] Debug panel closed, event stream reset with `R`
- [ ] In the print dialog, uncheck **Headers and footers** once — it persists
- [ ] Browser at 100% zoom, bookmarks bar hidden, notifications silenced
- [ ] One person operates, one performs, one holds the second camera

Then: `T` on cue → let the card land → voice-down → phone rings → answer → press
`3` → `INCIDENT REPORT` → scroll the PDF slowly and rest on the attestation.

**Give the PDF real screen time.** It is the part people rush and the part that
wins the argument.

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Threat card always says `person at entry, interacting with door` | No Anthropic key, or every model id 404'd | Check `.env.local`, restart, run the `/v1/models` curl |
| No voice-down audio | Chrome blocks speech before a user gesture | Click the page once. Any click arms it |
| Camera tile black | Wrong device, or permission denied | §8. Or press `D` and carry on |
| Gate never trips | `DIFF_RATIO` too high for the room | §9. `T` always works |
| Gate fires constantly | Too low, or a flickering light in frame | §9 |
| Phone never rings | `/oncall` not armed, or the page was reloaded | Re-tap `GO ON DUTY`. Never reload after arming |
| Dashboard does not react to a phone tap | Server restarted mid-incident, losing the mirror | `R`, then run the loop again |
| Report page says "No record found" | Dev server restarted; records are in memory | Run the loop again, then reopen the report |
| Report prints white on white | A `print-color-adjust` regression | Already handled in `print.css`; check nothing overrode it |
| PDF has a URL in the margin | "Headers and footers" is checked | Uncheck it in the print dialog |
| `/oncall` silent on iOS | Ring switch off, or volume down | iOS has no vibration API at all. The ringtone is the only signal |

---

## 13. What is real and what is simulated

Say this out loud before anyone asks. Every one of these is labeled in the UI, and
an unlabeled fake is what makes a judge stop believing the rest of the screen.

**Real:** the camera, the motion gate, the Claude vision call and its structured
output, the threat scoring, posture derived from lease state, the voice-down, the
escalation to a second physical device, the disposition round trip, the SHA-256
frame hashes, the evidence report, and the VOYGR vendor check when keyed.

**Simulated, and labeled as such on screen:**

- **The PMS vacancy feed** — stands in for Yardi/RealPage. Six fixture properties.
  Footer of the property rail reads `SIMULATED`.
- **Guard dispatch** — no marketplace is called. Labeled `DISPATCH SIMULATED`. The
  vendor's *operating status* is genuinely validated first.
- **Police notification** — labeled `SIMULATED`.
- **Append-only storage and 7-year retention** in the report's custody section
  describe the production design, not tonight's in-memory store. If asked, say
  so plainly.

The addresses, owners, and the guard vendor are fictional. The doors-monitored
counter is a fixture; do not present it as a metric.

---

## 14. If you change code

```bash
npm run typecheck   # clean on a fresh checkout
npm run build       # clean, 11 routes
npm run verify      # typecheck + all four suites, needs the dev server up
```

ESLint is deliberately off (`trd.md` §3). `tsc` is the gate.

The one rule worth keeping: **`closeIncident()` in `lib/incident.ts` is the only
path to a closed incident.** That is what makes "every incident has a disposition"
a property of the code rather than a claim on a slide. Do not add a second one.
