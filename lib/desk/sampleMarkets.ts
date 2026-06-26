import type { CalibrationInput, PricePoint } from "../calibration/types";

/**
 * Representative macro markets used to render the Desk before live data is wired
 * (this environment's egress policy blocks the venue APIs). Each is a real
 * CalibrationInput fed through the real calibrate(); wiring /lib/sources changes
 * only where these inputs come from — the board renders CalibrationResult either
 * way. The set is chosen to exercise every correction and grade.
 */

function path(...ps: number[]): PricePoint[] {
  return ps.map((p, i) => ({ t: i, p }));
}

export const SAMPLE_MARKETS: CalibrationInput[] = [
  {
    marketId: "KXFEDDECISION-26JUL-HOLD",
    question: "Fed holds rates at the July 2026 meeting",
    venue: "kalshi",
    rawProbability: 0.88,
    volume: 1_400_000,
    openInterest: 320_000,
    externalReference: 0.85,
    externalReferenceLabel: "CME FedWatch",
    crossVenueProbability: 0.87,
    crossVenueVenue: "polymarket",
  },
  {
    marketId: "KXFEDDECISION-26JUL-CUT25",
    question: "Fed cuts 25bp at the July 2026 meeting",
    venue: "kalshi",
    rawProbability: 0.34,
    volume: 640_000,
    externalReference: 0.41,
    externalReferenceLabel: "CME FedWatch",
  },
  {
    marketId: "KXCPIYOY-26JUN",
    question: "Core CPI year-over-year above 3.0% in June",
    venue: "kalshi",
    rawProbability: 0.62,
    volume: 210_000,
    crossVenueProbability: 0.55,
    crossVenueVenue: "polymarket",
  },
  {
    marketId: "KXPAYROLLS-26JUN",
    question: "June nonfarm payrolls above 150k",
    venue: "kalshi",
    rawProbability: 0.55,
    volume: 3_200,
  },
  {
    marketId: "KXGDP-26Q2",
    question: "Q2 2026 real GDP growth above 2.0%",
    venue: "kalshi",
    rawProbability: 0.46,
    volume: 28_000,
    externalReference: 0.7,
    externalReferenceLabel: "economist consensus",
  },
  {
    marketId: "KXFED-EMERGENCY-CUT",
    question: "Emergency Fed rate cut before the next scheduled meeting",
    venue: "kalshi",
    rawProbability: 0.06,
    volume: 9_000,
  },
  {
    marketId: "PM-RECESSION-2026",
    question: "NBER-defined US recession declared during 2026",
    venue: "polymarket",
    rawProbability: 0.23,
    volume: 180_000,
    topHolderConcentration: 0.71,
  },
  {
    marketId: "PM-CPI-MOM-HOT",
    question: "Headline CPI month-over-month above 0.4% on the next print",
    venue: "polymarket",
    rawProbability: 0.3,
    volume: 90_000,
    priceHistory: path(0.3, 0.33, 0.36, 0.39, 0.42, 0.39, 0.36, 0.33, 0.3),
  },
];
