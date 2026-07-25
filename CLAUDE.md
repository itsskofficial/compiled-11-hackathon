# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repo currently contains no application code — only `prd.md` (the product spec) and a stub `README.md`. There is no package manifest, no build tooling, no tests, and no CI. The stack has not been chosen yet.

**When the first code lands, replace this section** with the actual build/run/lint/test commands, including how to run a single test.

## What is being built

Warden — an AI security operations product for real estate portfolios, built as a hackathon demo (c0mpiled-11, July 24 2026, build closes 10:00 PM). Read `prd.md` in full before making architectural decisions; it is the source of truth for scope, and it is written as a timeboxed build plan rather than an open-ended spec.

## Architecture (demo-scale)

A single pipeline drives everything:

```
Webcam → motion gate (frame differencing) → Claude vision (structured JSON)
       → event bus → [voice-down | escalation call | evidence compiler]
       → dashboard (SSE or poll)
```

The Claude vision step returns structured JSON of the shape `{person?, count, behavior, threat 1–5}`. The threat score is the control signal for the whole system — voice-down fires at threat ≥ 3, and escalation follows from there. Anything downstream should key off that event rather than re-inspecting frames.

Everything runs locally except the Claude API call and (possibly) the Callwright telephony call. Two adapters are deliberately faked and **must be labeled as fakes in the code and in the UI**: the PMS vacancy feed (standing in for Yardi/RealPage) and the guard-dispatch marketplace. Vacancy state comes from the faked PMS and determines monitoring posture per unit.

## Build priorities

These come from `prd.md` and should govern trade-offs when time is short:

- **Never cut:** the core vision loop, and the evidence report (incident → styled HTML → print-to-PDF). The PDF is the product thesis made visible, not a nice-to-have.
- **Cut order when behind:** Hexclave auth → live escalation call → Miso voice.
- **Hard timeboxes:** 10 minutes max attempting the Miso API before falling back to browser `speechSynthesis`; 15 minutes max debugging live telephony before falling back to a simulated inbound-call card. Do not exceed these — the PRD treats CV and telephony as the two flakiest demo classes.
- The dashboard is judged on aesthetics ("Most Beautiful" is in play) — dark ops aesthetic, six faked properties with vacancy states, one live camera tile, event stream, threat card.

## Domain vocabulary

- **Disposition** — how an incident closes (false alarm / deterred by voice / dismissed by manager / guard dispatched / police report / eviction filed / claim paid). Every incident must terminate in one; these labels are the moat, so the data model should treat disposition as required, not optional.
- **Voice-down** — speaker announcement to deter an intruder.
- **Escalation** — the outbound call to the on-call manager offering dispatch / police / dismiss.
- **Vacant unit** — the wedge; monitoring posture follows lease state.

## Claims discipline

`prd.md` marks several market statistics `[verify]`. Do not surface unverified stats in UI copy, README text, or generated reports.
