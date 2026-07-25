# Warden — Demo Video: shot list, script, and production notes

**Outline only.** Real timings, real classification text, and real frame counts get filled in once the product runs. Everything marked `[FILL]` is a blank to close at 9:25 PM, not a decision to make now.

Companion to `trd.md` §10 (live run of show). This document covers the **recorded** artifact; §10 covers the **live** performance. They are not the same cut and should not be conflated.

---

## 0. What this video is for

It has two jobs, and they pull in different directions:

1. **Insurance (primary).** If the gate misfires, the wifi dies, or the phone doesn't ring on stage, the presenter plays this and narrates over it live. This is the job that justifies the 9:30 PM hard stop.
2. **Submission artifact (secondary).** Judging starts at 10:00 PM and demos are optional; a recording is what survives the night.

**The tension:** insurance wants *no narration baked in* so the presenter can talk over it. Submission wants narration. **Resolve it by recording product audio only** — voice-down, call audio, no human voice. The presenter narrates live in both cases. If a narrated cut is wanted later, add it in post when there's no clock.

---

## 1. Hard rules

- **9:25 PM — FREEZE.** No commits, no refactors, no "one quick fix." The thing you record is the thing you demo.
- **9:30 PM — record.** Non-negotiable per `trd.md` §0. A perfect demo you failed to capture is worth nothing at 9:58.
- **Record before you tune.** If the gate needs stage-lighting tuning, record a good take first, then tune. Never the reverse.
- **Two takes minimum, three if time.** Keep the best. Do not review between takes — shoot, shoot, shoot, then pick.
- **Nobody touches the repo during recording.** One person operates, one performs, one holds the camera.

---

## 2. Capture setup — two sources, and take B is the one that matters

**Source A — screen recording.** QuickTime → File → New Screen Recording, or `Cmd+Shift+5`. Crisp dashboard and PDF detail.

> **Gotcha:** macOS screen recording does **not** capture system audio without a virtual audio device. Do not install one tonight. Instead, **select the built-in microphone** in the capture options and let the room mic pick up the voice-down through the speakers. Slightly roomy, entirely adequate, zero setup risk.

**Source B — a second phone, filming the whole rig.** Laptop screen, presenter, the intruder walking in, and the on-call phone ringing and being answered. Lower fidelity, but it is the **only** source that captures the physical phone moment — which is the emotional peak of the demo.

**If you only have time for one, shoot B.** A shows the product; B shows the product *working in the world*, and B is what a judge remembers.

Prop the second phone at laptop height, landscape, far enough back to frame the laptop screen and the presenter's torso in the same shot. Lock exposure and focus before rolling (tap and hold on iOS).

---

## 3. Pre-flight checklist — run this before the first take

Copy of the stage pre-flight in `trd.md` §10, because the recording has the same failure modes as the live demo:

- [ ] On the phone hotspot, **not** conference wifi
- [ ] `/oncall` open on the presenter's phone, `GO ON DUTY` tapped, phone in pocket
- [ ] Auto-Lock **Never** · ring switch **on** · DND **off** · ringer volume max
- [ ] Audio output → room speakers, volume checked (the voice-down must be audible to the mic)
- [ ] Camera permission already granted, correct `deviceId` selected
- [ ] Chrome print dialog: "Headers and footers" **unchecked**
- [ ] Dashboard reset to clean state (`R`), event stream empty
- [ ] Operator's finger on `T`
- [ ] **Nothing gets reloaded after this point**

---

## 4. Shot list

Target: **75–90 seconds.** Long enough to show the full loop, short enough that the presenter can narrate over it without rushing.

| # | Shot | Source | Duration | What must be visible |
|---|---|---|---|---|
| 1 | Dashboard at rest | A + B | 0:00–0:06 | Six properties, Maple Grove 4B armed, live camera tile, clock running with seconds |
| 2 | Intruder enters frame | B (A also) | 0:06–0:12 | A person walking into the camera's view, approaching the door |
| 3 | Gate trips, scan sweep | A | 0:12–0:15 | The diff sparkline spiking, then the sweep |
| 4 | Threat card slides in | A | 0:15–0:22 | `[FILL: threat level]`, `[FILL: behavior string]`, frame strip, timestamp with timezone |
| 5 | Voice-down fires | B (audio critical) | 0:22–0:28 | Audible announcement; intruder freezes and backs out |
| 6 | Phone rings in pocket | **B only** | 0:28–0:38 | Presenter pulls phone out, swipes to answer. Dashboard mirrors the phone screen |
| 7 | Three options, tap dismiss | B, then A | 0:38–0:48 | Numbered buttons, finger taps `3`, dashboard flips to `dismissed_by_manager` |
| 8 | Open incident report | A | 0:48–0:58 | Click `INCIDENT REPORT`, print preview fills the screen |
| 9 | Scroll the PDF | A | 0:58–1:15 | Header + case number, property/lease block, frame strip with hashes, action log, disposition box, attestation footer |
| 10 | Rest on the attestation | A | 1:15–1:20 | Hold 3 seconds on the signature block. Let it read as a legal document |

**Shot 9 is the one people rush.** The PDF is the moat made visible; give it real screen time and scroll slowly enough to read section headers.

---

## 5. Narration — spoken live, never recorded

Use the beats from `trd.md` §10 verbatim. Abbreviated cue sheet for narrating over the video:

| Video time | Cue |
|---|---|
| 0:00 | *"Right now we're watching forty thousand doors. This one — Maple Grove, Unit 4B — has been vacant twelve days."* |
| 0:15 | **Say nothing.** Let the threat card land. One full beat of silence |
| 0:28 | *"No guard on site. Nobody watching a wall of monitors."* |
| 0:38 | *"That's the part nobody sells. We don't hand you an alert. We make the decision."* |
| 0:48 | *"Timestamped frames. Classification chain. Every action. Final disposition."* |
| 1:15 | *"This document is how a squatter gets evicted and a claim gets paid."* |

Then straight into market → what we are → moat → ask, per `trd.md` §10. The video ends; the pitch continues.

---

## 6. If something fails mid-take

Do not stop rolling. Keep the camera running and recover in character — a clean recovery is usable footage, a stopped take is thirty wasted seconds.

- Gate doesn't trip → operator presses `T`. Identical on screen.
- Phone doesn't ring → operator triggers the laptop call card. Reframe to the laptop.
- Claude call times out → the canned fallback fires silently. Nothing visible changes.
- Anything worse → let the take die, reset with `R`, go again. You have time for three takes and you only need one.

---

## 7. Post-record checklist — 9:38 PM at the latest

- [ ] **Play the file back, with sound, start to finish.** A recording nobody watched is not insurance
- [ ] Voice-down audible? Phone ring audible? PDF text legible at playback size?
- [ ] File saved somewhere reachable without wifi — local disk, not cloud-only
- [ ] Opened in the app you'd actually present from, full-screen, on the presentation display
- [ ] Best take renamed obviously (`warden-demo-FINAL.mov`) so nobody fumbles at 10:05
- [ ] Phone re-armed and back in pocket for the live attempt

---

## 8. What to fill in once the product runs

| Placeholder | Where | Source |
|---|---|---|
| `[FILL: threat level]` | Shot 4 | Actual classification output |
| `[FILL: behavior string]` | Shot 4 | Actual model output — do **not** pre-write it |
| `[FILL: real shot timings]` | §4 | First rehearsal take at 9:00 |
| `[FILL: case number]` | Shot 9 | Generated incident ID |
| `[FILL: total runtime]` | §4 | Final cut |

**Do not script the behavior string in advance.** If the card says something different on the night, the presenter reads what's on screen. Narrating a line the model didn't produce is the one thing in this demo that would actually be dishonest — and with Momentic and Phonely on the panel, someone will be watching the screen rather than the presenter.
