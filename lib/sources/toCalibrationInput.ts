import type { CalibrationInput, PricePoint, Venue } from "../calibration/types";
import type { NormalizedMarket } from "./types";

/**
 * Optional anchors/signals layered onto a market before calibration — gathered
 * from history endpoints, the external reference anchors, and the cross-venue
 * counterpart. Kept separate so the bridge stays a pure mapping.
 */
export interface CalibrationExtras {
  priceHistory?: readonly PricePoint[];
  baseRate?: number;
  externalReference?: number;
  externalReferenceLabel?: string;
  crossVenueProbability?: number;
  crossVenueVenue?: Venue;
}

/** Bridge a normalized market (+ optional extras) into the Calibration Model's input. */
export function toCalibrationInput(
  market: NormalizedMarket,
  extras: CalibrationExtras = {},
): CalibrationInput {
  return {
    marketId: market.marketId,
    question: market.title,
    venue: market.venue,
    rawProbability: market.yesProbability,
    volume: market.volume,
    openInterest: market.openInterest,
    topHolderConcentration: market.topHolderConcentration,
    priceHistory: extras.priceHistory,
    baseRate: extras.baseRate,
    externalReference: extras.externalReference,
    externalReferenceLabel: extras.externalReferenceLabel,
    crossVenueProbability: extras.crossVenueProbability,
    crossVenueVenue: extras.crossVenueVenue,
  };
}
