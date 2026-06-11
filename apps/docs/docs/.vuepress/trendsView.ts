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
