import { calibrate, type CalibrationResult } from "../calibration";
import { SAMPLE_MARKETS } from "./sampleMarkets";

/**
 * Supplies the Desk with calibrated markets.
 *
 * Today it runs the real calibrate() over a representative sample set (the
 * environment's egress policy blocks live venue APIs). Wiring /lib/sources
 * changes only where the inputs come from — the Desk renders CalibrationResult
 * either way. Async so the live swap is a drop-in.
 */
export async function getDeskMarkets(): Promise<CalibrationResult[]> {
  return SAMPLE_MARKETS.map((m) => calibrate(m));
}
