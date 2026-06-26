/**
 * Tunable parameters for the Calibration Model.
 *
 * COLD START: these are conservative SEED values, not yet fit to resolved
 * markets. `scripts/refit.ts` re-fits them monthly against newly resolved
 * markets and persists the result to /data/calibration.json, which overrides
 * these defaults at runtime. Until that corpus exists we seed from published
 * favorite–longshot estimates (mild for prediction markets vs. racetracks) and
 * sensible thresholds. Every value here is meant to be displaced by data.
 */
export interface CalibrationParams {
  favoriteLongshot: {
    /** Logit-space intercept. 0 = symmetric (no directional bias of its own). */
    a: number;
    /**
     * Logit-space slope. >1 steepens toward the extremes, correcting the classic
     * bias (longshots overpriced → pushed down, favorites underpriced → pushed
     * up). 1 = identity (no correction). Seeded conservatively; refit moves it.
     */
    b: number;
  };
  liquidity: {
    /** At/below this volume the book is treated as thin (max-penalty region). */
    minVolume: number;
    /** At/above this volume liquidity is no longer a concern. */
    healthyVolume: number;
    /** Top-holder share above which a market is flagged whale-dominated. */
    concentrationFlag: number;
    /** Max confidence penalty the liquidity correction can contribute. */
    maxPenalty: number;
  };
  momentum: {
    /** Min price points required to assess a momentum regime. */
    minPoints: number;
    /** Lag-1 autocorrelation of returns above this => price tracking its own momentum. */
    autocorrFlag: number;
    maxPenalty: number;
  };
  baseRate: {
    /** Divergence (|calibrated - anchor|) at/below this is ignored. */
    tolerance: number;
    /** Divergence at/above this yields the max penalty. */
    maxDivergence: number;
    maxPenalty: number;
  };
  crossVenue: {
    tolerance: number;
    maxDivergence: number;
    maxPenalty: number;
  };
  /** Confidence-score cutoffs (inclusive lower bounds) for letter grades. */
  gradeThresholds: { A: number; B: number; C: number };
}

export const DEFAULT_PARAMS: CalibrationParams = {
  favoriteLongshot: { a: 0, b: 1.1 },
  liquidity: {
    minVolume: 5_000,
    healthyVolume: 250_000,
    concentrationFlag: 0.5,
    maxPenalty: 0.35,
  },
  momentum: { minPoints: 8, autocorrFlag: 0.6, maxPenalty: 0.2 },
  baseRate: { tolerance: 0.05, maxDivergence: 0.35, maxPenalty: 0.25 },
  crossVenue: { tolerance: 0.04, maxDivergence: 0.25, maxPenalty: 0.25 },
  gradeThresholds: { A: 0.85, B: 0.65, C: 0.45 },
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Merge fitted overrides (e.g. the contents of /data/calibration.json produced
 * by scripts/refit.ts) onto the cold-start defaults. Each section is flat, so a
 * shallow per-section merge is sufficient and predictable.
 */
export function mergeParams(overrides?: DeepPartial<CalibrationParams>): CalibrationParams {
  if (!overrides) return DEFAULT_PARAMS;
  return {
    favoriteLongshot: { ...DEFAULT_PARAMS.favoriteLongshot, ...overrides.favoriteLongshot },
    liquidity: { ...DEFAULT_PARAMS.liquidity, ...overrides.liquidity },
    momentum: { ...DEFAULT_PARAMS.momentum, ...overrides.momentum },
    baseRate: { ...DEFAULT_PARAMS.baseRate, ...overrides.baseRate },
    crossVenue: { ...DEFAULT_PARAMS.crossVenue, ...overrides.crossVenue },
    gradeThresholds: { ...DEFAULT_PARAMS.gradeThresholds, ...overrides.gradeThresholds },
  };
}
