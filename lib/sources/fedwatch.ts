/**
 * External reference anchor: CME FedWatch-style implied probabilities for FOMC
 * outcomes, consumed by the base-rate correction. Live source is TBD (derive
 * from fed-funds futures, or a licensed feed); until configured this returns
 * null so the base-rate correction simply records "no external reference".
 */

export interface FedDecisionReference {
  meeting: string; // e.g. "2026-06"
  /** Outcome label -> implied probability (≈ sums to 1). */
  impliedProbabilities: Record<string, number>;
  source: "cme_fedwatch";
  asOf: string; // ISO
}

export async function getFedWatchReference(
  _meeting: string,
): Promise<FedDecisionReference | null> {
  // TODO: wire a live FedWatch-derived source (and confirm its terms).
  return null;
}

/** Pull the external-reference fields for one outcome from a FedWatch reference. */
export function fedWatchExternalReference(
  ref: FedDecisionReference | null,
  outcomeLabel: string,
): { externalReference?: number; externalReferenceLabel?: string } {
  if (!ref) return {};
  const p = ref.impliedProbabilities[outcomeLabel];
  if (typeof p !== "number") return {};
  return {
    externalReference: p,
    externalReferenceLabel: `CME FedWatch (${ref.meeting})`,
  };
}
