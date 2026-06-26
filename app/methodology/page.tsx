import Link from "next/link";

export const metadata = {
  title: "Methodology — MERIDIAN",
  description:
    "How the Calibration Model turns a raw prediction-market price into a calibrated probability and a confidence grade — every adjustment shown.",
};

function Correction({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[var(--border)] pt-5">
      <h3 className="text-base font-medium text-[var(--text)]">
        <span className="mono text-[var(--muted)] mr-2">{n}.</span>
        {title}
      </h3>
      <div className="text-[var(--muted)] text-[15px] leading-relaxed mt-2 space-y-2">
        {children}
      </div>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 py-14">
      <p className="text-[var(--muted)] text-xs uppercase tracking-[0.2em] mb-4">
        Methodology
      </p>
      <h1 className="text-3xl font-semibold tracking-tight leading-tight mb-5">
        The Calibration Model
      </h1>
      <p className="text-[var(--muted)] text-lg leading-relaxed mb-4">
        A prediction-market price is a useful but noisy estimate of a
        probability. The Calibration Model turns that raw price into a{" "}
        <span className="text-[var(--text)]">Calibrated Probability</span> and a{" "}
        <span className="text-[var(--text)]">Confidence Grade</span> by applying
        a small set of documented, deterministic corrections — and showing every
        one of them.
      </p>
      <p className="text-[var(--muted)] text-lg leading-relaxed mb-10">
        It is not a language model guessing. The math is fixed and inspectable;
        the only thing the AI ever does on this site is write a sentence of
        plain-English interpretation on top. That separation —{" "}
        <span className="text-[var(--text)]">deterministic core, narrative
        shell</span>{" "}
        — is the whole point. The instant a number becomes a black box, this is
        just another wrapper.
      </p>

      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">
        One number moves; the rest grade confidence
      </h2>
      <p className="text-[var(--muted)] text-[15px] leading-relaxed mb-8">
        Exactly one correction changes the probability — the favorite–longshot
        transform. The other four never touch the number; they assess how much
        to trust it and surface what looks off. We surface signal quality; we
        never silently override the market.
      </p>

      <div className="space-y-6">
        <Correction n={1} title="Favorite–longshot calibration">
          <p>
            Crowds systematically overprice longshots and underprice favorites.
            We correct this with a transform fit on resolved markets:{" "}
            <span className="mono text-[var(--text)]">
              calibrated = sigmoid(a + b · logit(raw))
            </span>
            . A coin-flip stays put; longshots are nudged down and favorites up.
          </p>
          <p>
            This is the only step that moves the number. The curve is re-fit
            monthly against newly resolved markets, and its parameters are
            published — not hidden.
          </p>
        </Correction>

        <Correction n={2} title="Liquidity / concentration discount">
          <p>
            A price from a thin book, or one dominated by a few large wallets, is
            less trustworthy. We discount confidence accordingly and flag
            whale-dominated markets explicitly. The probability itself is left
            unchanged.
          </p>
        </Correction>

        <Correction n={3} title="Momentum-regime flag">
          <p>
            When a market&apos;s price is mostly tracking its own momentum rather
            than reacting to news (detected as positive autocorrelation in its
            recent moves), it is a lower-signal regime. We flag it and lower
            confidence.
          </p>
        </Correction>

        <Correction n={4} title="Base-rate anchor">
          <p>
            We compare the calibrated probability against the historical base
            rate for that kind of event and an external reference where one
            exists (e.g. CME FedWatch for Fed decisions, economist consensus for
            prints). A wide gap is surfaced as a flag — never used to quietly
            rewrite the number.
          </p>
        </Correction>

        <Correction n={5} title="Cross-venue check">
          <p>
            Where the same event trades on both Kalshi and Polymarket,
            disagreement between the two is itself a signal-quality flag. Partial
            coverage is expected — many macro markets list on only one venue.
          </p>
        </Correction>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mt-12 mb-1">
        What you get
      </h2>
      <p className="text-[var(--muted)] text-[15px] leading-relaxed mb-3">
        For every tracked market: a Calibrated Probability, a Confidence Grade
        from A to D (built by compounding the confidence discounts above), and a
        complete, ordered breakdown of every adjustment. On{" "}
        <Link href="/desk" className="text-[var(--text)] underline underline-offset-4 decoration-[var(--border)] hover:decoration-[var(--muted)]">
          the Desk
        </Link>
        , click any number to see exactly how it was derived.
      </p>
      <p className="text-[var(--muted)] text-[15px] leading-relaxed">
        We track macro, liquid markets only — Fed decisions, inflation, jobs,
        growth. That is where prediction markets are deepest and most reliable,
        and it is the corner of the space where this method has the most to say.
      </p>

      <p className="text-[var(--muted)] text-xs leading-relaxed mt-12 border-t border-[var(--border)] pt-5">
        This is research and education — analysis of public market data. It is
        not investment advice, not a recommendation to trade, and not brokerage.
      </p>
    </article>
  );
}
