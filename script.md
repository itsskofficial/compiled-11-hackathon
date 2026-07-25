# Warden — shooting script

Word-for-word. Companion to `demo.md` (which explains *why*); this is what we actually say and point the camera at.

**Runtime target 2:00.** Shot in pieces, edited together.

---

## Legend — who's in front of the lens

| Tag | Meaning |
|---|---|
| **ACTING** | A camera pointed at us. A person performs. Nothing from the product is on screen |
| **PRODUCT** | Screen recording. No people. Whatever the software actually did |
| **BOTH** | A camera pointed at the room, capturing a person *and* the product doing something at the same time |

**The one thing to understand:** in Shot 3 the acting *is* the product input. One of us walks up to a door and the webcam is watching — so the same performance is both the thing we staged and the thing Claude genuinely classified. We are not faking the detection. We are staging the intrusion so there is something real to detect.

| Shot | Source | Runs |
|---|---|---|
| 1 Cold open | ACTING | 0:00–0:10 |
| 2 Dashboard | PRODUCT | 0:10–0:20 |
| 3 The intruder | ACTING | 0:20–0:30 |
| 4 Detection | PRODUCT | 0:30–0:45 |
| 5 Voice-down | BOTH | 0:45–0:55 |
| 6 The call | BOTH | 0:55–1:20 |
| 7 The report | PRODUCT | 1:20–1:40 |
| 8 Close | ACTING | 1:40–2:00 |

Shots 1 and 8 are **on camera, sync sound** — the presenter talks to the lens. Everything between is **voiceover**, recorded separately somewhere quiet and laid over the footage.

---

## SHOT 1 — Cold open · ACTING · 0:00–0:10

**Visual:** Presenter, chest-up, plain wall. No screen visible. Look straight down the lens.

**On camera, sync sound:**

> "A twenty-four-seven security guard post costs about two hundred thousand dollars a year.
>
> Here's what replaces it."

**Note:** Hard cut on "it." No smile, no windup, no "hi we're team X." The first frame should feel like a product, not an introduction.

---

## SHOT 2 — The dashboard · PRODUCT · 0:10–0:20

**Visual:** Screen recording. Dark ops dashboard at rest. Six properties down the left rail, Maple Grove 4B armed and sorted first. Live camera tile centre, empty. Clock running with seconds **and timezone**.

**Voiceover:**

> "Right now we're watching forty thousand doors.
>
> This one — Maple Grove, Unit 4B — has been empty for twelve days."

**Must be visible:** the `vacant · turnover day 12` chip, and the `SIMULATED` label on the PMS footer. Don't hide the label — it gets read as confidence.

---

## SHOT 3 — The intruder · ACTING · 0:20–0:30

**Visual:** A camera on the room. One of us walks up to the door the webcam is pointed at, looks around, tries the handle. Unhurried. No hoodie, no theatrics — a person testing a door is more unsettling than a costume.

**Voiceover:**

> "Nobody is watching this unit. That's the whole problem — you don't pay a guard to sit outside an empty apartment."

**This is us, and we say so if asked.** We filmed our own intrusion. Never use footage from the internet: it's someone else's copyright, someone else's real crime, and a judge who recognises the clip stops believing everything else in the video.

---

## SHOT 4 — Detection · PRODUCT · 0:30–0:45

**Visual:** Screen recording. The frame-diff sparkline spikes. Red scan sweep crosses the camera tile. The threat card slides in — `[FILL: threat level]`, `[FILL: behavior string]`, the three-frame strip, timestamp with timezone.

**Hold one full second of silence after the card lands.** Do not talk over it.

**Voiceover, after the beat:**

> "That's not a scripted alert.
>
> Claude looked at three frames, half a second apart, and described what it saw. One frame can only tell you a person is there. Three can tell you they're trying the door.
>
> Vacant unit — so the threshold was already lower."

**`[FILL]` rule:** read whatever is on the card. If the model said something other than what we expected, the narration changes, not the card. Never narrate a line the model didn't produce.

---

## SHOT 5 — Voice-down · BOTH · 0:45–0:55

**Visual:** Camera on the room. Our "intruder" is still at the door. The speaker fires.

**Product audio — this is Miso One, played from the file, not us speaking:**

> "This property is monitored. Security has been notified. Leave the premises now."

**Acting:** The intruder freezes mid-reach, glances toward the speaker, backs out of frame. **Rehearse this.** It's the most satisfying beat in the video and it's ruined by hesitation or by hamming.

**Voiceover, after they've left frame:**

> "Most people leave right here. That's the cheapest outcome there is — and it's why this beats a camera that only records."

---

## SHOT 6 — The call · BOTH · 0:55–1:20

**Visual:** Camera on the presenter. The phone rings in their pocket — real ring, real vibration. They take it out, answer, hold it where the mic can hear.

**Product audio — Phonely, the actual call:**

> "Warden security operations, priority alert. Verified intruder at Maple Grove, Unit four-B — vacant unit, day twelve of turnover. One adult at the rear entry, no uniform, attempting the door. Voice deterrent has fired.
>
> Press one to dispatch a guard. Press two to notify police. Press three to dismiss."

**Acting:** Presenter presses **3** on camera. Cut to the screen for two seconds — the dashboard flips to `dismissed_by_manager` while they're still holding the phone.

**Voiceover:**

> "We don't send an alert and hope somebody reads it. We call a human, and we get a decision.
>
> That's the difference between software and a service."

**If they'd pressed one instead:** the dispatch path checks through VOYGR that the guard company is a real, currently-operating business. Worth one extra line if the cut has room — dispatching to a vendor that closed last month is a genuine failure mode.

---

## SHOT 7 — The report · PRODUCT · 1:20–1:40

**Visual:** Screen recording. Click `INCIDENT REPORT`. The print preview fills the screen — black on white, serif, nothing like the dashboard. **Scroll slowly.** Header and case number, the property block with lease status, the frame strip with hashes underneath, the raw model output, the action log, the disposition box. Hold three seconds on the attestation and signature block.

**Voiceover:**

> "One click.
>
> Timestamped frames, each one hashed at capture. The model's raw output, not our summary of it. Every action taken, and who took it.
>
> This document is how a squatter gets evicted, and how an insurance claim gets paid."

**Slower than feels natural.** This is the moat made visible and it's the shot everyone rushes. If a viewer can't read the section headers, the shot failed.

---

## SHOT 8 — Close · ACTING · 1:40–2:00

**Visual:** Presenter, same framing as Shot 1. Down the lens.

**On camera, sync sound:**

> "Everyone else sells you cameras.
>
> Competitors see pixels. Because we deliver the service, we see outcomes — and outcomes are what train the model, set the margin, and price the insurance.
>
> That was a two-hundred-thousand-dollar-a-year guard post, replaced.
>
> Now imagine forty thousand doors."

**Note:** Land "forty thousand doors" and stop. No thank-yous, no team names, no outro card beyond a logo if there's one.

---

## What we never say

- Any statistic marked `[verify]` in `prd.md`. If it isn't verified, it isn't spoken.
- That the PMS feed is a live Yardi connection. The lease-to-threshold logic is real code; the connection is simulated and labeled on screen.
- That we trained anything on outcome labels. We built the system that captures them. If asked: *"Tonight we built the thing that produces the training data. The training set is what month one of the service produces."*
- Any behavior string the model didn't actually output.

## Blanks to close once it runs

| Placeholder | Shot | Source |
|---|---|---|
| `[FILL: threat level]` | 4 | Actual classification |
| `[FILL: behavior string]` | 4 | Actual model output |
| Case number | 7 | Generated incident ID |
| Real per-shot timings | all | First full take |
