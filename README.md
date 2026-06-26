# MERIDIAN

**The macro-event risk desk.** A research property that reads public
prediction-market prices on macro events (Fed, CPI, jobs, GDP), runs them
through a transparent, auditable **Calibration Model**, and publishes the
resulting calibrated probabilities + plain-language analysis.

> **Research, not advice.** Everything here is analysis of public market data —
> not investment advice, not a recommendation to trade, not brokerage. Every
> quantitative claim is inspectable, number by number.

*(Project / methodology / series names are owner placeholders; the architecture
does not depend on them. The governing source of truth is the Whitepaper &
Build Brief and the Build Roadmap.)*

---

## v1 scope (the wedge)

A public web property with three integrated parts:

1. **The Desk** — a live board of tracked macro markets: raw price → Calibrated
   Probability → Confidence Grade → one-line read, with **every number
   click-to-derivation**.
2. **The Calibration Model** — the deterministic, transparent engine
   (`/lib/calibration`). The transparency *is* the moat.
3. **The Briefing** — a recurring, JSON-feed-driven publication that compounds
   authority.

Out of scope for v1: accounts/auth, billing/paywalls, a private API, trade
execution, thin/illiquid markets. (See the roadmap's "Out of scope.")

## Status

- ✅ **Calibration Model core (`/lib/calibration`)** — complete and standalone
  (zero UI/AI/data deps). Five corrections (favorite–longshot, liquidity,
  momentum, base-rate, cross-venue) + orchestrator, fully unit-tested.
- ✅ Next.js 16 (App Router, TS, Tailwind v4) scaffold.
- 🔄 **Data layer (`/lib/sources`)** — in progress (built against documented API
  contracts; see `docs/data-sources.md`).
- ⛔ **GATE 0 (data rights)** — open. Venue terms prohibit commercial republish
  of derived data without written consent; resolve before any public deploy.
- ⛔ **Desk UI** — pending the `frontend-design` skill (mandated by the brief,
  absent from this environment).

## Structure

```
/app          desk, briefings, methodology, about  (App Router)
/lib
  /calibration  deterministic correction model  (the core asset — standalone)
  /sources      cached server-side fetchers (kalshi, polymarket, fedwatch, calendar)
  /reads        Claude prompt templates (language only, never numbers)
/data         posts.json (feed), calibration.json (fitted curve)
/scripts      refit.ts (monthly calibration re-fit)
/docs         data-sources.md (Phase 0 / GATE 0 findings)
```

## Develop

```bash
npm install
npm run test     # vitest — calibration unit tests
npm run dev      # next dev
npm run build    # next build
npx tsc --noEmit # typecheck
```

## Non-negotiables (from the brief)

- **Deterministic core, narrative shell.** Numbers come from `/lib/calibration`
  and are inspectable; the AI only writes language. Never blur the line.
- **Macro + liquid only.** Drift into thin markets and the credibility breaks.
- **Keys server-side, sources cached.** No secret is ever exposed client-side.
- **The voice is named and real.** Authority is personal.
