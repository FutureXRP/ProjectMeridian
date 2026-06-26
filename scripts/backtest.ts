/**
 * Run the calibration backtest against a real resolved-prediction-market dataset.
 *
 *   npx tsx scripts/backtest.ts <markets.csv> <prices_sample.csv>
 *
 * Joins a forecast-price snapshot (prices_sample) to each market's realized
 * outcome (markets.csv, where closed markets have settled to ~0/1), then runs
 * the out-of-sample favorite-longshot backtest. Prints the calibration curve,
 * the fitted bias, Brier accuracy, and betting P&L gross and net of fees.
 *
 * Dataset note: this is Polymarket (politics/sports/crypto/AI-heavy). Treat any
 * edge here as an OPTIMISTIC upper bound for liquid macro markets — bias is
 * generally larger in sports/politics longshots than in deep macro books.
 */
import { readFileSync } from "node:fs";
import { runBacktest, type ResolvedSample } from "../lib/backtest";

/** Quote-aware CSV line parser (handles commas and "" inside quoted fields). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

interface MarketRow {
  yesResolved: number;
  active: string;
  category: string;
}

function loadMarkets(path: string): Map<string, MarketRow> {
  const lines = readFileSync(path, "utf8").split("\n");
  const m = new Map<string, MarketRow>();
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const c = parseCsvLine(lines[i]);
    if (c.length < 16) continue;
    const prices = c[9].replace(/[[\]]/g, "").split(",").map((x) => parseFloat(x));
    if (!Number.isFinite(prices[0])) continue;
    m.set(c[0], { yesResolved: prices[0], active: c[15].trim(), category: c[2] });
  }
  return m;
}

/** One forecast (YES) price per market from the snapshot file. */
function loadForecasts(path: string): Map<string, number> {
  const lines = readFileSync(path, "utf8").split("\n");
  const f = new Map<string, number>();
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const c = parseCsvLine(lines[i]);
    if (c.length < 4) continue;
    if (c[1] !== "Yes") continue;
    if (f.has(c[0])) continue;
    const p = parseFloat(c[2]);
    if (Number.isFinite(p)) f.set(c[0], p);
  }
  return f;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pct(x: number, dp = 1): string {
  return `${(x * 100).toFixed(dp)}%`;
}

function calibrationTable(samples: ResolvedSample[]): void {
  console.log("\nCalibration curve (does the forecast price match reality?)");
  console.log("  price bin    n     avg forecast   realized YES   gap");
  for (let lo = 0; lo < 1; lo += 0.1) {
    const hi = lo + 0.1;
    const bin = samples.filter((s) => s.rawProbability >= lo && s.rawProbability < hi);
    if (bin.length === 0) continue;
    const avgF = bin.reduce((a, s) => a + s.rawProbability, 0) / bin.length;
    const real = bin.reduce((a, s) => a + s.outcome, 0) / bin.length;
    const gap = real - avgF;
    console.log(
      `  ${lo.toFixed(1)}-${hi.toFixed(1)}   ${String(bin.length).padStart(5)}   ${pct(avgF).padStart(10)}   ${pct(real).padStart(10)}   ${gap >= 0 ? "+" : ""}${pct(gap)}`,
    );
  }
}

function report(label: string, samples: ResolvedSample[]): void {
  console.log(`\n${"=".repeat(64)}\n${label}  (n=${samples.length})\n${"=".repeat(64)}`);
  if (samples.length < 60) {
    console.log("  too few samples for a meaningful split; skipping.");
    return;
  }
  calibrationTable(samples);

  const base = runBacktest(samples, { edgeThreshold: 0, feeRate: 0.07 });
  console.log(`\nFavorite-longshot fit on train: b=${base.fit.b.toFixed(3)} (1.0 = crowd already calibrated)`);
  console.log(
    `Brier (test): raw=${base.rawBrier.toFixed(4)}  calibrated=${base.calibratedBrier.toFixed(4)}  improvement=${base.brierImprovement >= 0 ? "+" : ""}${base.brierImprovement.toFixed(4)}`,
  );

  console.log("\nBetting the edge on held-out markets:");
  console.log("  edge≥    bets    GROSS roi   NET roi(7% fee)   win%");
  for (const t of [0, 0.03, 0.05, 0.1]) {
    const r = runBacktest(samples, { edgeThreshold: t, feeRate: 0.07 });
    const g = r.bettingGross;
    const n = r.betting;
    console.log(
      `  ${t.toFixed(2)}   ${String(n.bets).padStart(5)}    ${(g.roi >= 0 ? "+" : "") + pct(g.roi)}        ${(n.roi >= 0 ? "+" : "") + pct(n.roi)}        ${pct(n.winRate, 0)}`,
    );
  }
}

function main(): void {
  const [, , marketsPath, pricesPath] = process.argv;
  if (!marketsPath || !pricesPath) {
    console.error("usage: npx tsx scripts/backtest.ts <markets.csv> <prices_sample.csv>");
    process.exit(1);
  }

  const markets = loadMarkets(marketsPath);
  const forecasts = loadForecasts(pricesPath);

  let resolved = 0;
  let cleanOutcome = 0;
  const samples: (ResolvedSample & { id: string; category: string })[] = [];
  for (const [id, price] of forecasts) {
    const m = markets.get(id);
    if (!m) continue;
    if (m.active !== "0") continue; // still active => no outcome yet
    resolved++;
    let outcome: 0 | 1;
    if (m.yesResolved >= 0.95) outcome = 1;
    else if (m.yesResolved <= 0.05) outcome = 0;
    else continue; // closed but didn't settle cleanly (void/ambiguous)
    cleanOutcome++;
    if (price <= 0.05 || price >= 0.95) continue; // keep genuine forecasts only
    samples.push({ id, rawProbability: price, outcome, category: m.category });
  }

  // Deterministic shuffle so the train/test holdout is a fair random split.
  samples.sort((a, b) => hash(a.id) - hash(b.id));

  console.log(`Markets in file: ${markets.size}`);
  console.log(`Forecast snapshots (unique markets, YES side): ${forecasts.size}`);
  console.log(`  -> resolved (closed): ${resolved}`);
  console.log(`  -> cleanly settled to 0/1: ${cleanOutcome}`);
  console.log(`  -> with a genuine mid-range forecast (0.05-0.95): ${samples.length}`);

  report("ALL MARKETS", samples);

  // The macro-relevant slice, closest to MERIDIAN's target.
  const econ = samples.filter((s) => s.category.toLowerCase() === "economics");
  report("ECONOMICS ONLY (closest to liquid macro)", econ);
}

main();
