# Warden — AI Security Operations for Real Estate Portfolios
**Hackathon PRD · c0mpiled-11 · July 24, 2026 · build closes 10:00 PM · working name, rename in 5 seconds**

## One-liner
Warden replaces contract security for institutional real estate: AI watches every camera across a portfolio, talks down intruders, calls the on-call manager, dispatches guards only on verified threats, and files a court-ready evidence report — sold as a service priced per door, not as software.

## Track & judge map
- **Primary track: AI-Native Service Companies (Alströmer).** The RFS's own logic: services spend dwarfs software spend, and already-outsourced services are easiest to replace. Contract security is a ~$35–50B US labor spend (Allied Universal alone ~$20B globally) that every REIT and property manager already outsources.
- **Secondary frame: SaaS Challengers** — legacy central-station monitoring and guard incumbents.
- **Judge hooks:** Phonely (identical thesis, different vertical — "you replaced the call center, we replace the guard station"), VOYGR/Callwright (the escalation call), Miso (emotive voice-down, optional flourish), Hexclave (dashboard auth, $1k prize). Skip CrustData — forced fit.

## Buyer & wedge
- **Buyer:** Director of Operations / Head of Security at multifamily REITs, institutional SFR operators, third-party property managers, construction GCs.
- **Segment 2 — HNW portfolios (fold-in, not a pivot):** family offices, luxury property managers, and private landlords with 5–200 doors. A vacation home is functionally a vacant property 40+ weeks a year — same wedge, same product, zero code changes. Sell through the family office or manager, never retail to individual homeowners: a single home has no portfolio moat and puts you in Deep Sentinel/ADT's consumer lane. Bonus: these buyers close in days, not procurement quarters — the fastest design-partner pool.
- **GTM ladder:** private landlords and family offices (fast closes, design partners) → third-party property managers → REITs (the big ACVs).
- **Wedge: vacant-unit and vacant-property protection.** Squatters, break-ins, copper theft during turnover, lease-up, and REO. Vacancy is when properties are most attacked and least watched — and the PMS (Yardi/RealPage) knows exactly which units are vacant tonight, so monitoring posture follows lease state automatically. Squatter removal costs owners months of unlawful-detainer process; a timestamped evidence chain shortens it.
- **Expansion:** full guard-post replacement portfolio-wide. A 24/7 post ≈ 4.5 FTEs ≈ $175–250k/yr fully loaded; Warden prices at 10–20% of that.

## THE MOAT (settled — say it this way)
**The outcome-labeled incident graph.** Because Warden is the service and not the software, every incident closes with a disposition: false alarm / deterred by voice / dismissed by manager / guard dispatched / police report / eviction filed / claim paid. Three compounding layers:

1. **Margin flywheel.** Disposition labels train the triage model that decides when a human gets involved. Escalation ratio *is* gross margin in monitored security. Verkada and Ambient sell software — they see pixels and never see outcomes. Our unit economics improve with every incident; theirs structurally can't.
2. **Portfolio switching costs.** Integrations into the PMS (vacancy state drives monitoring posture), access control, and on-call trees across hundreds of buildings — plus the evidence archive carries legal retention value, so churning means abandoning your liability record.
3. **Underwriting endgame.** The incident corpus becomes the actuarial dataset for physical risk: insurer-recognized monitoring certificates and premium discounts first, pricing the risk ourselves later. The company that owns verified outcome data becomes the loss-run of physical security.

**One-breath version for judges:** "Competitors see pixels. Because we deliver the service, we see outcomes — and outcomes are what train the model, set the margin, and price the insurance."

**Pre-empted pushback ("won't Hakimo/Ambient do this?"):** they monitor sites; we run real-estate security operations tied to lease state, with evidence built for unlawful detainer and insurance claims. Narrower buyer, deeper integration, service contract instead of software seat. Honesty: this holds for tonight's pitch; it needs a fresh competitive scan before it becomes a company (see kill criteria).

## Tonight's demo — the money shot
Cold open, no slides. Presenter talks; teammate walks into frame behind them.
1. Dashboard flags motion at **Maple Grove — Unit 4B (VACANT, day 12 of turnover)**.
2. Claude vision classifies: "One adult, attempting door, no uniform, 9:42 PM" — threat card slides in.
3. Speaker voice-down: "This property is monitored. Security has been notified." Teammate freezes, backs out of frame.
4. Presenter's phone rings on stage (Callwright): AI describes the scene, offers dispatch guard / call police / dismiss. Presenter dismisses.
5. Click **Incident Report** → PDF with timestamped frames, classification chain, actions, disposition. Line: "This document is how a squatter gets evicted and a claim gets paid."
6. Close: "That was a $200k/yr guard post, replaced. Now imagine 40,000 doors."

## Build plan (timeboxed from now; cut order at bottom)
| Box | Deliverable | Notes |
|---|---|---|
| T+0:40 | **Core vision loop — NEVER CUT** | Webcam → frame-diff motion gate → Claude vision on trigger frames → structured JSON {person?, count, behavior, threat 1–5} → event log |
| T+1:10 | Ops dashboard | 6 faked-PMS properties with vacancy states, one live camera tile, event stream, threat card. Dark ops aesthetic — Most Beautiful is in play |
| T+1:20 | Voice-down | Browser speechSynthesis on threat ≥3. If Miso API is reachable, swap in — 10-minute attempt max |
| T+1:40 | Escalation call | Callwright ONLY if a real end-to-end call was already verified tonight; otherwise simulated inbound-call card with ringtone and on-screen keypad. Do not debug live telephony past 15 minutes |
| T+2:00 | **Evidence report — NEVER CUT** | Incident → styled HTML → print-to-PDF: property/unit header, lease state, frame strip, action log, disposition. This is the moat made visible |
| T+2:15 | Hexclave auth on dashboard ($1k) | Only if everything above is demo-clean |
| **9:30 PM** | **HARD STOP: record backup video of the full loop** | CV and telephony are the two flakiest demo classes in existence; if stage lighting or wifi betrays you, present the video |

**Cut order:** Hexclave → live call → Miso. **Never cut:** vision loop, evidence PDF.

## Architecture (demo-scale)
Webcam → motion gate (frame differencing) → Claude vision (structured JSON) → event bus → [voice-down | escalation call | evidence compiler] → dashboard via SSE/poll. Faked adapters clearly labeled as such: PMS vacancy feed, guard-dispatch marketplace. Everything runs local except Claude and (maybe) Callwright.

## 3-minute pitch skeleton
1. Live demo cold open — the loop fires in the first 60 seconds while you narrate.
2. Problem and market: a 24/7 guard post is 4.5 FTEs; US contract security ~$35–50B; the large majority of alarm dispatches are false and many cities fine for them **[verify every stat before saying it to this panel]**.
3. What we are: not software — the security operator. Priced per door per month.
4. Moat: outcomes vs. pixels, then the underwriting endgame in one sentence.
5. Wedge and ask: vacant inventory tonight, whole portfolio tomorrow — one product covers a REIT's turnover units and a family office's twelve houses. Ask: pilot on one operator's vacant stock; name family offices as the fast-close path.

## Honesty box (say nothing you can't defend)
- **Competitive reality:** Hakimo, Ambient.ai, Verkada, Deep Sentinel, Stealth Monitoring/Pro-Vigil, and guard incumbents bolting on remote video. Tonight the differentiation is positioning; before any memo, run a full scan — this lane is funded and moves fast.
- **Named risks if asked, not pretended away:** adversarial spoofing/deepfakes of video feeds, recording-consent law (CA two-party), use-of-force and dispatch liability, life-safety SLA on flaky telephony.
- Stats marked [verify] stay unspoken until verified.

## If this becomes a company — kill criteria (pre-commit now)
1. No design-partner LOI from a portfolio operator (≥1,000 doors) within 60 days of first outreach → kill.
2. Fresh competitive scan finds a funded player already selling evidence-grade vacant-unit monitoring with PMS integration into SFR/multifamily → fold or narrow the wedge further.
3. Triage model can't reach ~90% auto-resolution on pilot data within 90 days (the margin doesn't clear) → kill.
4. Telephony-class dependencies can't meet life-safety escalation SLAs → rethink the stack before scaling past pilots.
