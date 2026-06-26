import type { Grade } from "../calibration/types";

/** Probability 0..1 → "62.0%". */
export function pct(p: number, dp = 1): string {
  return `${(p * 100).toFixed(dp)}%`;
}

/** Signed delta (0..1 scale) → "+1.8" / "-2.4" in percentage points. */
export function signedPct(delta: number, dp = 1): string {
  const s = (delta * 100).toFixed(dp);
  return delta > 0 ? `+${s}` : s;
}

export const GRADE_DESCRIPTION: Record<Grade, string> = {
  A: "High confidence",
  B: "Solid",
  C: "Caution",
  D: "Low confidence",
};

/** Muted Tailwind classes per grade — color encodes signal, nothing else. */
export const GRADE_CLASS: Record<Grade, string> = {
  A: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  B: "border-sky-500/40 text-sky-300 bg-sky-500/10",
  C: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  D: "border-rose-500/40 text-rose-300 bg-rose-500/10",
};

const FLAG_LABEL: Record<string, string> = {
  thin_liquidity: "Thin book",
  whale_dominated: "Whale-dominated",
  momentum_regime: "Momentum regime",
  base_rate_divergence: "Diverges from base rate",
  cross_venue_divergence: "Cross-venue gap",
};

export function flagLabel(flag: string): string {
  return FLAG_LABEL[flag] ?? flag.replace(/_/g, " ");
}

export function venueLabel(v: string): string {
  if (v === "kalshi") return "Kalshi";
  if (v === "polymarket") return "Polymarket";
  return v;
}
