"use client";

import { useState } from "react";
import type { Adjustment, CalibrationResult } from "@/lib/calibration/types";
import {
  flagLabel,
  GRADE_CLASS,
  GRADE_DESCRIPTION,
  pct,
  signedPct,
  venueLabel,
} from "@/lib/desk/format";

function deltaTone(delta: number): string {
  if (delta > 0.002) return "text-emerald-400";
  if (delta < -0.002) return "text-rose-400";
  return "text-[var(--muted)]";
}

function deltaGlyph(delta: number): string {
  if (delta > 0.002) return "▲";
  if (delta < -0.002) return "▼";
  return "→";
}

function GradeChip({ grade }: { grade: CalibrationResult["grade"] }) {
  return (
    <span
      title={GRADE_DESCRIPTION[grade]}
      className={`inline-flex items-center justify-center w-6 h-6 rounded border text-xs font-semibold ${GRADE_CLASS[grade]}`}
    >
      {grade}
    </span>
  );
}

function Metric({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start sm:items-end gap-1 min-w-[4.5rem]">
      <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
        {label}
      </span>
      <span className="mono tnum text-sm">{children}</span>
    </div>
  );
}

/** One correction's line in the derivation breakdown. */
function AdjustmentRow({ a }: { a: Adjustment }) {
  const effect =
    a.delta !== 0
      ? `${signedPct(a.delta)} pts`
      : a.confidencePenalty > 0
        ? `−${pct(a.confidencePenalty, 0)} conf`
        : "—";
  return (
    <li className="grid grid-cols-[0.9rem_1fr] gap-2.5">
      <span
        className={`mt-1 text-[10px] leading-none ${a.applied ? "text-zinc-400" : "text-zinc-700"}`}
        aria-hidden
      >
        {a.applied ? "●" : "○"}
      </span>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[var(--text)] text-sm">{a.label}</span>
          <span className="mono tnum text-xs text-[var(--muted)] shrink-0">
            {effect}
          </span>
        </div>
        <p className="text-[var(--muted)] text-xs mt-1 leading-relaxed">
          {a.detail}
        </p>
      </div>
    </li>
  );
}

/** The "show your work" panel: the full per-adjustment derivation. */
function Derivation({ result }: { result: CalibrationResult }) {
  return (
    <div className="px-3 sm:px-4 pb-4 bg-[var(--panel)]">
      <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-4">
        <div className="flex items-center gap-2 flex-wrap mono tnum text-[var(--muted)] text-sm mb-4">
          <span>Raw {pct(result.rawProbability)}</span>
          <span aria-hidden>→</span>
          <span className="text-[var(--text)]">
            Calibrated {pct(result.calibratedProbability)}
          </span>
          <span className="text-xs ml-1">
            · confidence {pct(result.confidenceScore, 0)} · grade {result.grade}
          </span>
        </div>
        <ol className="space-y-3">
          {result.adjustments.map((a) => (
            <AdjustmentRow key={a.key} a={a} />
          ))}
        </ol>
      </div>
    </div>
  );
}

export function DeskBoard({ markets }: { markets: CalibrationResult[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <ul>
        {markets.map((m) => {
          const isOpen = expanded === m.marketId;
          const delta = m.calibratedProbability - m.rawProbability;
          return (
            <li
              key={m.marketId}
              className="border-b border-[var(--border)] last:border-0"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : m.marketId)}
                aria-expanded={isOpen}
                className="w-full text-left px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-[var(--panel)] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-[var(--text)] leading-snug">
                    {m.question}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                      {venueLabel(m.venue)}
                    </span>
                    {m.flags.map((f) => (
                      <span
                        key={f}
                        className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]"
                      >
                        {flagLabel(f)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-5 sm:gap-7 shrink-0 sm:pl-4">
                  <Metric label="Raw">
                    <span className="text-[var(--muted)]">
                      {pct(m.rawProbability)}
                    </span>
                  </Metric>
                  <Metric label="Calibrated">
                    <span className="text-[var(--text)]">
                      {pct(m.calibratedProbability)}
                    </span>
                    <span className={`ml-1.5 text-xs ${deltaTone(delta)}`}>
                      {deltaGlyph(delta)} {signedPct(delta)}
                    </span>
                  </Metric>
                  <div className="flex flex-col items-start sm:items-end gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                      Grade
                    </span>
                    <GradeChip grade={m.grade} />
                  </div>
                </div>
              </button>

              {isOpen && <Derivation result={m} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
