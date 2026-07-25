# Warden — voiceover script and screen choreography

The narration for the product-capture segments, plus what the cursor is doing while it plays.

Supersedes the VO timings in `script.md`, which were written for the original 8-shot cut. Assembly reference is `higgsfieldprompts2.md` §9.

---

## 1. Which segments this covers

Four screen-capture segments, about **48 seconds** of the film. These are the ones showing the real product.

| Time | Segment | Length | VO words |
|---|---|---|---|
| 0:10–0:20 | Dashboard at rest | 10s | 25 |
| 0:32–0:47 | Detection and threat card | 15s | 34 + 1s silence |
| 1:05–1:15 | Call resolves, dashboard flips | 10s | 20 |
| 1:15–1:38 | The report | 23s | 40 |

Pacing assumes ~150 words per minute, which is a natural read with room to breathe. Every count above is deliberately under budget — the silences are the point.

---

## 2. Recording the VO

- **Record separately, after picture is locked.** Not while operating the laptop.
- Quietest room available. A phone's voice-memo app held 6–8 inches away and slightly off-axis beats a laptop mic in an open room.
- **Read about 20% slower than feels natural.** Everyone rushes VO. What feels ponderous in the room sounds measured in the cut.
- **Leave 2 seconds of silence between segments** so the editor has clean handles.
- Same flat, certain register as the live Shot 8. Institutional, not enthusiastic. No upward inflection at the ends of sentences.
- Record each segment **three times** in a row. Pick later, don't review in between.

---

## 3. Screen choreography — the part people forget

A screen capture is a performance. A confident cursor reads as product; a hunting cursor reads as a demo held together with tape.

**Before recording anything:**

- Browser **full-screen**. No dock, no menu bar, no bookmarks bar, no tab strip showing fourteen tabs.
- Dashboard reset to a clean state, event stream empty.
- Notifications silenced system-wide — one Slack toast ruins a take.
- Chrome print dialog: **"Headers and footers" unchecked**, so no `localhost` in the PDF margins.
- Practice each cursor move twice before rolling.

**Rules while rolling:**

- **Move the cursor deliberately, in straight lines.** No jitter, no circling, no hovering while you think.
- **Park the cursor off to the side** when it isn't doing anything. A cursor sitting on top of the threat card blocks the thing the audience is trying to read.
- **Never explore on camera.** Every click is rehearsed. If you have to look for something, the take is dead.
- Scroll with a trackpad at a **slow, even rate**. Practice the report scroll — it's the hardest move in the film.

---

## 4. Segment by segment

### 4.1 Dashboard at rest — 0:10–0:20

**On screen:** Dashboard idle. Six properties in the left rail, Maple Grove 4B armed and sorted first. Live camera tile centre, empty. Clock running with seconds and timezone.

**Cursor:** still, parked bottom-right. No movement at all in this segment.

**Must be visible:** the `vacant · turnover day 12` chip, and the `SIMULATED` tag on the PMS footer. Don't crop the label out — it reads as confidence.

**VO:**

> "Right now we're watching forty thousand doors.
>
> This one — Maple Grove, Unit 4B — has been empty for twelve days. Empty means armed."

---

### 4.2 Detection and threat card — 0:32–0:47

**On screen:** The frame-diff sparkline spikes. Red scan sweep crosses the camera tile. Threat card slides in with `[FILL: threat level]`, `[FILL: behavior string]`, the three-frame strip, and a timestamp with timezone.

**Cursor:** completely still, parked well clear of the card. Nothing is clicked in this segment.

**VO — note the silence first:**

> *(one full second of silence after the card lands — do not talk over it)*
>
> "That's not a scripted alert.
>
> Claude looked at three frames, half a second apart, and described what it saw.
>
> One frame tells you a person is there. Three tell you they're trying the door."

**The `[FILL]` rule:** read whatever the card actually says. If the model produced something other than what we expected, **the narration changes, not the card.** Never narrate a line the model didn't output.

**This is the only place in the film where we say Claude classified the footage — and it plays over real screen capture, which is why it's true.** Don't move this line over generated coverage.

---

### 4.3 The call resolves — 1:05–1:15

**On screen:** The on-call UI showing three numbered options, then the dashboard flipping to `dismissed_by_manager` with the action log gaining a row.

**Cursor:** off-screen or parked. The interaction here came from the phone, not the mouse — don't imply otherwise by moving the cursor.

**VO:**

> "We don't send an alert and hope somebody reads it.
>
> We call a human, and we get a decision."

---

### 4.4 The report — 1:15–1:38

**On screen:** Click `INCIDENT REPORT`. The print preview fills the screen — black on white, serif, nothing like the dashboard. Scroll slowly through: header and case number, property block with lease status, frame strip with hashes beneath each image, the raw model output, the action log, the disposition box. **Hold three full seconds on the attestation and signature block.**

**Cursor:** one deliberate move to the button, one click, then park it off the document entirely for the whole scroll.

**Scroll speed:** slower than feels right. If a viewer can't read the section headers, the shot failed and needs a retake. This is the longest single segment in the film for a reason.

**VO — pauses are marked and they matter:**

> "One click.
>
> *(pause)*
>
> Timestamped frames, each one hashed at capture. The model's raw output — not our summary of it. Every action, and who took it.
>
> *(pause — let the scroll run)*
>
> This document is how a squatter gets evicted, and how an insurance claim gets paid."

**The last line lands on the attestation block.** Time the scroll so the signature section is on screen as you say it.

---

## 5. Full continuous read

Record in one sitting, top to bottom, pausing 2 seconds between blocks. Includes the narration over generated footage so the register stays consistent across the whole film.

> **[over cold open]**
> A twenty-four-seven security guard post costs about two hundred thousand dollars a year.
> Here's what replaces it.
>
> **[over dashboard]**
> Right now we're watching forty thousand doors.
> This one — Maple Grove, Unit 4B — has been empty for twelve days. Empty means armed.
>
> **[over intruder coverage]**
> Nobody is watching this unit. That's the whole problem — you don't pay a guard to sit outside an empty apartment.
>
> **[over detection — one second of silence first]**
> That's not a scripted alert.
> Claude looked at three frames, half a second apart, and described what it saw.
> One frame tells you a person is there. Three tell you they're trying the door.
>
> **[over the figure walking away]**
> Most people leave right here. That's the cheapest outcome there is — and it's why this beats a camera that only records.
>
> **[over the call resolving]**
> We don't send an alert and hope somebody reads it.
> We call a human, and we get a decision.
>
> **[over the report]**
> One click.
> Timestamped frames, each one hashed at capture. The model's raw output — not our summary of it. Every action, and who took it.
> This document is how a squatter gets evicted, and how an insurance claim gets paid.
>
> **[Shot 8 is live sync sound — do not re-record]**

Total VO: roughly **185 words**, about 75 seconds of speech across a 2-minute film. The remaining 45 seconds are product audio, the voice-down, and silence — and the silence is doing as much work as the words.

---

## 6. Blanks

| Placeholder | Segment | Source |
|---|---|---|
| `[FILL: threat level]` | 4.2 | Actual classification |
| `[FILL: behavior string]` | 4.2 | Actual model output |
| Case number | 4.4 | Generated incident ID |

## 7. What we never say

- Any statistic marked `[verify]` in `prd.md`.
- That the PMS feed is a live Yardi connection. The lease-to-threshold logic is real code; the connection is simulated and labeled on screen.
- That we trained anything on outcome labels. If asked: *"Tonight we built the thing that produces the training data. The training set is what month one of the service produces."*
- Any behavior string the model didn't actually output.
