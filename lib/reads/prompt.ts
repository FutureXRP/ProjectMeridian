import type { CalibrationResult } from "../calibration/types";

/**
 * Versioned prompt for the per-market "read" — the single sentence of
 * plain-language interpretation that sits on top of the deterministic
 * breakdown. Bump the version whenever the wording changes so generated reads
 * can be traced to the prompt that produced them.
 */
export const READ_PROMPT_VERSION = "2026-06-v1";

export const READ_SYSTEM_PROMPT = `You write a single sentence of plain-language interpretation for one prediction-market line on a research desk.

Follow these rules exactly:
- Output ONLY the one sentence. No preamble, no reasoning, no lists, no markdown, no quotation marks.
- Explain the gap between the crowd's raw price and the model's calibrated probability, and/or the main reason confidence is limited — grounded strictly in the adjustments you are given.
- You are the narrative layer over a deterministic model. You never compute or change a probability. Never state a number that is not already in the data provided; do not invent figures.
- This is research, not advice. Never tell anyone to buy, sell, hold, bet, or take a position, and never use words like "should", "buy", "sell", "long", or "short". Describe what the market is saying and where the method sees distortion — nothing more.
- Voice: neutral, precise, unhurried — a research desk, not a tipster.`;

/**
 * Build the user message strictly from the calibration breakdown. The model
 * sees only these figures and the adjustment explanations — nothing else — so it
 * has no other numbers to draw on.
 */
export function buildReadUserContent(result: CalibrationResult): string {
  const lines: string[] = [
    `Question: ${result.question}`,
    `Venue: ${result.venue}`,
    `Raw crowd probability: ${(result.rawProbability * 100).toFixed(1)}%`,
    `Calibrated probability: ${(result.calibratedProbability * 100).toFixed(1)}%`,
    `Confidence grade: ${result.grade}`,
  ];
  if (result.flags.length > 0) {
    lines.push(`Signal-quality flags: ${result.flags.join(", ")}`);
  }
  lines.push("Adjustments that fired:");
  const applied = result.adjustments.filter((a) => a.applied);
  if (applied.length === 0) {
    lines.push("- none (raw price already well-calibrated, no concerns)");
  } else {
    for (const a of applied) lines.push(`- ${a.label}: ${a.detail}`);
  }
  lines.push("", "Write the one-sentence read now.");
  return lines.join("\n");
}
