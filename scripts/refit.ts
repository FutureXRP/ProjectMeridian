/**
 * Monthly re-fit of the calibration curve against newly resolved markets.
 *
 * Run: `npx tsx scripts/refit.ts`  (Node 22 also: `node --experimental-strip-types`)
 *
 * Loads resolved-market samples (from Supabase once wired; a local JSON fixture
 * at data/resolved-markets.json for now), re-fits the favorite–longshot
 * transform, and writes data/calibration.json — which mergeParams() layers over
 * the cold-start seed at runtime. Keeps the deterministic core untouched; this
 * is the ops wrapper around the pure fit in lib/calibration/fit.ts.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { refitFavoriteLongshot, type ResolvedSample } from "../lib/calibration/fit";

const ROOT = process.cwd();
const OUT = join(ROOT, "data", "calibration.json");
const SAMPLES = join(ROOT, "data", "resolved-markets.json");
const MIN_SAMPLES = 50;

function loadResolvedSamples(): ResolvedSample[] {
  // TODO: pull resolved markets from Supabase — the market-implied price at a
  // fixed pre-resolution horizon paired with the realized outcome. Falls back to
  // a local fixture so the script is runnable before Supabase is wired.
  if (existsSync(SAMPLES)) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(SAMPLES, "utf8"));
      if (Array.isArray(parsed)) return parsed as ResolvedSample[];
    } catch {
      /* fall through to empty */
    }
  }
  return [];
}

function main(): void {
  const samples = loadResolvedSamples();
  if (samples.length < MIN_SAMPLES) {
    console.warn(
      `refit: only ${samples.length} resolved samples (need >= ${MIN_SAMPLES}); keeping the cold-start seed.`,
    );
    return;
  }

  const fit = refitFavoriteLongshot(samples);
  const payload = {
    favoriteLongshot: { a: fit.a, b: fit.b },
    meta: { fittedAt: new Date().toISOString(), n: fit.n, logLik: fit.logLik },
  };
  writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    `refit: wrote ${OUT}  (a=${fit.a.toFixed(4)}, b=${fit.b.toFixed(4)}, n=${fit.n}).`,
  );
}

main();
