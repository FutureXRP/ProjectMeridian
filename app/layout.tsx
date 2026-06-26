import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MERIDIAN — the macro-event risk desk",
  description:
    "Transparent, calibrated probabilities for macro-event markets. Research, not advice.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl w-full px-5 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight">
              MERIDIAN
              <span className="text-[var(--muted)] font-normal"> · risk desk</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm text-[var(--muted)]">
              <Link href="/desk" className="hover:text-[var(--text)] transition-colors">
                Desk
              </Link>
              <Link
                href="/methodology"
                className="hover:text-[var(--text)] transition-colors"
              >
                Methodology
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-[var(--border)] text-xs text-[var(--muted)]">
          <div className="mx-auto max-w-6xl w-full px-5 py-4 leading-relaxed">
            <strong className="text-[var(--text)] font-medium">
              Research, not advice.
            </strong>{" "}
            MERIDIAN is analysis of public prediction-market data — not investment
            advice, not a recommendation to trade, not brokerage. Every number is
            derived deterministically and can be inspected.
          </div>
        </footer>
      </body>
    </html>
  );
}
