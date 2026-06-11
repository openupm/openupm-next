import { TrendsPoint, TrendsSeries } from "@openupm/types";

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function latestValue(points: TrendsPoint[]): number {
  return points.length ? points[points.length - 1].value : 0;
}

export function sumValues(points: TrendsPoint[]): number {
  return points.reduce((sum, point) => sum + point.value, 0);
}

export function previousMonth(value: string): string {
  const date = new Date(`${value.substring(0, 7)}-01T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().substring(0, 7);
}

export function shouldShowYearTick(dates: string[], index: number): boolean {
  const value = dates[index];
  if (!value) return false;
  const year = value.substring(0, 4);
  const previousDate = dates[index - 1];
  return previousDate?.substring(0, 4) !== year;
}

export function formatYearTick(
  value: string,
  index: number,
  dates: string[],
): string {
  return shouldShowYearTick(dates, index) ? value.substring(0, 4) : "";
}

export function valueAtDate(points: TrendsPoint[], date: string): number {
  return points.find((point) => point.date === date)?.value || 0;
}

export function pickSeriesColor(index: number): string {
  const colors = [
    "#0b7285",
    "#a16207",
    "#5f3dc4",
    "#2b8a3e",
    "#c92a2a",
    "#364fc7",
    "#c2255c",
    "#087f5b",
  ];
  return colors[index % colors.length];
}

export function pickDarkSeriesColor(index: number): string {
  const colors = [
    "#22d3ee",
    "#facc15",
    "#a78bfa",
    "#4ade80",
    "#fb7185",
    "#818cf8",
    "#f472b6",
    "#34d399",
  ];
  return colors[index % colors.length];
}

export function filterSeries(
  series: TrendsSeries[],
  query: string,
): TrendsSeries[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return series;
  return series.filter(
    (entry) =>
      entry.key.toLowerCase().includes(normalized) ||
      entry.label.toLowerCase().includes(normalized),
  );
}
