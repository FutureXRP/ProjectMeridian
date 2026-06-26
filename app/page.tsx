import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 sm:py-28">
      <p className="text-[var(--muted)] text-xs uppercase tracking-[0.2em] mb-5">
        The macro-event risk desk
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.15] mb-6">
        What the market is saying — and where the method sees distortion.
      </h1>
      <p className="text-[var(--muted)] text-lg leading-relaxed mb-9 max-w-2xl">
        MERIDIAN reads public prediction-market prices on macro events, applies a
        transparent, deterministic calibration model, and shows its work — every
        number on the desk expands to the exact adjustments that produced it.
      </p>
      <Link
        href="/desk"
        className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm font-medium hover:border-zinc-500 transition-colors"
      >
        Enter the Desk →
      </Link>
    </div>
  );
}
