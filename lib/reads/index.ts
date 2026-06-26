/**
 * /lib/reads — the AI narrative layer. Generates a one-line, plain-language read
 * per market, grounded strictly in the deterministic calibration breakdown.
 *
 * The model writes language only; it never computes or alters a probability and
 * never gives advice. Prompts are versioned in prompt.ts. Server-side only.
 */
export {
  buildReadUserContent,
  READ_PROMPT_VERSION,
  READ_SYSTEM_PROMPT,
} from "./prompt";
export { checkReadGuardrails } from "./guardrails";
export type { GuardrailReport } from "./guardrails";
export { generateRead } from "./generateRead";
export type { GeneratedRead, GenerateReadOptions } from "./generateRead";
