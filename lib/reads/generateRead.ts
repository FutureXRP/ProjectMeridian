import Anthropic from "@anthropic-ai/sdk";
import type { CalibrationResult } from "../calibration/types";
import { checkReadGuardrails, type GuardrailReport } from "./guardrails";
import {
  buildReadUserContent,
  READ_PROMPT_VERSION,
  READ_SYSTEM_PROMPT,
} from "./prompt";

/** Default model for reads. Latest, most capable Claude (see claude-api skill). */
const DEFAULT_MODEL = "claude-opus-4-8";

export interface GeneratedRead {
  read: string;
  model: string;
  promptVersion: string;
  /** Deterministic post-check — language only, no advice, one line. */
  guardrails: GuardrailReport;
}

export interface GenerateReadOptions {
  /** Override the model. Defaults to claude-opus-4-8. */
  model?: string;
  /** Inject a pre-configured client (tests / custom auth). Defaults to a new one. */
  client?: Anthropic;
}

/**
 * Generate the one-line read for a market, grounded strictly in its calibration
 * breakdown. The model writes prose only — it never sees or returns a probability
 * it could alter, and the result is checked against the advice/length guardrails
 * before being returned.
 *
 * Server-side only: constructs an Anthropic client that reads ANTHROPIC_API_KEY
 * from the environment. Never call this from a client component.
 *
 * Note: no `temperature` / sampling params and no `thinking` config — Opus 4.8
 * rejects sampling params (400), and a one-liner needs no thinking; the system
 * prompt constrains output to a single sentence.
 */
export async function generateRead(
  result: CalibrationResult,
  opts: GenerateReadOptions = {},
): Promise<GeneratedRead> {
  const model = opts.model ?? DEFAULT_MODEL;
  const client = opts.client ?? new Anthropic();

  const message = await client.messages.create({
    model,
    max_tokens: 200,
    system: READ_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildReadUserContent(result) }],
  });

  const read = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return {
    read,
    model,
    promptVersion: READ_PROMPT_VERSION,
    guardrails: checkReadGuardrails(read),
  };
}
