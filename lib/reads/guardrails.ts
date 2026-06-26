/**
 * Deterministic backstop for the AI read. The prompt does the primary work, but
 * the model writes language, so we verify its output here rather than trust it:
 * no advice / recommendation language, and a length consistent with one line.
 * High-precision patterns only — a flag should mean a real violation, not a
 * descriptive use of a market word.
 */

const ADVICE_PATTERNS: readonly RegExp[] = [
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bgo (?:long|short)\b/i,
  /\b(?:long|short) (?:this|the|it)\b/i,
  /\byou should\b/i,
  /\bwe should\b/i,
  /\brecommend/i,
  /\bplace a bet\b/i,
  /\bwager\b/i,
  /\btake a position\b/i,
  /\bload up\b/i,
];

/** A read longer than this is no longer "one line". */
const MAX_READ_LENGTH = 320;

export interface GuardrailReport {
  ok: boolean;
  violations: string[];
}

export function checkReadGuardrails(read: string): GuardrailReport {
  const violations: string[] = [];
  const text = read.trim();

  for (const re of ADVICE_PATTERNS) {
    if (re.test(text)) violations.push(`advice/recommendation language (/${re.source}/)`);
  }
  if (text.length === 0) violations.push("empty read");
  if (text.length > MAX_READ_LENGTH) {
    violations.push(`too long for a one-line read (${text.length} > ${MAX_READ_LENGTH})`);
  }

  return { ok: violations.length === 0, violations };
}
