# Data sources — Phase 0 findings (GATE 0)

> Status: **GATE 0 surfaced a real licensing flag.** Technically the product is
> easy to build; the binding constraint is **data-redistribution rights**, not
> access. This note is the Phase 0 "definition of done" record of what each
> source provides and permits. Last verified: 2026-06.

Confidence legend: **[V]** verified from a primary source (official docs /
SDK source / government filing); **[~]** corroborated secondary source;
**[?]** unverified / needs a human with open network + counsel.

---

## Verdict

| | Kalshi | Polymarket |
|---|---|---|
| Public read API | **Yes, no-auth** [V] | **Yes, no-auth** [V] |
| Macro coverage | **Deep** (Fed/CPI/jobs/GDP) [V] | Medium, thinner [~] |
| Historical + resolved data | Yes [V] | Yes [V] |
| Terms permit commercial republish of derived data | **No, without written consent** [V] | **No, without written consent** [V/?] |

**Net:** build the technical core now (it republishes nothing); **do not deploy
anything publicly that serves derived probabilities from this data until the
rights question is resolved** by the owner (data license / written consent) and,
ideally, IP counsel.

---

## Kalshi

- **Base URL:** `https://api.elections.kalshi.com/trade-api/v2` (serves all
  markets despite the `elections` subdomain). [V]
- **Auth:** read-only market data (`/series`, `/events`, `/markets`,
  orderbooks, candlesticks, trades) is **public, no key required**. Trading and
  the **WebSocket** require RSA-PSS-signed requests / an account. REST polling
  keeps us in the no-account lane. [V/~]
- **Macro series (verified live tickers):** `KXFEDDECISION` + `KXFED` (FOMC),
  `KXCPI` + `KXCPIYOY` (inflation), `KXPAYROLLS` + `KXU3` (jobs/unemployment),
  `KXGDP` (GDP). Fed/CPI are the deepest macro books in the space. Discovery
  pattern: `/series/{ticker}` → `/events` → `/markets`; tickers follow
  `{SERIES}-{YYMON}`. [V]
- **Historical / resolved:** candlesticks via
  `/series/{s}/markets/{m}/candlesticks` (1m/1h/1d); markets settled before a
  cutoff move to `/historical/*` (see `/historical/cutoff`); settlement carried
  on the market `result`/`settlement` fields. Sufficient to fit a calibration
  curve. [V]
- **Terms — the blocker:** Kalshi's **Data Terms of Use** (their own S3 PDF)
  restrict use to *"personal use for non-commercial purposes"* and expressly
  prohibit, without **prior written consent**: publicly displaying, publishing,
  distributing, **creating derivative works**, using the data *"to create…
  develop any… services… or any other derivative works,"* **scraping/automated
  retrieval**, and an explicit **AI/ML-training** prohibition. Attribution is
  not a cure. The separate **API Developer Agreement** (`kalshi.com/
  developer-agreement`) governs API use and **could not be read here** — it must
  be reviewed directly; a commercial license would live there. [V / [?] on the
  developer agreement]
- **Gotchas:** breaking API changes are frequent (pin v2, use `_fp` fixed-point
  price fields); data is "reference only" (no warranty); usage may be monitored.

## Polymarket

- **APIs (all public, no-auth reads):** Gamma `https://gamma-api.polymarket.com`
  (markets/events), CLOB `https://clob.polymarket.com` (orderbook, prices,
  **`/prices-history`**), Data `https://data-api.polymarket.com`
  (trades/holders/OI). Public market WebSocket exists. A wallet/signature is
  needed **only to trade**. [V]
- **Macro coverage:** lists FOMC/CPI/jobs/GDP and is occasionally deep on a
  marquee Fed event, but ~90% of volume is sports/politics/crypto and macro
  books are often thin. Weaker than Kalshi for systematic macro. [~]
- **Historical / resolved:** time-series via CLOB `/prices-history` (keyed by
  outcome **token id**, intervals 1h/6h/1d/1w/max); resolved markets via Gamma
  `?closed=true` with `umaResolutionStatus` / `outcomePrices` (a stringified
  array — parse it). Prefer REST over the subgraph (subgraph in flux post-v2
  migration). [V / [?] subgraph deprecation]
- **On-chain model:** Gnosis CTF ERC-1155 on Polygon, $1 USDC.e backing,
  resolution via UMA optimistic oracle. A market = a `conditionId`; each outcome
  = a `clobTokenId`; human URLs use `slug`. Plan the schema around mapping
  slug ↔ conditionId ↔ tokenId; treat "resolved" as `closed=true` /
  `umaResolutionStatus=resolved`. [V]
- **Terms — the blocker:** the CFTC-filed **Polymarket US Terms** prohibit
  reproducing, **publicly displaying**, or creating **derivative works** from
  their Content *"for any commercial purpose"* without written consent. The
  **consumer `polymarket.com/tos` wording could not be verified here** (egress
  blocked). [V on the US-exchange terms / [?] on the consumer ToS]
- **Geo nuance:** the geo-restriction blocks **order placement (trading)**, not
  **data reads** — reading public market data is not geo-fenced. Trading-access
  and data-redistribution are two separate risks; clearing the first does not
  clear the second. [V/~]

## External reference anchors (not yet built)

- **CME FedWatch** (Fed-decision base rate from fed-funds futures) and an
  **econ calendar / consensus** source are planned as `/lib/sources/fedwatch.ts`
  and `/lib/sources/calendar.ts`. Live source + terms still to confirm. [?]

---

## Environment egress note

This Claude-Code-on-the-web environment's **network policy blocks both venue
hosts** (`api.elections.kalshi.com`, `gamma-api.polymarket.com` → 403 at the
egress proxy). The allowlist permits package registries + Anthropic only. So:
live fetching **cannot run from web sessions** under the current policy — the
source layer is built against the documented contracts with fixtures and is
designed to run at deploy time (Vercel) or in an environment whose policy
allowlists these domains. To enable live fetch from web sessions, broaden the
environment's network policy (set at environment creation; see
https://code.claude.com/docs/en/claude-code-on-the-web). Do not route around the
policy.

## Recommended data strategy

1. **Kalshi-primary, Polymarket-secondary.** Kalshi is the deeper, more reliable
   macro venue; it carries the calibration training set.
2. **Cross-venue divergence becomes a feature** (the §4.5 check), not a 50/50
   dependency — turning Polymarket's partial coverage into signal.
3. **Resolve the rights gate before any public deploy.** Open a data-license /
   written-consent conversation with each venue and get an IP-counsel read on
   the research-use posture. The fact that prices are uncopyrightable facts
   makes the binding lever *contract*, not copyright — a lawyer question.
