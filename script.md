# Warden — shooting script

Word-for-word narration plus camera specs. Companion to `demo.md` (which explains *why*); this is what we say, where the camera goes, and who does what.

**Runtime target 2:00.** Shot in pieces, edited together.

---

## Legend — who's in front of the lens

| Tag | Meaning |
|---|---|
| **ACTING** | A camera pointed at us. A person performs. Nothing from the product on screen |
| **PRODUCT** | Screen recording. No people. Whatever the software actually did |
| **BOTH** | A camera on the room, catching a person *and* the product doing something at the same time |

**The one thing to understand:** in Shot 3 the acting *is* the product input. One of us walks up to a door while the webcam is watching, so the same performance is both the thing we staged and the thing Claude genuinely classified. **We are not faking the detection. We are staging an intrusion so there is something real to detect.** Say exactly that if a judge asks.

| Shot | Source | Runs | Camera |
|---|---|---|---|
| 1 Cold open | ACTING | 0:00–0:10 | Phone A, medium, static |
| 2 Dashboard | PRODUCT | 0:10–0:20 | Screen capture |
| 3 The intruder | ACTING | 0:20–0:30 | Phone A, wide, static |
| 4 Detection | PRODUCT | 0:30–0:45 | Screen capture |
| 5 Voice-down | BOTH | 0:45–0:55 | Phone A, wide, static (same setup as 3) |
| 6 The call | BOTH | 0:55–1:20 | Phone A, medium → cut to screen capture |
| 7 The report | PRODUCT | 1:20–1:40 | Screen capture |
| 8 Close | ACTING | 1:40–2:00 | Phone A, medium, static (match Shot 1) |

---

## Crew and gear

Three people, three jobs. Nobody does two at once.

- **PRESENTER** — on camera in shots 1, 6, 8. Holds the on-call phone.
- **INTRUDER** — on camera in shots 3 and 5. Never speaks.
- **OPERATOR** — runs the laptop, starts and stops recordings, holds/positions Phone A. Never appears.

**Gear:** Phone A (the filming camera — must NOT be the on-call phone) · the presenter's phone (on-call, rings in shots 6) · the laptop (webcam + dashboard + screen capture).

**Screen capture:** `Cmd+Shift+5` → Record Selected Portion, framed tight on the browser window. **Select the built-in microphone** — macOS won't capture system audio without a virtual audio device, and we are not installing one tonight.

**Start a screen recorder early and leave it running.** We'll accidentally capture our best take of the pipeline working while testing it.

---

## The physical setup — build this once, don't move it

Shots 3, 5, and 6 share one setup. Strike it and you can't re-shoot for continuity.

- **The "unit door":** any real door, or a doorway with a marked frame. It needs a handle the intruder can visibly try.
- **The laptop webcam:** on a table or stack of boxes, **chest height**, pointed at the door from roughly 3–4 metres, angled slightly down. This is the "security camera" and its framing is what ends up in the evidence PDF — so frame it like a real one: door centred, some floor and wall for context.
- **Phone A:** on a tripod, stack of books, or taped to a chair — **do not hand-hold**. Placed to one side of the webcam so it sees the intruder *and* a sliver of the laptop screen if possible.
- **Lighting:** overhead light on, and **never shoot into a window or lamp.** Backlight turns the intruder into a silhouette and wrecks both the video and the classification. If the room is dim, put a desk lamp behind Phone A pointing at the door.
- **Lock exposure and focus** on Phone A before rolling (tap and hold on the door until AE/AF LOCK appears). Otherwise the phone re-exposes when someone walks in and the shot pulses.

**Consistency rule:** shots 3, 5, and 6 must look like the same moment. Same lighting, same wardrobe, same camera position. Shoot them back to back.

---

## SHOT 1 — Cold open · ACTING · 0:00–0:10

**Camera:** Phone A, static, landscape. **Medium shot, chest-up.** Lens at the presenter's eye height — not below, which reads as amateur. Plain wall behind, no clutter, no whiteboard with someone else's notes. Presenter looks **straight down the lens**, not at the operator.

**On camera, sync sound:**

> "A twenty-four-seven security guard post costs about two hundred thousand dollars a year.
>
> Here's what replaces it."

**Note:** Hard cut on "it." No smile, no windup, no "hi, we're team X." The first frame should feel like a product, not an introduction.

---

## SHOT 2 — The dashboard · PRODUCT · 0:10–0:20

**Camera:** Screen capture only. Frame tight on the browser — no dock, no menu bar, no tab strip with fourteen tabs. Full-screen the browser first.

**Visual:** Dark ops dashboard at rest. Six properties down the left rail, Maple Grove 4B armed and sorted first. Live camera tile centre, empty. Clock running with seconds **and timezone**.

**Voiceover:**

> "Right now we're watching forty thousand doors.
>
> This one — Maple Grove, Unit 4B — has been empty for twelve days."

**Must be visible:** the `vacant · turnover day 12` chip, and the `SIMULATED` label on the PMS footer. Don't hide the label — it reads as confidence.

---

## SHOT 3 — The intruder · ACTING · 0:20–0:30

**Camera:** Phone A, static, **wide** — full body, floor to above head, door in frame. Wide enough that the audience sees this is a real space and not a crop.

**Action:** The intruder walks into frame, looks around once, goes to the door, tries the handle. **Unhurried.** No hoodie, no theatrics — a person calmly testing a door is more unsettling than a costume. They stay at the door.

**Voiceover:**

> "Nobody is watching this unit. That's the whole problem — you don't pay a guard to sit outside an empty apartment."

**This is us, and we say so if asked.** Never use footage from the internet: it's someone else's copyright, someone else's real crime, and a judge who recognises the clip stops believing everything else in the video.

---

## SHOT 4 — Detection · PRODUCT · 0:30–0:45

**Camera:** Screen capture. Frame on the camera tile and the right rail together so the sweep and the card are both in shot — don't crop the card out chasing the video tile.

**Visual:** Frame-diff sparkline spikes. Red scan sweep crosses the camera tile. Threat card slides in — `[FILL: threat level]`, `[FILL: behavior string]`, the three-frame strip, timestamp with timezone.

**Hold one full second of silence after the card lands.** Do not talk over it. The instinct to fill the gap is wrong.

**Voiceover, after the beat:**

> "That's not a scripted alert.
>
> Claude looked at three frames, half a second apart, and described what it saw. One frame can only tell you a person is there. Three can tell you they're trying the door.
>
> Vacant unit — so the threshold was already lower."

**`[FILL]` rule:** read whatever is on the card. If the model said something other than what we expected, **the narration changes, not the card.**

---

## SHOT 5 — Voice-down · BOTH · 0:45–0:55

**Camera:** Phone A, **same position as Shot 3.** Do not move it. Wide.

**Product audio** — Miso One, played from the rendered file, not spoken by us:

> "This property is monitored. Security has been notified. Leave the premises now."

**Acting:** The intruder freezes mid-reach, glances toward the speaker, backs out of frame. **Rehearse this.** It's the most satisfying beat in the video and it's ruined by hesitation or by hamming. Two or three takes minimum.

**Audio note:** the laptop speakers must be loud enough for Phone A's mic to pick up cleanly from where it's standing. Test it before the intruder is in position.

**Voiceover, after they've left frame:**

> "Most people leave right here. That's the cheapest outcome there is — and it's why this beats a camera that only records."

---

## SHOT 6 — The call · BOTH · 0:55–1:20

**Camera:** Phone A, **medium** — presenter from waist up, so the audience sees the phone come out of the pocket. Then **cut to screen capture** for the dashboard flip, then optionally back.

**Action:** The phone rings in the presenter's pocket — real ring, real vibration. They take it out, answer, hold it near their face where Phone A's mic can hear the audio.

**Product audio** — Phonely, the actual call:

> "Warden security operations, priority alert. Verified intruder at Maple Grove, Unit four-B — vacant unit, day twelve of turnover. One adult at the rear entry, no uniform, attempting the door. Voice deterrent has fired.
>
> Press one to dispatch a guard. Press two to notify police. Press three to dismiss."

**Acting:** Presenter presses **3** on camera — make the thumb movement visible, don't hide the screen. **Cut to screen capture, two seconds:** the dashboard flips to `dismissed_by_manager` while they're still holding the phone.

**Voiceover:**

> "We don't send an alert and hope somebody reads it. We call a human, and we get a decision.
>
> That's the difference between software and a service."

**Phone hygiene before this take:** Do Not Disturb **off** (it has to ring) but every other app's notifications silenced, ringer volume max, auto-lock set to Never, and the screen wiped — a smeared screen on camera looks careless.

**If they'd pressed one instead:** the dispatch path checks through VOYGR that the guard company is a real, currently-operating business. Worth one extra line if the cut has room.

---

## SHOT 7 — The report · PRODUCT · 1:20–1:40

**Camera:** Screen capture, full-screen on the print preview. **Scroll slowly** — slower than feels natural.

**Visual:** Click `INCIDENT REPORT`. The preview fills the screen — black on white, serif, nothing like the dashboard. Scroll through: header and case number, property block with lease status, frame strip with hashes underneath, raw model output, action log, disposition box. **Hold three seconds on the attestation and signature block.**

**Voiceover:**

> "One click.
>
> Timestamped frames, each one hashed at capture. The model's raw output, not our summary of it. Every action taken, and who took it.
>
> This document is how a squatter gets evicted, and how an insurance claim gets paid."

**This is the shot everyone rushes.** It's the moat made visible. If a viewer can't read the section headers, the shot failed — reshoot it.

---

## SHOT 8 — Close · ACTING · 1:40–2:00

**Camera:** Phone A, **match Shot 1 exactly** — same position, same framing, same wall. The video should bookend. Shoot it immediately after Shot 1 if possible, while the setup is untouched.

**On camera, sync sound:**

> "Everyone else sells you cameras.
>
> Competitors see pixels. Because we deliver the service, we see outcomes — and outcomes are what train the model, set the margin, and price the insurance.
>
> That was a two-hundred-thousand-dollar-a-year guard post, replaced.
>
> Now imagine forty thousand doors."

**Note:** Land "forty thousand doors" and stop. No thank-yous, no team names, no outro beyond a logo card if one exists.

---

## Shooting order — not the same as the edit order

Shoot in the order that protects continuity and captures the hard stuff while there's time:

1. **Shots 3, 5, 6** — the physical setup, back to back, multiple takes each. Hardest to redo, so do them first.
2. **Shots 2, 4, 7** — screen captures. Repeatable at will as long as the product runs.
3. **Shots 1, 8** — presenter to camera, back to back for matching framing. Easiest, do them last.
4. **Narration** — recorded separately, somewhere quiet, once the picture is locked.

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
