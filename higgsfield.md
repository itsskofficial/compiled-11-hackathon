# Higgsfield — generated assets for the demo video

Prompts and asset plan for the B-roll in `script.md`. Read the line in §1 before generating anything.

---

## 1. The line — what we generate and what we never generate

**Generate:** establishing shots, market-context B-roll, the closing scale shot. Material that is obviously illustrative and carries no evidentiary claim.

**Never generate:**

| Never | Why |
|---|---|
| The security-camera footage (shots 3, 5) | The pitch says *"Claude looked at the actual frames."* If those frames are synthetic, that sentence becomes false and the entire evidence argument collapses |
| Anything inside the camera tile | Same reason. What's in the tile is what the model actually saw |
| The threat card, dashboard, or PDF | Screen captures of the real product. A generated UI is a mockup, and judges can tell |
| The phone screen or the call | Real Phonely output |

The product shots are the proof. The generated shots are the wallpaper around them. **If a viewer can't tell which is which, we've built the wrong video** — so keep generated material to context and scale, never to evidence.

This isn't only principle. Warden is a physical-security product whose named risks in `prd.md` include *adversarial spoofing and deepfakes of video feeds*. Presenting synthetic footage as camera evidence in our own demo would be a bad look in front of a panel that will notice.

---

## 2. Using our faces

Shots 1, 6, and 8 are the three of us on camera. **Shoot those live.** Real presenter-to-lens delivery beats generated likeness for a 10-second piece to camera, and it costs less time than getting a face model to look right.

If you do want generated presenter material — a stylised title moment, a stylised close — here's the asset prep:

**Reference stills per person (each of the three of us):**
- 3–4 frames: straight-on, slight left, slight right, one at 3/4
- Even front lighting, no hard shadow across the face, no backlight
- Neutral expression, eyes open, looking at the lens
- Plain background, shoulders in frame
- Same clothing as the live shots, so generated and filmed material intercut cleanly

**Consent:** each person supplies and approves their own reference stills, and sees the output before it ships. Trivially satisfied here since we're all in the room — but it's the reason to use our own faces and nobody else's.

---

## 3. Global settings

- **Aspect ratio 16:9**, matching the screen captures. Do not mix in 9:16.
- **Duration 3–5s per clip.** These are cutaways, not scenes.
- **Grade for continuity:** muted teal shadows, warm amber practicals, slightly desaturated. This matches the dark ops dashboard so generated B-roll and product capture feel like one film.
- **Motion:** slow and deliberate. Slow push, slow pull-back, slow drift. No whip pans, no crash zooms — the video's register is institutional, not action.
- **No text, no logos, no watermarks** in generated frames.
- Append to every prompt: `cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark`

---

## 4. The prompts

### 4.1 Establishing — the vacant unit *(slots before Shot 2, or under the Shot 2 VO)*

> Exterior of a three-story American garden-style apartment complex at night, approximately 9:40 PM. Sodium streetlights. One second-floor unit is completely dark while neighbouring windows glow warm. Empty parking spaces directly below it. Light rain on asphalt, reflections. Muted teal and amber grade. No people. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark.

**Camera:** slow push in toward the dark window. **4s.**
**Use:** the strongest opener for "this one has been empty for twelve days."

### 4.2 The empty unit interior *(cutaway, Shot 2 or 3)*

> Interior of a completely empty American apartment unit mid-turnover. Bare beige carpet with vacuum lines, white walls with patched and sanded drywall, blue painter's tape on the trim, no furniture at all. Late evening light through vertical blinds casting long shadows across the floor. One bare ceiling bulb. Muted grade. No people. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark.

**Camera:** slow drift left to right. **4s.**
**Use:** makes "vacant, turnover day 12 of 21" concrete.

### 4.3 The guard post *(market context, under the Shot 1 or Shot 8 VO)*

> A single uniformed security guard sitting inside a small illuminated guard booth at the vehicle entrance to a residential property at 3 AM. Seen from outside in a wide shot. Cold fluorescent light inside the booth, everything around it dark and empty. A sense of isolation and expense. Muted teal grade. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark.

**Camera:** static, very slow push. **4s.**
**Use:** the two-hundred-thousand-dollar line in Shot 1. This is the thing being replaced — show it once.

### 4.4 The unwatched monitor wall *(market context)*

> A dim security control room with a wall of twenty-four CCTV monitors showing empty hallways, stairwells and parking lots. One empty office chair pushed back from the desk. Nobody is watching. Cold blue monitor glow is the only light. Muted grade. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark.

**Camera:** slow push toward the empty chair. **4s.**
**Use:** pairs with *"nobody watching a wall of monitors."* The empty chair is the whole point — don't put a person in it.

### 4.5 Construction site at night *(portfolio breadth)*

> Night exterior of an unfinished mid-rise timber-frame construction site behind a chain-link fence. Stacked lumber, coiled copper wire spools, orange safety netting. A single work light on a stand. Nobody present. Moody, muted teal and amber grade. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark.

**Camera:** slow lateral dolly along the fence. **3s.**
**Use:** one-second flash while the left rail shows six property types. Sells portfolio breadth without a word.

### 4.6 Seasonal-vacant estate *(the HNW segment)*

> Aerial approach at dusk toward a large modern hillside estate. Every window dark. Empty circular driveway, manicured but unlit grounds, vineyard rows on the hillside beyond. Nobody present. Muted teal and amber grade. Cinematic, photorealistic, shallow depth of field, no on-screen text, no watermark.

**Camera:** slow aerial push in. **3s.**
**Use:** shows the family-office segment exists without spending narration on it.

### 4.7 The closing scale shot *(Shot 8 — the money frame)*

> Slow aerial pull-back at night revealing an ever-expanding grid of apartment complexes and single-family neighbourhoods stretching to the horizon. Thousands of windows, some lit, many dark. Streetlights in ordered rows. Epic sense of scale. Muted teal and amber grade. Cinematic, photorealistic, no on-screen text, no watermark.

**Camera:** continuous slow aerial pull-back, no cuts. **5s — the longest clip in the film.**
**Use:** lands under *"Now imagine forty thousand doors."* Start the pull-back on the word "imagine" and let it run past the last word.

---

## 5. Where each clip goes

| Clip | Script slot | Length |
|---|---|---|
| 4.3 Guard post | Under Shot 1 VO, after "two hundred thousand dollars a year" | 4s |
| 4.1 Vacant exterior | Opening of Shot 2, before cutting to dashboard | 4s |
| 4.2 Empty interior | Optional cutaway inside Shot 2 | 4s |
| 4.5 Construction | One-second flash during the property rail | 1s from 3s |
| 4.6 Estate | One-second flash during the property rail | 1s from 3s |
| 4.4 Monitor wall | Optional, under Shot 8 moat line | 3s |
| 4.7 Scale pull-back | Shot 8, final frames | 5s |

**Total generated material: roughly 20 seconds of a 2-minute film.** That ratio is deliberate. If generated B-roll starts outweighing product capture, the video stops being a demo and becomes an ad.

---

## 6. Quality bar — reject and regenerate if

- Any human face appears in a clip that should have none (4.1, 4.2, 4.5, 4.6, 4.7)
- Text, signage, or watermarks are legible anywhere in frame
- Windows or architecture warp during camera movement
- The grade clashes with the dashboard captures — regenerate rather than fixing in post
- It looks like stock footage. Generic beats wrong, but *specific* beats both

Generate two variants of 4.1 and 4.7. Those two carry the most weight and are worth the extra minutes.
