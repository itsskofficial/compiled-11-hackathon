# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Document precedence

Three specs exist and they do not all agree. In a conflict:

**`trd.md` wins, then `prd.md`, then this file.**

`prd.md` is the product argument — buyer, wedge, moat, pitch. Still authoritative on *why* and *what we claim*.
`trd.md` is the build spec, and it deliberately overrides several PRD decisions after re-scoping against the real clock. Read it before writing code. Where it contradicts the PRD, that contradiction is intentional and the reasoning is written out in place.

## Repository state

No application code yet — `prd.md`, `trd.md`, `README.md`, and this file. No package manifest, no tests, no CI.

The stack **is** chosen (`trd.md` §3): a single Next.js App Router app, TypeScript, Tailwind, zustand, `@anthropic-ai/sdk`. Scaffold and run:

```bash
npx create-next-app@latest warden \
  --typescript --tailwind --app --no-src-dir --no-eslint --use-npm --turbopack
cd warden && npm i zustand @anthropic-ai/sdk
echo "ANTHROPIC_API_KEY=sk-..." > .env.local
npm run dev
```

ESLint is off deliberately (`trd.md` §3). There are no automated tests — verification is the nine manual acceptance checks in `trd.md` §8, and they are meant to be run out loud by a human.

**`ANTHROPIC_API_KEY` must be set before anything works.** Nothing downstream functions without it.

## Architecture

```
Browser tab (laptop)                    Phone (Safari, same hotspot LAN)
  getUserMedia → canvas → motion gate      /oncall ←── SSE ──┐
    → POST 3 frames to /api/classify         ↓ taps 1|2|3    │
              ↓ (server holds the key)       └→ POST /api/disposition
        Anthropic API                                        │
              ↓                                              │
    → zustand store ─┬→ threat card + event stream           │
                     ├→ voice-down (speechSynthesis)         │
                     ├→ POST /api/escalate ──────────────────┘
                     └→ /incident/[id]/print → PDF
```

Three things about this differ from the PRD's one-line architecture and are easy to get wrong:

- **There is no event bus for the dashboard.** The camera, the gate, and the dashboard all live in one browser tab, so state is a single zustand store. The server exists only to hold the API key and to relay one escalation event.
- **The one SSE endpoint serves the phone, not the dashboard.** `/oncall` runs on a second device and is the only thing that must be pushed to.
- **The escalation threshold is per-property, not a global `threat >= 3`.** Lease state → posture → threshold (`trd.md` §2). A `vacant` unit is `armed` and escalates at 3; an `occupied` one escalates at 4. Never hardcode the number.

Everything runs locally except the Claude API call. Two adapters are deliberately faked and **must be visibly labeled as simulated in the UI**: the PMS vacancy feed (standing in for Yardi/RealPage) and the guard-dispatch marketplace.

## Build priorities

- **Never cut:** the vision loop, and the evidence PDF (`/incident/[id]/print` + `window.print()`). The PDF is the moat made visible.
- **The simulated escalation call is the primary path, not a fallback.** It is a web page, not telephony, so it carries none of telephony's risk. Callwright is a hard-gated side bet that can only ever add — it is never awaited and never on the critical path.
- **Pre-verify or pre-render off stage; play back locally on stage.** This governs both Callwright and Miso. Nothing unproven goes in the live path; Miso in particular ships as pre-rendered MP3s, never a live call.
- The dashboard is judged on aesthetics ("Most Beautiful" is in play): dark ops theme, exactly three animations, no emoji, and **never a timestamp without a timezone** — it is an evidence product.
- The printed report is the visual inverse: black-on-white, serif, boring on purpose. Its credibility comes from looking like a filing rather than a dashboard.

## Domain vocabulary

- **Disposition** — how an incident closes (`false_alarm` / `deterred_by_voice` / `dismissed_by_manager` / `guard_dispatched` / `police_report` / `eviction_filed` / `claim_paid`). These labels are the entire moat claim. `closeIncident()` is the only way to close an incident, so "every incident has a disposition" is enforced in code rather than asserted on a slide.
- **Posture** — `passive` / `standard` / `armed`, derived from lease state, sets the escalation threshold.
- **Voice-down** — the speaker announcement that deters an intruder.
- **Escalation** — the call to the on-call manager offering dispatch / police / dismiss.

## Conventions that are load-bearing

- **Every timestamp is an offset-bearing ISO 8601 string**, never a `Date` or an epoch. The PDF prints timezones and there must be no timezone math at the last minute.
- **`Classification.raw` keeps the model's verbatim JSON.** The report prints it. Showing the machine's actual output rather than a prose summary is what makes the document read as evidence.
- Type literals are lowercase snake case throughout.

## Claims discipline

`prd.md` marks several market statistics `[verify]`. Do not surface unverified stats in UI copy, README text, generated reports, or pitch material. The PRD's honesty box is a commitment, not a formality — the same applies to the faked adapters, which get labeled rather than hidden.
