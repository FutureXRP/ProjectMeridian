/**
 * The Calibration Model — deterministic, inspectable corrections that turn a raw
 * prediction-market price into a Calibrated Probability + Confidence Grade, with
 * every adjustment shown.
 *
 * Standalone by design: zero UI, zero AI, zero data-source dependencies. This is
 * the asset that survives into every later stage; keep it pure and portable.
 *
 * NOTE: the orchestrator `calibrate()` and the remaining corrections (liquidity,
 * momentum, base-rate, cross-venue) land next; this currently exports the
 * foundation plus the favorite–longshot transform.
 */
export * from "./types";
export * from "./math";
export { DEFAULT_PARAMS } from "./params";
export type { CalibrationParams } from "./params";
export { favoriteLongshot } from "./corrections/favoriteLongshot";
export { confidenceScore, gradeFromScore } from "./grade";
