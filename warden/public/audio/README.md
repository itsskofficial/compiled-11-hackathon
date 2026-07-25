# Pre-rendered voice lines

Miso One is the voice of the product, shipped as files rather than a live API
call. Miso Labs open-sourced the 8B weights but their hosted API is announced and
not yet available, and a pre-rendered file is identical in every take anyway —
which is what you want when you are recording.

Render each line at <https://misolabs.ai>, download it, and save it here under
exactly these names. The app checks for the file first and silently falls back to
browser `speechSynthesis` if it is missing, so the loop works either way. The
action log records which source actually produced the audio, so the evidence
report stays truthful.

## Files to create

**`voicedown-primary.mp3`**

> This property is monitored. Security has been notified. Leave the premises now.

**`voicedown-short.mp3`**

> This property is monitored. Security has been notified.

**`escalation-script.mp3`** — the on-call script, roughly 23 seconds

> Warden security operations, priority alert. Verified intruder at Maple Grove,
> Unit four-B — vacant unit, day twelve of turnover. One adult at the rear entry,
> no uniform, attempting the door. Voice deterrent has fired. Press one to
> dispatch a guard. Press two to notify police. Press three to dismiss.

**`escalation-close.mp3`**

> Dismissed. Logged as a manager dismissal. Evidence report is on your dashboard.

## Notes

- Pick a calm, institutional delivery. The deterrent should read as a building
  speaking over a PA, not as an assistant.
- Keep "four-B" and "one, two, three" spelled as words so the model reads digits
  aloud correctly.
- The closing line is a deliberate handoff. It cues the cut to the laptop, so the
  report arrives feeling like a consequence of the call.
