import { DeskBoard } from "@/components/desk/DeskBoard";
import { getDeskMarkets } from "@/lib/desk/marketData";

export const metadata = {
  title: "The Desk — MERIDIAN",
};

export default async function DeskPage() {
  const markets = await getDeskMarkets();

  return (
    <div className="mx-auto max-w-6xl w-full px-5 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">The Desk</h1>
        <p className="text-[var(--muted)] text-sm mt-1 max-w-2xl leading-relaxed">
          Tracked macro-event markets. Raw crowd price → Calibrated Probability →
          Confidence Grade. Click any row to see the full derivation, adjustment
          by adjustment.
        </p>
      </header>

      <DeskBoard markets={markets} />

      <p className="text-[var(--muted)] text-xs mt-6 leading-relaxed">
        Sample markets shown — live Kalshi / Polymarket data wires in at deploy.
        Every figure is produced by the deterministic model in{" "}
        <span className="mono">/lib/calibration</span>; the model writes no prose
        and invents no numbers.
      </p>
    </div>
  );
}
