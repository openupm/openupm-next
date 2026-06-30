import { describe, expect, it } from "vitest";

import {
  estimateReadmeContentHeightPx,
  selectAdsenseInArticleBoundaryIndexes,
  shouldAppendAdsenseInArticleFallbackAd,
} from "../../docs/.vuepress/adsense";

describe("README in-article ad placement", () => {
  const options = { viewportHeightPx: 1000 };

  it("places ads at section boundaries once roughly a viewport of content has passed", () => {
    const placements = selectAdsenseInArticleBoundaryIndexes(
      [
        {
          estimatedContentLength: 100,
          measuredTopPx: 80,
          isFirstContentHeading: true,
        },
        { estimatedContentLength: 700, measuredTopPx: 520 },
        { estimatedContentLength: 1500, measuredTopPx: 980 },
        { estimatedContentLength: 2600, measuredTopPx: 1900 },
      ],
      options,
    );

    expect(placements).toEqual([2, 3]);
  });

  it("uses content length when measured layout is unavailable", () => {
    const placements = selectAdsenseInArticleBoundaryIndexes(
      [
        { estimatedContentLength: 200, isFirstContentHeading: true },
        { estimatedContentLength: 900 },
        { estimatedContentLength: 1600 },
        { estimatedContentLength: 3050 },
      ],
      options,
    );

    expect(placements).toEqual([2, 3]);
  });

  it("skips the first top-of-article heading instead of inserting an ad above the content", () => {
    const placements = selectAdsenseInArticleBoundaryIndexes(
      [
        {
          estimatedContentLength: 0,
          measuredTopPx: 0,
          isFirstContentHeading: true,
        },
        { estimatedContentLength: 1500, measuredTopPx: 980 },
      ],
      options,
    );

    expect(placements).toEqual([1]);
  });

  it("appends one fallback ad for headingless README content", () => {
    expect(shouldAppendAdsenseInArticleFallbackAd(300, 0, 0, options)).toBe(
      true,
    );
    expect(shouldAppendAdsenseInArticleFallbackAd(0, 0, 0, options)).toBe(
      false,
    );
    expect(shouldAppendAdsenseInArticleFallbackAd(300, 1, 0, options)).toBe(
      false,
    );
  });

  it("appends one fallback ad for long README content without eligible section boundaries", () => {
    expect(shouldAppendAdsenseInArticleFallbackAd(2000, 0, 1, options)).toBe(
      true,
    );
    expect(shouldAppendAdsenseInArticleFallbackAd(2000, 1, 1, options)).toBe(
      false,
    );
    expect(shouldAppendAdsenseInArticleFallbackAd(800, 0, 1, options)).toBe(
      false,
    );
  });

  it("estimates README height from text length relative to viewport height", () => {
    expect(estimateReadmeContentHeightPx(1450, options)).toBe(1000);
  });
});
