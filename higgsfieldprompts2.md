# Higgsfield — round 2: generated coverage

Shot 8 is in the can, shot live. These prompts cover everything else except screen capture.

Extends `higgsfield.md`. Where they conflict, this file is current.

---

## 1. The new structure

Shot 8 being real changes the film's shape, and for the better: **generated atmosphere throughout, real product capture in the middle, one human face at the end.** The film opens impersonal and institutional, then a person appears and closes it. That's a stronger arc than the original talking-head bookend.

| Segment | Source |
|---|---|
| Cold open | **Generated** |
| The property, the intruder | **Generated** coverage |
| Detection, threat card, report | **Real screen capture** — unchanged |
| The call | **Generated** coverage + real screen capture |
| Close | **Live — already shot** |

## 2. The one constraint

Whatever appears **inside the camera tile** must be footage the product actually classified. Someone still walks in front of the webcam once, so Claude has something real to look at. That take doesn't need to be pretty — it's never seen full-frame, only inside the dashboard tile.

Generated clips are the cinematic coverage *around* that. So:

- **Never say "Claude looked at these frames" over generated footage.** Say it over the screen capture, where it's true.
- The generated intruder is a dramatization of the scenario. The detection is real. Those are two different things and the edit should keep them visually distinct — generated material is wide, atmospheric, exterior; product material is screen.

## 3. The continuity trick — read before generating

The generated intruder and the real person in the camera tile are not the same human, and a viewer who notices will notice hard.

**Solution: never let the generated figure be identifiable.** Every prompt below keeps them backlit, from behind, distant, or cropped. No faces, no distinguishing clothing. A dark silhouette at a door intercuts with anyone. This is also just better craft — an unidentifiable figure at a door is more unsettling than a visible face.

**Wardrobe match:** whoever walks in front of the webcam should wear a dark jacket, so the real tile footage and the generated silhouettes agree.

## 4. Global settings

- **16:9.** Match the screen captures.
- **3–5s per clip.**
- **Grade to Shot 8.** Pull a still from the live footage and match generated material to it — that's now the reference, not an abstract palette. Broadly: muted teal shadows, warm amber practicals, desaturated.
- **Slow motion only.** Push, pull, drift. No whips, no crash zooms.
- Append to every prompt: `cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark, no visible faces`

---

## 5. Cold open — replaces Shot 1

Three clips cut together, roughly 10 seconds, under the "two hundred thousand dollars a year" voiceover.

### 5.1 The guard booth

> A single uniformed security guard sitting inside a small illuminated guard booth at the vehicle entrance to a residential complex at 3 AM, seen from far outside in a wide shot. Cold fluorescent light inside the booth, everything around it dark and empty. Seen from behind and at distance, face not visible. A sense of isolation and expense. Muted teal grade. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark.

**Camera:** static, very slow push. **4s.**

### 5.2 The unwatched monitors

> A dim security control room with a wall of twenty-four CCTV monitors showing empty hallways, stairwells and parking lots. One empty office chair pushed back from the desk. Nobody present. Cold blue monitor glow is the only light in the room. Muted grade. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark.

**Camera:** slow push toward the empty chair. **4s.**
**Note:** the empty chair is the entire point. If a person appears, regenerate.

### 5.3 The dark unit

> Exterior of a three-story American garden-style apartment complex at night, approximately 9:40 PM. Sodium streetlights. One second-floor unit completely dark while neighbouring windows glow warm. Empty parking spaces below it. Light rain on asphalt with reflections. Muted teal and amber grade. No people. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark.

**Camera:** slow push in toward the dark window. **4s.**
**Note:** generate two variants. This is the shot the film's premise rests on.

---

## 6. The intruder — replaces Shots 3 and 5

Four clips. This is the sequence that most needs the face rule.

### 6.1 Approach

> A dark silhouette of a person walking across an empty apartment complex courtyard at night, seen from behind at a distance. Sodium streetlight ahead casts them in near-total shadow. Wet concrete, empty parking spaces. Unhurried, ordinary walking pace. Face not visible. Muted teal grade. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark, no visible faces.

**Camera:** static wide, subject walks away from camera. **4s.**
**Note:** ordinary pace is doing work here. A creeping figure reads as pantomime.

### 6.2 At the door

> Backlit silhouette of a person standing squarely at an apartment unit door at night, seen from behind. Their hand reaches for the door handle. Porch light behind them renders them as a dark shape. No face visible. Peeling paint on the door frame, an unlit window beside it. Muted teal and amber grade. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark, no visible faces.

**Camera:** slow push from behind the figure toward the door. **4s.**

### 6.3 The handle — the money shot of this sequence

> Extreme close-up of a hand gripping and twisting a residential door handle in low light, then pulling against it with force. The door does not open. Shallow focus on the hand and handle, background fully out of focus. Cold light from one side. No face in frame. Cinematic, photorealistic, 35mm macro, no on-screen text, no watermark.

**Camera:** static macro, slight handheld drift. **3s.**
**Note:** this is the visual of *attempting* rather than *present* — the distinction the whole product rests on. Generate two variants and take the one where the force is most readable.

### 6.4 Deterred — walks away

> A dark silhouette of a person stepping back from an apartment door and walking away into the night, seen from behind at a distance. Unhurried, calm departure — walking, not running. Sodium streetlight, wet concrete, empty courtyard. Face not visible. Muted teal grade. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark, no visible faces.

**Camera:** static wide, subject walks away and out of frame. **4s.**
**Note:** **walking, not running.** Calm departure matches the disposition we claim — *deterred by voice*, not *pursued*. It's also more chilling.

---

## 7. The call — replaces Shot 6

Generated coverage, then cut to real screen capture of the call UI and the dashboard flip.

### 7.1 The phone rings

> Close-up of a phone lying face-down on a wooden table in a dimly lit room at night, screen-side down, vibrating. Warm lamp light from one side, everything else in shadow. A hand enters frame and picks it up. Face not visible, no screen content visible. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark, no visible faces.

**Camera:** static close-up, slight push. **4s.**
**Note:** face-down and screen-not-visible is deliberate — the real call UI comes from screen capture, so nothing generated has to match it.

### 7.2 Listening

> Over-the-shoulder shot of a person standing at a window at night holding a phone to their ear, seen from behind in silhouette against city lights. Calm, unhurried posture — routine, not alarmed. Face not visible. Muted teal and amber grade. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark, no visible faces.

**Camera:** slow drift right. **4s.**
**Note:** **posture must read as routine, not alarmed.** This manager gets these calls. Competence sells the service; panic sells a gadget.

---

## 8. Connective tissue — optional if the cut needs air

### 8.1 The empty unit interior

> Interior of a completely empty American apartment unit mid-turnover. Bare beige carpet with vacuum lines, white walls with patched drywall, blue painter's tape on the trim, no furniture. Late evening light through vertical blinds casting long shadows. One bare ceiling bulb. No people. Muted grade. Cinematic, photorealistic, shallow depth of field, 35mm, no on-screen text, no watermark.

**Camera:** slow drift left to right. **4s.**

### 8.2 Closing scale — under the last line of Shot 8

> Slow aerial pull-back at night revealing an ever-expanding grid of apartment complexes and single-family neighbourhoods stretching to the horizon. Thousands of windows, some lit, many dark. Streetlights in ordered rows. Epic sense of scale. Muted teal and amber grade. No people. Cinematic, photorealistic, no on-screen text, no watermark.

**Camera:** continuous slow aerial pull-back, no cuts. **5s — the longest clip.**
**Note:** starts on the word "imagine" and runs past the final word. Generate two variants.

---

## 9. Assembly

| Time | Content | Source |
|---|---|---|
| 0:00–0:10 | 5.1 → 5.2 → 5.3 | Generated |
| 0:10–0:20 | Dashboard at rest | **Screen capture** |
| 0:20–0:32 | 6.1 → 6.2 → 6.3 | Generated |
| 0:32–0:47 | Sweep, threat card | **Screen capture** |
| 0:47–0:55 | 6.4 + product voice-down audio | Generated + real audio |
| 0:55–1:05 | 7.1 → 7.2 | Generated |
| 1:05–1:15 | Call UI, dashboard flips | **Screen capture** |
| 1:15–1:38 | The report, slow scroll | **Screen capture** |
| 1:38–1:58 | Close | **Live — already shot** |
| 1:52–1:58 | 8.2 under the final line | Generated |

Roughly **50 seconds generated, 50 seconds screen capture, 20 seconds live.** The product still occupies the middle of the film, which is where it needs to be.

## 10. Reject and regenerate if

- A face is identifiable in any clip
- Any figure runs rather than walks
- Text, signage, or watermarks are legible
- Architecture or hands warp during movement (hands are the usual failure — check 6.3 closely)
- The grade doesn't match the Shot 8 still
- It looks like stock footage
