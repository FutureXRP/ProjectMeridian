/**
 * /lib/sources — cached, server-side fetchers that normalize every venue into
 * one canonical NormalizedMarket, plus the bridge into the Calibration Model.
 *
 * Server-side only; keys never reach the client. Depends on /lib/calibration
 * (one-way); the calibration core never depends on this.
 */
export * from "./types";
export { cached, clearCache, RateLimiter } from "./cache";
export type { CacheOptions } from "./cache";
export * from "./kalshi";
export * from "./polymarket";
export * from "./fedwatch";
export * from "./calendar";
export { toCalibrationInput } from "./toCalibrationInput";
export type { CalibrationExtras } from "./toCalibrationInput";
