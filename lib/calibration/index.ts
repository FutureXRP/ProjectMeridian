/**
 * The Calibration Model — deterministic, inspectable corrections that turn a raw
 * prediction-market price into a Calibrated Probability + Confidence Grade, with
 * every adjustment shown.
 *
 * Standalone by design: zero UI, zero AI, zero data-source dependencies. This is
 * the asset that survives into every later stage; keep it pure and portable.
 *
 * Entry point: `calibrate(input, params?)` → CalibrationResult.
 */
export * from "./types";
export * from "./math";
export { DEFAULT_PARAMS } from "./params";
export type { CalibrationParams } from "./params";
export { calibrate } from "./calibrate";
export { confidenceScore, gradeFromScore } from "./grade";
export { favoriteLongshot } from "./corrections/favoriteLongshot";
export { liquidity } from "./corrections/liquidity";
export { lag1Autocorr, momentum } from "./corrections/momentum";
export { baseRate } from "./corrections/baseRate";
export { crossVenue } from "./corrections/crossVenue";
