/**
 * External reference anchor: economic calendar (release schedule + consensus),
 * used to anchor prints (CPI / jobs / GDP). Live source is TBD; returns [] until
 * configured.
 */

export interface EconEvent {
  id: string;
  title: string;
  category: "cpi" | "jobs" | "gdp" | "fed" | "other";
  releaseTime: string; // ISO
  consensus?: number;
  previous?: number;
  actual?: number;
}

export async function getEconCalendar(
  _opts: { from?: string; to?: string } = {},
): Promise<EconEvent[]> {
  // TODO: wire a live econ-calendar source (and confirm its terms).
  return [];
}
