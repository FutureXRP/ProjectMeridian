import { rescale } from "../math";
import type { CalibrationParams } from "../params";
import type { Adjustment, CalibrationInput } from "../types";

/**
 * Liquidity / concentration discount.
 *
 * Confidence-only: it never changes the probability, only how much we trust it.
 * Thin books (low volume / open interest) and whale-dominated books (a few
 * wallets holding most of the book) are down-weighted, and whale domination is
 * flagged explicitly. The penalty is the worse of the two concerns, capped at
 * params.liquidity.maxPenalty.
 */
export function liquidity(
  input: CalibrationInput,
  params: CalibrationParams,
  currentProbability: number,
): Adjustment {
  const cfg = params.liquidity;
  const measure = input.volume ?? input.openInterest ?? null;
  const conc = input.topHolderConcentration ?? null;

  let thinPenalty = 0;
  if (measure !== null) {
    const logv = Math.log10(Math.max(measure, 1));
    thinPenalty = rescale(
      logv,
      Math.log10(cfg.healthyVolume),
      Math.log10(cfg.minVolume),
      0,
      cfg.maxPenalty,
    );
  }

  let whalePenalty = 0;
  const whaleDominated = conc !== null && conc > cfg.concentrationFlag;
  if (conc !== null) {
    whalePenalty = rescale(conc, cfg.concentrationFlag, 1, 0, cfg.maxPenalty);
  }

  const penalty = Math.max(thinPenalty, whalePenalty);
  const flags: string[] = [];
  if (whaleDominated) flags.push("whale_dominated");
  if (thinPenalty >= cfg.maxPenalty * 0.5) flags.push("thin_liquidity");

  const hasSignal = measure !== null || conc !== null;
  const detail = !hasSignal
    ? "No liquidity data available; confidence not adjusted."
    : `Liquidity measure ${measure ?? "n/a"}${
        conc !== null ? `, top-holder share ${(conc * 100).toFixed(0)}%` : ""
      } → confidence penalty ${(penalty * 100).toFixed(0)}%${
        whaleDominated ? " (whale-dominated book)" : ""
      }.`;

  return {
    key: "liquidity",
    label: "Liquidity / concentration discount",
    applied: penalty > 0 || flags.length > 0,
    inputProbability: currentProbability,
    outputProbability: currentProbability,
    delta: 0,
    confidencePenalty: penalty,
    detail,
    flags,
    data: {
      volume: input.volume ?? null,
      openInterest: input.openInterest ?? null,
      topHolderConcentration: conc,
      thinPenalty,
      whalePenalty,
    },
  };
}
