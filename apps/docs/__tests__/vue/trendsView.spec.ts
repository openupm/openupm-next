import { describe, expect, it } from "vitest";

import {
  filterSeries,
  formatNumber,
  latestValue,
  previousMonth,
  sumValues,
  valueAtDate,
} from "../../docs/.vuepress/trendsView";

describe("trends view helpers", () => {
  it("formats values and reads time-series values", () => {
    expect(formatNumber(123456)).toEqual("123,456");
    const points = [
      { date: "2026-05", value: 1 },
      { date: "2026-06", value: 3 },
    ];
    expect(latestValue(points)).toEqual(3);
    expect(sumValues(points)).toEqual(4);
    expect(valueAtDate(points, "2026-05")).toEqual(1);
    expect(valueAtDate(points, "2026-04")).toEqual(0);
    expect(previousMonth("2026-06-11T00:00:00.000Z")).toEqual("2026-05");
  });

  it("filters topic series by key or label", () => {
    const series = [
      { key: "ai", label: "AI", points: [] },
      { key: "tools", label: "Editor Tools", points: [] },
    ];

    expect(filterSeries(series, "editor")).toEqual([series[1]]);
    expect(filterSeries(series, "ai")).toEqual([series[0]]);
    expect(filterSeries(series, "")).toEqual(series);
  });
});
