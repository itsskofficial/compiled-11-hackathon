# Warden — Technical Requirements Document
**c0mpiled-11 hackathon · July 24, 2026 · written 8:10 PM · build closes 10:00 PM**

Companion to `prd.md`. The PRD says what we're selling and why. This says what we build, in what order, and what we do when it breaks on stage.

---

## 0. The clock is worse than the PRD assumes — read this first

The PRD's build plan is written in relative time (T+0:40 … T+2:15), implying a ~2h15m runway. **The real runway is ~110 minutes**, and the PRD's own 9:30 PM hard stop to record the backup video means **effective build time is ~80 minutes.** Every timebox below is absolute wall-clock.

The consequence: the PRD's build table cannot be executed as written. Something has to go, and the reordering below decides what.

### Revised build schedule (absolute)

Two parallel tracks. **A** owns the vision loop, **B** owns escalation then evidence.

| Clock | Track A | Track B |
|---|---|---|
| **8:10–8:20** | Scaffold, fixtures, dashboard shell | **Switch everything to the phone hotspot** (§5.0), then `/oncall` page |
| **8:20–8:50** | **Core vision loop — NEVER CUT** | `/oncall` simulated call card (~10 min), then voice-down (~5 min) |
| **8:25** | — | **Callwright go/no-go gate — hard** (§5.1) |
| **8:40** | — | **Miso abort deadline** (§5.4) |
| **8:50–9:20** | Threat card, event stream, polish | **Evidence report → PDF — NEVER CUT** |
| **9:00** | **Full dress rehearsal on the hotspot**, phone armed and pocketed | ← both |
| **9:20–9:30** | Tune `DIFF_RATIO` on the actual stage | Confirm print dialog settings |
| **9:25–9:30** | **FREEZE. Record backup video.** | ← both, non-negotiable |
| **9:30–9:50** | Second rehearsal, failure drills | Hexclave (§3) only if clean |
| **9:50–10:00** | Rehearse the pitch. Stop building. | ← both |

**Two structural changes from the PRD.** First: **the simulated escalation call is the primary path, not the fallback.** It is a web page, not telephony, so it carries none of telephony's risk and is safe to build first. That inversion is what lets track B start with escalation and still be safe.

Second, the evidence PDF is protected — but by a *gate*, not by ordering. The PRD sequences the escalation call before the PDF, which is a trap, because telephony is the one component that can consume unbounded time and the PDF is what the whole moat argument rests on. Note that the 8:25 Callwright gate does sit before the 8:50 PDF block, so ordering alone is not the protection here. What protects the PDF is that Callwright is hard-bounded, worked by one person, and **automatically dead if the simulated card hasn't shipped by 8:25** — nobody debates it, and nobody is still holding it at 9:00.

### The unifying principle for both prize integrations

**Pre-verify or pre-render off stage; play back locally on stage.** This applies to Callwright and to Miso identically. You get judge affinity and legitimate prize eligibility with zero stage risk, because nothing unproven is ever in the live path. It is the single idea that makes both side quests safe to attempt.

### Minute-zero blocker

`ANTHROPIC_API_KEY` is **not set** in the current shell. Verified toolchain: Node v24.14.0, npm 11.9.0, Python 3.14.6. Set the key and prove it with one round-trip before writing any code.

---

## 1. Scope

**In:** single-operator dashboard, one live camera, six faked properties, one incident type (intrusion at a vacant unit), one complete loop from motion → classification → voice-down → escalation → disposition → PDF.

**Out, and we say so plainly if asked:** real PMS integration, real guard dispatch, multi-camera, multi-tenant, persistence across reload, video storage or retention policy, and any model actually trained on dispositions. **Tonight the moat is the data design, not a trained model** — we demonstrate that outcomes are captured in structured, labelable form. We do not claim to have trained on them. That distinction is what keeps the honesty box honest.

The two faked adapters — PMS vacancy feed and guard-dispatch marketplace — must be **visibly labeled as simulated in the UI**. A judge who discovers an unlabeled fake stops believing everything else; a judge who watches you label it yourself reads it as engineering confidence.

---

## 2. Fixture data — the faked PMS

| # | Property | Unit | Lease state | Detail | Why it's on screen |
|---|---|---|---|---|---|
| 1 | Maple Grove Apartments | 4B | `vacant` | Turnover day 12 | **Hero.** The demo fires here |
| 2 | Maple Grove Apartments | 2A | `occupied` | — | Posture varies within one building |
| 3 | Corbin Street SFR | whole home | `vacant` | REO, day 47 | The squatter/eviction story |
| 4 | Alder Point | 12 | `notice` | Move-out in 3 days | Posture changes *before* vacancy |
| 5 | Kestrel Ridge Estate | whole home | `seasonal_vacant` | Owner absent 11 months | HNW / family-office segment |
| 6 | Harbor Yards Phase II | construction | `construction` | Copper theft risk | The GC buyer |

Lease state drives posture; posture drives the escalation threshold. The PMS-integration argument, in one block of code:

```ts
export type LeaseState = 'occupied' | 'notice' | 'vacant' | 'seasonal_vacant' | 'construction';
export type Posture = 'passive' | 'standard' | 'armed';

export const POSTURE: Record<LeaseState, Posture> = {
  occupied: 'passive', notice: 'standard', vacant: 'armed',
  seasonal_vacant: 'armed', construction: 'armed',
};

// Armed properties escalate one threat level lower than occupied ones.
export const ESCALATION_THRESHOLD: Record<Posture, number> = { passive: 4, standard: 3, armed: 3 };
```

Say this out loud: *"The property management system already knows which units are empty tonight. Posture just follows lease state — nobody arms anything by hand."*

---

## 3. Architecture

### Verdict: one Next.js App Router app; **no event bus for the dashboard, one SSE channel for the phone**

The PRD's architecture line says "event bus → … → dashboard via SSE/poll." **The dashboard does not need it.** Everything that produces events — the camera, the motion gate, the voice-down, the incident state — already lives in the one browser tab that also renders the dashboard. Streaming those events out to a server and back into the same tab is ceremony, and it costs ~20 minutes we don't have.

**But the phone does need it.** The `/oncall` page (§5.2) lives on a different device and must be pushed to. So there is exactly one SSE endpoint, serving exactly one consumer, carrying exactly one event type: *an incident escalated.* That is a much smaller thing than a general event bus, and it's the only reason the server holds any incident state at all.

The server therefore has two jobs: hold the Anthropic key, and relay one escalation event to the phone.

```
Browser tab (laptop)                          Phone (Safari, same hotspot LAN)
  getUserMedia → <video> → hidden <canvas>      /oncall  ←──── SSE ────┐
    → motion gate (frame differencing, client)     ↓ presenter taps 3  │
    → on trigger: POST 3 frames to /api/classify   └─→ POST /api/disposition
                          ↓ (server holds the key)                     │
                    Anthropic API                                      │
                          ↓                                            │
    ← {person, count, behavior, threat}                                │
    → zustand store ──┬─→ threat card + event stream (same tab)        │
                      ├─→ voice-down (speechSynthesis)                 │
                      ├─→ POST /api/escalate ───────────────────────────┘
                      └─→ /incident/[id]/print (light theme → PDF)
```

Why this beats the alternatives, briefly: a **Vite + FastAPI split** costs two dev servers, a CORS config, and a second language for zero benefit at this scale. A **pure client-side SPA with the key in the browser** would actually work for a localhost demo, but a judge who opens devtools sees an API key, and Hexclave's auth story wants a server anyway. **Next.js** gives us the route handler, the second page for the report, and Hexclave's best-supported integration path in one scaffold command.

### Scaffold — run this first, do not deliberate

```bash
npx create-next-app@latest warden \
  --typescript --tailwind --app --no-src-dir --no-eslint --use-npm --turbopack
cd warden && npm i zustand @anthropic-ai/sdk
echo "ANTHROPIC_API_KEY=sk-..." > .env.local
```

ESLint is off deliberately: at this hour lint errors are pure friction and there is no reviewer but us.

### File layout — 18 files, and that is the budget

```
app/page.tsx                    the entire dashboard, one screen
app/oncall/page.tsx             the phone's on-call UI — arm, ring, 3 buttons
app/incident/[id]/print/page.tsx  evidence report, light theme, serif
app/api/classify/route.ts       POST frames → Anthropic → structured JSON
app/api/escalate/route.ts       laptop → server: an incident escalated
app/api/oncall/stream/route.ts  SSE, the phone's only subscription
app/api/disposition/route.ts    phone → server: which button was pressed
app/globals.css                 dark theme + @media print block
lib/types.ts                    all shared types (§6)
lib/fixtures.ts                 the six properties
lib/store.ts                    zustand: properties, incidents, events, actions
lib/motion.ts                   frame-diff gate
lib/voice.ts                    speechSynthesis wrapper
components/CameraTile.tsx       video + HUD overlay + diff sparkline
components/ThreatCard.tsx       the money shot
components/EventStream.tsx      reverse-chron log
components/PropertyRail.tsx     six property cards
components/OnCallMirror.tsx     phone-shaped panel mirroring /oncall (§5.2)
```

**State lives in one zustand store in the browser.** No database, no SQLite, no persistence across reload — and reload is itself the demo reset, which is a feature at 9:55 PM when you need a clean run.

### Hexclave: in the 9:30–9:50 window only, and only as a login wall

$1,000 is real money and Konstantin is judging, but auth is worth zero pitch seconds — no judge is moved by a login screen. Touch it only in the 9:30–9:50 window, and only if the backup video is recorded and the demo is clean. It gates the dashboard route and nothing else; **`/oncall` and the print route stay public**, so a broken auth session can never block the phone or the PDF. If it isn't working by 9:50, `git checkout` the change and walk away. **Do not let a $1,000 side prize endanger the $3,000 main prize.**

---

## 4. The vision loop (NEVER CUT)

### 4.1 Motion gate — browser-side, ~15 lines

Runs entirely client-side on a hidden canvas. No OpenCV, no Python, no server round-trip until something actually moves.

```
every 200ms (5 fps):
  draw <video> to hidden canvas at 160×120
  grayscale = (r*0.299 + g*0.587 + b*0.114)
  diff = |gray[i] - prevGray[i]| for all pixels
  changed = count(diff > PIXEL_THRESHOLD)      // PIXEL_THRESHOLD = 25 (of 255)
  ratio = changed / totalPixels
  motion = ratio > DIFF_RATIO                  // DIFF_RATIO = 0.025  ← the knob
  fire when motion is true on 2 consecutive samples
  then cooldown 20s (one intruder must not fire 40 API calls)
```

**`DIFF_RATIO` is the single knob.** Stage lighting will differ from wherever you tested. Too sensitive and it fires on a shadow; too dull and your teammate walks in unnoticed. Put it on a slider in a debug panel toggled by `` ` `` (backtick) and tune it once on the actual stage, on the actual laptop, under the actual lights. Budget two minutes for this at 9:30 — it is the highest-value two minutes of tuning in the build.

### 4.2 The Claude call

**Model: `claude-sonnet-5`.** This is a latency decision, not a quality one. A six-second silence on stage is death, and the classification task here — is there a person, how many, what are they doing, how bad is it — is well within Sonnet's range. If Sonnet's output reads as flat during rehearsal, `claude-fable-5` is the upgrade, but only if the round-trip stays under ~3s.

**Frames:** 3 JPEGs at 640×480, quality 0.7 (~60–90KB each), captured 400ms apart. Three frames rather than one because *behavior* is the whole product — "attempting door" is a claim about motion across time, and a single still can only support "a person is present." That difference is the demo line.

**Structured output: tool calling with a strict schema, not prompt-and-parse.** Define one tool `report_assessment` with the required fields and let the API enforce shape. Parsing JSON out of prose with a room watching is not a risk worth taking.

**Latency budget:** capture 0.8s + inference 2–3s = threat card fully populated in under 4s.

**Render optimistically.** The instant the gate trips, the threat card slides in already showing the frame strip and an `ANALYZING` state, before Claude has answered. The classification fills in when it lands. The stage never sees dead air, and the perceived latency drops to roughly zero.

**Timeout: 6 seconds → fall back silently to a canned classification.** The UI must never render a raw error. There is no failure state visible to the audience, only a slightly less specific behavior string.

### 4.3 The prompt

```
SYSTEM:
You are Warden, an AI security operator monitoring residential and commercial
real estate. You receive consecutive frames from a fixed security camera and
assess whether what you see requires human intervention.

You are looking at: {property.name}, {property.unit}.
Lease state: {property.leaseState}. This unit is {vacancyNarrative}.
Local time: {timestamp} {timezone}.

Assess only what is visibly supported by the frames. Do not speculate about
intent beyond observable behavior. Do not guess identity, age, race, or gender —
describe only what bears on the security assessment.

THREAT RUBRIC — apply strictly:
1  No person, or a person clearly authorized (uniformed contractor, visible badge,
   marked vehicle) behaving consistently with authorized work.
2  A person present at the perimeter, transiting, no interaction with the structure.
   Delivery, passerby, someone at the wrong address.
3  A person interacting with the structure at an unusual hour, or lingering with
   no apparent purpose. Testing a handle, looking through a window.
4  A person actively attempting entry — forcing a door or window, defeating a lock,
   carrying tools — or multiple people coordinating at an unoccupied property.
5  Entry achieved, property damage in progress, weapon visible, or an immediate
   threat to a person.

An unoccupied property raises the significance of any interaction with the
structure. A vacant unit has no legitimate visitor at night.

Call report_assessment exactly once. behavior must be a single clause, under
12 words, written the way a security operator would log it — for example
"attempting door, no uniform" or "transiting parking area, no interaction".
```

The rubric is what makes the 1–5 mean something across runs. Without it, the model's threat numbers drift and the escalation threshold becomes noise.

### 4.4 Determinism on stage — the part that actually saves the demo

Live CV demos fail. Every affordance here must be **visually indistinguishable** from the real path, so the audience cannot tell which one fired.

| Key | Effect | When to use |
|---|---|---|
| `T` | Force-trigger the gate on the current live frame | Gate hasn't tripped within 5s of the intruder entering |
| `D` | Fire a fully canned incident with pre-captured frames | Camera or network is dead |
| `` ` `` | Debug panel: diff ratio readout + threshold slider | Tuning at 9:30, never on stage |
| `R` | Reset to clean state | Between rehearsal runs |

The operator's finger rests on `T` for the entire demo. It fires the *real* pipeline against the *real* current frame — it only skips the gate's decision. So the presenter is not lying when they let it run: the classification is genuinely live. `D` is the true fallback, and it should be pre-warmed with frames captured during rehearsal at the actual venue.

**Rule for the operator: never speak, never look up, never signal.** A silent fallback is invisible. A hesitation is not.

---

## 5. Escalation, voice-down, and evidence

### 5.0 Run the entire demo off the presenter's phone hotspot

**This is the highest-leverage infrastructure decision of the night, and it is nearly free.** Do not touch conference wifi.

It buys two unrelated things at once. It takes the venue's overloaded network out of the Claude API path, which is the difference between a 2-second classification and a hung request in front of judges. And it puts the phone and the laptop on the same LAN *by construction*, which is what makes the on-stage phone trick possible without a tunneling service — iOS hotspot puts the phone at `172.20.10.1` and the laptop somewhere in `172.20.10.x` (`ipconfig getifaddr en0` to find it).

**Switch before the 9:00 rehearsal, not before the pitch.** Any surprise this causes — a captive portal, a firewall rule, a carrier quirk — you want surfacing at 9:00 with an hour left, not at 9:58.

### 5.1 Callwright: a bounded bet that can only ever add

Two facts from the event blast sharpen the PRD's stance: **VOYGR is offering a $1,500 Apple gift card** for the most impressive Callwright build, and **Vlad Baskakov of VOYGR is judging**. That's larger than second place, so it earns a real attempt. But read the API honestly — **Callwright is built for outbound calls to businesses** (reservations, appointments, quotes). Calling a human's mobile to collect a three-way decision is off-label. Expect friction. (The shared docs are a Google Doc that isn't publicly fetchable, so the integration below is designed blind and defensively.)

**The gate — 8:25 PM, hard.** One person runs it, and only *after* their simulated card already works. If the card slips, Callwright dies automatically and nobody debates it.

The pass condition is not an HTTP 200. It is: **one call placed from the laptop makes the presenter's actual mobile ring and play recognizable audio, end to end, once.** If Callwright refuses non-business destinations, wants a verified caller ID, requires a business lookup, or returns anything that needs doc-reading to interpret — that is a fail, not a debugging session.

Even on a pass, it never becomes an unguarded dependency. Race it against the local path:

```ts
async function escalate(incident: Incident): Promise<Disposition> {
  const local = simulatedCall.arm(incident);      // resolves when presenter taps
  if (CALLWRIGHT_VERIFIED) {
    callwright.place(incident).catch(() => {});   // fire and forget, NEVER awaited
    const rang = await callwright.waitForRing(6000);
    if (!rang) simulatedCall.ring();              // local ring takes over silently
  } else {
    simulatedCall.ring();
  }
  return local;                                   // disposition ALWAYS from local UI
}
```

**The prize play at zero stage risk:** if you land even one successful Callwright call at any point tonight, screen-record it and keep the integration in the repo. You are then legitimately "built with Callwright" for the $1,500, and can say on stage *"the escalation goes out through Callwright — here's the recording"* while the demo runs the local path. Do not fake a call you never made, and do not put an unverified one on stage.

### 5.2 The simulated call — and it is genuinely better than the real one

Not a consolation prize. You control the latency, you control the audio, and — decisively — **the audience gets to see the decision UI.** A real phone's screen is invisible to a room. Yours won't be.

**Build:** the phone opens `http://172.20.10.<laptop>:3000/oncall` in Safari and holds an SSE connection.

**Stage sequence:**

1. **Pre-demo arming.** Presenter taps one full-screen `GO ON DUTY` button. That single gesture unlocks the iOS audio session, starts a silent looping buffer to keep it alive, and requests a wake lock. Screen goes to dark standby — `WARDEN OPS · On call · Maple Grove Residential (14 properties)`. Phone into pocket.
2. Vision loop scores threat at or above the property's posture threshold (3 for Maple Grove 4B, which is `vacant` → `armed`) → server pushes the incident over SSE.
3. **Phone rings** at full volume and vibrates (`navigator.vibrate([400,200,400])`). Full-screen incoming-call UI: large `WARDEN OPS`, subtitle `Maple Grove — Unit 4B`, red and green accept/decline circles.
4. Presenter pulls the phone from their pocket in front of the room and swipes to answer.
5. Pre-rendered voice line plays from the phone speaker. Three large buttons appear, **numbered to match the audio**: `1 DISPATCH GUARD` / `2 NOTIFY POLICE` / `3 DISMISS`.
6. Presenter taps `3`. Phone POSTs the disposition back; the dashboard flips to `DISMISSED BY MANAGER` live; the PDF now has its closing line.

**Mirror the phone screen on the dashboard** as a small phone-shaped panel labeled `ON-CALL DEVICE — Jordan Reyes, Regional Ops`. This is the detail that makes the simulation beat real telephony: it puts the decision surface — which *is* the product — on the projector.

**iOS failure modes, in the order they'll bite you:**

- Ring/silent switch set to **RING** (Safari Web Audio respects it) and ringer volume at max.
- Settings → Display & Brightness → **Auto-Lock → Never**.
- Focus/Do Not Disturb **off**, so a real notification can't land mid-demo.
- **The audio unlock is lost on page reload — never reload after arming.**
- Use a plain looping `<audio playsinline preload>` that you `.play()` and immediately pause during the arming tap. That is the reliable Safari unlock pattern.

**Fallback to the fallback (30 seconds to build):** `/oncall?demo=1` arms a 45-second countdown on the arming tap instead of listening for SSE. Save the page as a standalone HTML file, AirDrop it to the phone, open it offline. Same drama, zero network — the presenter just times their narration.

**Tertiary:** the laptop plays the ringtone through the room PA and shows the incoming-call card full-screen. Loses the pocket moment, keeps the beat.

### 5.3 The call script — verbatim, ~23 seconds

DTMF-style numbered buttons, never speech recognition. A stage is acoustically hostile, ASR adds an uncontrollable round-trip, and "press three" is a deterministic branch that hands the card its numbered-button metaphor for free.

> "Warden security operations, priority alert. Verified intruder at Maple Grove, Unit four-B — vacant unit, day twelve of turnover. One adult at the rear entry, no uniform, attempting the door. Voice deterrent has fired. Press one to dispatch a guard. Press two to notify police. Press three to dismiss."

On the tap:

> "Dismissed. Logged as a manager dismissal. **Evidence report is on your dashboard.**"

That closing line is a deliberate handoff — it cues the presenter to turn to the laptop and click `INCIDENT REPORT`, so the PDF arrives feeling like a consequence of the call rather than a change of subject.

If Callwright does run live, use the same text as the agent prompt: speak once verbatim, wait for one digit, confirm with the closing line, hang up. No conversation, hard 40-second cap.

### 5.4 Voice-down

**Browser `speechSynthesis` is the primary path — pick Daniel (en-GB).** The macOS default (Samantha) sounds like a phone assistant and reads as a toy; Daniel reads as institutional PA, and the accent shift alone makes the room register *the building is talking* rather than *a laptop is talking*.

```ts
const VOICE_PRIORITY = ['Daniel', 'Alex', 'Samantha', 'Karen'];
let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  for (const name of VOICE_PRIORITY) {
    const v = voices.find(v => v.name === name);   // exact match, NEVER by index
    if (v) return v;
  }
  return voices.find(v => v.lang === 'en-US') ?? voices[0];
}

speechSynthesis.onvoiceschanged = () => { cachedVoice = pickVoice(); };
cachedVoice = pickVoice();

export function voiceDown(text: string) {
  speechSynthesis.cancel();                        // clear any stuck queue
  const u = new SpeechSynthesisUtterance(text);
  if (cachedVoice) u.voice = cachedVoice;
  u.rate = 0.92;                                   // slower reads as authoritative
  u.pitch = 0.9;
  u.volume = 1;
  speechSynthesis.speak(u);
}
```

Three things actually break this: `getVoices()` returns empty on first call (hence `voiceschanged`); Chrome needs a prior user gesture, so fire a silent warm-up utterance on the same click that starts the demo; and **check System Settings → Sound → Output points at the room PA before you present.** A deterrent nobody can hear is not a deterrent.

Line: *"This property is monitored. Security has been notified."* Consider adding *"Leave the premises now."* — it gives the teammate a cleaner beat to react to.

**Miso: hard abort at 8:40 PM, ten minutes, one person.** Success means a single POST returns playable audio bytes in under 2 seconds. Any CORS wall, auth ambiguity, or SDK install — abort immediately. And even on success, **Miso never runs live on stage.** Render the two voice-down lines and the call script to MP3, drop them in `/public/audio/`, play the files. You get to tell Miso's founder their model is the voice of the product, with zero network dependency. If Miso fails, `speechSynthesis` already shipped and nothing changes.

### 5.5 Evidence report (NEVER CUT)

**Mechanism: a dedicated light-theme route at `/incident/[id]/print` plus `window.print()`.** Open it with `window.open(...)` and call `print()` on load — a separate route, not a modal over the dark dashboard.

In clock terms: jsPDF makes you compute every text position and image box by hand, and building a legal-looking multi-section document that way at 9:15 PM is how you lose the never-cut deliverable. pdfmake trades that for a document-definition DSL you'd be learning tonight. Server-side Puppeteer means downloading headless Chrome at the worst possible moment. HTML gives you real typography, base64 `<img>` frames that just render, and — a free bonus — **Chrome's print preview is itself a good stage visual.** A document materializing in a preview pane reads as a document being *filed*.

**The document is black-on-white and serif while the dashboard is dark.** The contrast is doing rhetorical work: the dashboard is the operations product, the report is a legal instrument. **Its credibility comes from looking boring.**

```css
@page { size: Letter; margin: 0.75in; }

/* #1 killer: dark headers and backgrounds print WHITE without this. */
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

section, .frame-cell, tr, .attestation { break-inside: avoid; }
h1, h2, h3 { break-after: avoid; }
```

**The gotchas, each of which otherwise costs five minutes:**

- **Downscale frames before embedding.** A full-res `canvas.toDataURL('image/png')` is multi-megabyte base64, and four of them visibly hang Chrome's print job. Draw to an offscreen canvas at 320px wide and use `toDataURL('image/jpeg', 0.7)`.
- **No flexbox or grid inside the printed document.** Page-break behavior across flex and grid containers is inconsistent between engines. Block elements and a plain `<table>` for the frame strip and action log.
- **No `position: fixed` running footers.** Some engines repeat them on every page, others drop them entirely. Use a static attestation block at the end.
- **No `overflow: hidden` on any ancestor of printed content** — it clips everything past page one.
- **System fonts only** (`Georgia, 'Times New Roman', serif`). A webfont fetch is an unforced error.
- **Uncheck "Headers and footers" in Chrome's print dialog once, before the demo.** Otherwise every page carries `localhost:3000` and today's date in the margins, and instantly reads as a browser printout instead of a filing. The setting persists.
- Set explicit `width`/`height` attributes on frame images so layout can't reflow mid-print.

**Document layout.** What makes this read court-ready rather than hackathon-printout is identifiers, timezones, hashes, and language written by someone anticipating a subpoena.

1. **Header band** — `WARDEN SECURITY OPERATIONS` left; monospace `INCIDENT REPORT · WSO-2026-0724-0041` right. Thin rule, then `Generated 2026-07-24 21:47:13 PDT (UTC-07:00) · Report version 1 of 1 · Page 1 of 2`. **Explicit timezone with UTC offset, every single time** — this one detail does more for credibility than anything else on the page.
2. **Property and lease state** — two-column definition table: property, unit, address, owner of record, managing agent, `OCCUPANCY: VACANT`, `LEASE STATE: turnover, day 12 of 21`, last authorized entry (name + timestamp), authorized-entry list at time of incident. **Make the lease-state row visually prominent** — it is the row that connects this document to an unlawful-detainer filing.
3. **Incident summary** — four or five lines of plain declarative prose, written so a claims adjuster who reads only this section understands the whole event.
4. **Detection chain** — one row per pipeline stage: timestamp, stage (motion gate → vision classification → threat scoring → escalation), model and version, structured output. **Include the raw classification JSON in a monospace block.** Showing the machine's actual output rather than a prose summary is what makes it read as evidence rather than marketing.
5. **Photographic evidence** — 2×2 table of frames. Each cell: image, then a monospace caption with frame index, timestamp with timezone, and the **SHA-256 of the frame bytes** (first 16 hex chars, labeled as truncated). Above the table: *"Frames captured at 1 fps from fixed camera CAM-4B-REAR. Images are unmodified originals; hashes computed at capture time."* Compute with `crypto.subtle.digest('SHA-256', bytes)` — four lines that change how the page reads.
6. **Action log** — timestamped table of every automated and human action with actor attribution (`SYSTEM` vs `Jordan Reyes, Regional Ops Manager`), channel, and result. This is where the phone call becomes a legal artifact.
7. **Disposition** — boxed and set larger: `DISMISSED BY MANAGER — no dispatch`, with deciding party, role, timestamp, and free-text rationale.
8. **Chain of custody** — *"This record was generated automatically by Warden Security Operations at the time of the incident. Media and event records are written to append-only storage at capture and have not been modified. Custody has remained with Warden Security Operations from capture through generation of this report. Retention: 7 years."* Then `Evidence bundle SHA-256: a3f9…`.
9. **Attestation footer** — *"I certify that the foregoing report was generated from system records maintained in the ordinary course of business, at or near the time of the events described, and that it is a true and accurate reproduction of those records."* Signature line, printed name, title, date, and a final monospace ID strip (report ID, bundle hash, system version).

Section 9 is the line that turns a printout into a document. It is business-records-exception language, and it is exactly what a judge or an adjuster expects to find at the bottom of the page.

---

## 6. Shared types

```ts
export type ThreatLevel = 1 | 2 | 3 | 4 | 5;

export type Disposition =
  | 'false_alarm' | 'deterred_by_voice' | 'dismissed_by_manager'
  | 'guard_dispatched' | 'police_report' | 'eviction_filed' | 'claim_paid';

export type IncidentState =
  | 'motion_detected' | 'classifying' | 'assessed'
  | 'deterrent_broadcast' | 'escalated' | 'closed';

export interface EvidenceFrame {
  id: string;                 // "FRM-0041-02"
  index: number;              // 1-based, order within the incident
  capturedAt: string;         // ISO 8601 WITH offset: 2026-07-24T21:42:07.412-07:00
  cameraId: string;           // "CAM-4B-REAR"
  dataUri: string;            // downscaled JPEG, 320px wide, q=0.7 (see §5.5)
  sha256: string;             // hash of decoded bytes, computed at capture
  width: number;
  height: number;
  isTriggerFrame: boolean;    // the frame that fired the vision call
}

export interface Classification {
  at: string;                 // ISO 8601 with offset
  model: string;              // whichever model actually ran
  personDetected: boolean;
  personCount: number;
  behavior: string;           // "attempting door, no uniform"
  uniformed: boolean;
  threat: ThreatLevel;
  rationale: string;
  raw: unknown;               // verbatim model JSON — printed in report §4
}

export type ActionKind =
  | 'motion_detected' | 'vision_classified' | 'voice_down'
  | 'escalation_call_placed' | 'escalation_call_answered' | 'operator_response'
  | 'guard_dispatch_requested' | 'police_notified' | 'report_generated';

export type ActionChannel =
  | 'system' | 'speaker' | 'callwright' | 'warden_mobile' | 'dashboard';

export interface Actor {
  kind: 'system' | 'human';
  id: string;                 // "SYSTEM" | "user_jreyes"
  displayName: string;        // "Warden Automation" | "Jordan Reyes"
  role?: string;              // "Regional Operations Manager"
}

export interface Action {
  id: string;
  incidentId: string;
  at: string;                 // ISO 8601 with offset
  kind: ActionKind;
  channel: ActionChannel;
  actor: Actor;
  summary: string;            // one line, printed verbatim in the action log
  detail?: string;            // spoken text, pressed digit, API response id
  succeeded: boolean;
}

export interface PropertyRef {
  propertyId: string;         // "PROP-MAPLE-GROVE"
  propertyName: string;
  unit: string;               // "4B"
  addressLine: string;
  cityStateZip: string;
  ownerOfRecord: string;
  managingAgent: string;
  leaseState: LeaseState;     // see §2
  turnoverDay?: number;       // 12
  turnoverLength?: number;    // 21
  lastAuthorizedEntry?: { at: string; by: string };
}

export interface Incident {
  id: string;                 // "WSO-2026-0724-0041" — also the case number
  property: PropertyRef;
  state: IncidentState;
  openedAt: string;
  closedAt?: string;
  timezone: string;           // "America/Los_Angeles"
  cameraId: string;
  threat: ThreatLevel;        // highest observed
  classifications: Classification[];
  frames: EvidenceFrame[];
  actions: Action[];
  disposition?: Disposition;
  dispositionAt?: string;
  dispositionBy?: Actor;
  dispositionNote?: string;
  bundleSha256?: string;      // hash over frame hashes + action log, set at close
}

/** The only way to close an incident. Disposition is not optional in practice. */
export function closeIncident(
  incident: Incident, disposition: Disposition, by: Actor, note?: string,
): Incident { /* ... */ }
```

Three shape notes that matter more than they look. **Every timestamp is an offset-bearing ISO string**, never a `Date` or an epoch, because the PDF must print the timezone and you do not want to be doing timezone math at 9:50 PM. **`Classification.raw` is preserved verbatim** so the report can print the model's actual JSON rather than a prose summary — that's the difference between evidence and marketing. And **`disposition` is optional on the type but gated by `closeIncident`**, so "every incident closes with a disposition" is a property of the code rather than a claim on a slide. If a judge asks what's actually defensible here, that function is the answer.

### The state machine

```
motion_detected ──(frames captured)──────────→ classifying
classifying ────(assessment | 6s timeout→canned)──→ assessed
assessed ───────(threat ≥ posture threshold)─→ deterrent_broadcast ──→ escalated
assessed ───────(threat < threshold)─────────→ closed [false_alarm]
escalated ──────(presenter taps 1|2|3)───────→ closed [disposition]
escalated ──────(no answer, 45s)─────────────→ closed [guard_dispatched]
```

The no-answer branch matters more than it looks: it's the answer to *"what happens when the manager is asleep?"* — and the answer being "we dispatch anyway, and the log shows we tried" is exactly the operator-not-software posture the PRD is selling.

---

## 7. Dashboard UI — "Most Beautiful" is in play

Single screen, no scrolling, safe at 1440×900 on a projector. Three columns on a dark canvas.

**Left rail (280px) — Portfolio.** `WARDEN` wordmark, a "40,312 doors monitored" counter, the six property cards (name, unit, lease-state chip, posture dot), Maple Grove 4B sorted first with an amber armed ring. Footer: `PMS: Yardi · synced 4m ago` with a visible **SIMULATED** tag.

**Center — the live tile.** 16:9 webcam feed with an overlay HUD: property/unit top-left, `● REC` and a running clock with seconds and timezone top-right, `VACANT · TURNOVER DAY 12` bottom-left, and a thin sparkline of frame-diff energy so judges can *see* the gate working. On trigger: a red scan sweep, then the threat card slides over the lower third.

**Right rail (360px) — Event stream.** Reverse-chronological monospace log (time, property, event, threat pill), the active threat card above it, and the `INCIDENT REPORT` button as the primary CTA below.

**Threat card** — slides in over 220ms, never pops:

```
THREAT 4
"One adult, attempting door, no uniform"
1 person · 21:42:07 PDT
[frame][frame][frame]
✓ VOICE-DOWN BROADCAST
✓ ON-CALL NOTIFIED — J. Reyes
○ AWAITING DISPOSITION
```

**Palette:** bg `#0A0C0F`, panel `#12161B`, hairline `#1F262E`, text `#E6EDF3`, muted `#7D8896`, armed accent `#F0883E`. Threat colors: 1–2 `#3FB950`, 3 `#D29922`, 4–5 `#F85149`. Monospace for every timestamp and log row.

**Motion discipline: exactly three animations exist** — the scan sweep, the card slide, the action-row checkmarks. Everything else is static. Restraint reads as product; excess reads as hackathon.

**Anti-patterns:** no emoji in the product UI, no gradient text, no spinner where an optimistic value works, and never a timestamp without a timezone. It's an evidence product — the pedantry *is* the aesthetic.

---

## 8. Acceptance criteria

Each is a binary check a human runs out loud before 9:30.

- **A1** Webcam tile renders within 3s of load, no permission dialog on stage (pre-grant it in the same browser profile).
- **A2** A person entering frame produces a populated threat card within 4s, unattended.
- **A3** Pressing `T` produces an identical card — indistinguishable from A2 to anyone watching.
- **A4** Voice-down plays audibly through the **room** speakers at threat ≥ 3.
- **A5** The phone, armed and **in a pocket**, rings and vibrates on escalation. Not the phone sitting unlocked on a table — in a pocket, which is the actual demo condition.
- **A6** Tapping `3` on the phone flips the dashboard to `dismissed_by_manager` within 1s, and that disposition appears in the PDF.
- **A7** `INCIDENT REPORT` opens a print preview showing header, frames, action log, and disposition, with **no `localhost` in the margins**.
- **A8** With the laptop offline, `D` still completes the loop end to end.
- **A9** The full loop runs **twice consecutively** without reloading anything.

A9 is the one people skip and regret — judges ask you to do it again. A5 is the one that looks fine on a desk and fails on a body.

---

## 9. Risk register

| # | Risk | Mitigation |
|---|---|---|
| R1 | Wrong camera selected on stage rig | Enumerate devices, pin `deviceId` in fixtures, test on the real machine + display |
| R2 | Stage lighting breaks the gate | `DIFF_RATIO` slider in the debug panel; tune on stage at 9:20; `T` as insurance |
| R3 | Network drops mid-demo | Phone hotspot, not conference wifi (§5.0); 6s timeout → silent canned fallback |
| R4 | API key missing or rate-limited | Set at minute zero, verify with one round-trip before any code |
| R5 | Callwright eats the evidence PDF | 8:25 gate, one person, and only after the simulated card already works |
| R6 | Print drops background colors | `print-color-adjust: exact`; check print preview by 9:20 |
| R7 | Merge conflicts with no time to resolve | Strict file ownership per track (§3 layout), no shared files |
| R8 | Phone locks, silences, or rings for real mid-demo | Auto-Lock **Never**, ring switch **on**, DND **off**, wake lock in the arming tap |
| R9 | Phone's audio session dies | It is lost on reload — **never reload `/oncall` after arming** |
| R10 | Chrome prints `localhost:3000` in the page margins | Uncheck "Headers and footers" once, before the demo; it persists |
| R11 | Print job hangs on multi-MB base64 frames | Downscale to 320px JPEG q=0.7 before embedding (§5.5) |
| R12 | Hotspot behaves differently than expected | Switch to it **before the 9:00 rehearsal**, not before the pitch |

---

## 10. Run of show — 3 minutes

**Roles:** PRESENTER (talks, phone armed and pocketed) · INTRUDER (walks into frame) · OPERATOR (laptop, finger on `T`, never speaks).

**Pre-flight, before you walk on:** phone on hotspot, `/oncall` open, `GO ON DUTY` tapped, auto-lock off, DND off, ring switch on, phone in pocket. Audio output set to the room PA. Chrome print headers unchecked. Camera permission already granted. **Do not reload anything after this point.**

| Time | Beat |
|---|---|
| 0:00 | Cold open, no slides. Dashboard live. *"Right now we're watching forty thousand doors. This one — Maple Grove, Unit 4B — has been vacant twelve days."* |
| 0:12 | INTRUDER enters frame behind presenter, approaches the door |
| 0:15 | Scan sweep. OPERATOR's finger on `T` as insurance |
| 0:18 | Threat card slides in. **Presenter does not narrate it. One beat of silence.** Let it land |
| 0:22 | Voice-down through room speakers. INTRUDER freezes, backs out — *rehearse this beat* |
| 0:30 | *"No guard on site. Nobody watching a wall of monitors."* |
| 0:35 | **Phone rings in the presenter's pocket.** Pull it out in front of the room, swipe to answer, hold to the mic. Dashboard mirrors the phone screen live. Three numbered buttons. Tap `3` |
| 0:52 | Call's closing line — *"Evidence report is on your dashboard"* — is the cue to turn to the laptop |
| 0:55 | *"That's the part nobody sells. We don't hand you an alert. We make the decision."* |
| 1:05 | Click `INCIDENT REPORT`. *"Timestamped frames. Classification chain. Every action. Final disposition. This document is how a squatter gets evicted and a claim gets paid."* |
| 1:25 | Market: a 24/7 post is 4.5 FTEs; contract security is already outsourced at scale. **Only verified numbers get spoken** |
| 1:45 | *"We're not software. We're the security operator. Priced per door, per month."* |
| 2:00 | Moat, verbatim: *"Competitors see pixels. Because we deliver the service, we see outcomes — and outcomes are what train the model, set the margin, and price the insurance."* |
| 2:20 | Every incident closes with a disposition. That label is the training data, the gross margin, and eventually the actuarial table |
| 2:40 | Ask: pilot on one operator's vacant stock. Family offices close in days |
| 2:50 | *"That was a two-hundred-thousand-dollar-a-year guard post, replaced. Now imagine forty thousand doors."* |

**When something fails:** gate doesn't trip by 0:17 → OPERATOR presses `T`, says nothing. Phone doesn't ring by 0:37 → OPERATOR triggers the laptop's full-screen call card through the PA while the presenter says *"and the on-call manager gets this"* without breaking stride. Catastrophe → cut to the 9:30 backup video and narrate over it live.

Never say "it worked in testing." Nobody has ever recovered a room with that sentence.

---

## 11. Judge-specific notes

| Judge / company | Hook | Our line |
|---|---|---|
| **VOYGR** (Vlad) — judging, $1,500 Callwright prize | The escalation call | 8:25 gate. If one call lands, screen-record it and say so on stage while running local |
| **Phonely** (Will) | Identical thesis, different vertical | *"You replaced the call center. We replace the guard station."* |
| **Miso** (Aoden) | Emotive TTS | Pre-rendered MP3 only — their voice, zero live dependency |
| **Hexclave** (Konstantin) — $1,000 | Dashboard auth | Only after 9:50, only if clean |
| **Momentic** (Jeff) | Testing | We have explicit acceptance criteria (§8) — say so if asked |
| **CrustData** | — | Skip. Forced fit, and the PRD already ruled it out |

Track: **AI-Native Service Companies (Alströmer)** primary, **SaaS Challengers** secondary.

---

## 12. What we say when a judge pushes back

- *"Won't Verkada/Ambient just do this?"* → They sell software and see pixels. We deliver the service and see outcomes. Different data, different margin structure, different business.
- *"Is any of this real?"* → The vision loop is live and running right now. The PMS feed and guard dispatch are simulated, and they're labeled that way on screen.
- *"Have you trained anything?"* → No. Tonight we built the system that captures the labels. The training set is what the service produces in month one.
- *"What about liability / recording consent / spoofed feeds?"* → Real risks, named in our PRD, not pretended away. California two-party consent, use-of-force exposure on dispatch, and adversarial video are all live issues we'd have to solve before selling.

Anything marked `[verify]` in the PRD stays unspoken.
