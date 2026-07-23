import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createTimedCampaignState } from "../../docs/.vuepress/featuredListingAd";

const packageListSource = readFileSync(
  fileURLToPath(
    new URL(
      "../../docs/.vuepress/layouts/PackageListLayout.vue",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("featured listing ad", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the PlayMaker 2 affiliate promotion first through July 31, 2026", () => {
    expect(packageListSource).toContain(
      'const featuredListingAdCampaignEnd = new Date("2026-07-31T00:00:00Z");',
    );
    expect(packageListSource).toContain('title: "PlayMaker 2"');
    expect(packageListSource).toContain('originalPrice: "$65"');
    expect(packageListSource).toContain('price: "$32.50"');
    expect(packageListSource).toContain("ratingCount: 2908");
    expect(packageListSource).toContain(
      "https://af.unity.com/sr/camref:1011lJJH/destination:https://assetstore.unity.com/packages/tools/visual-scripting/playmaker2-391026",
    );
    expect(packageListSource).toContain(
      'publisher: "Hutong Games LLC · Affiliate"',
    );
    const featuredAdInsertion = packageListSource.indexOf(
      'items.push({ type: "ad", value: featuredListingAdPlacementData });',
    );
    const packageInsertionLoop = packageListSource.indexOf(
      "for (let i = 0; i < metadataEntries.value.length; i++)",
    );
    expect(featuredAdInsertion).toBeGreaterThan(-1);
    expect(featuredAdInsertion).toBeLessThan(packageInsertionLoop);
    expect(packageListSource).toContain(
      "onUnmounted(featuredListingAdCampaign.stop);",
    );
  });

  it("expires an open listing at the campaign boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T23:59:59.999Z"));
    const campaign = createTimedCampaignState(
      new Date("2026-07-31T00:00:00Z"),
    );

    campaign.start();
    expect(campaign.isActive.value).toBe(true);

    vi.advanceTimersByTime(1);
    expect(campaign.isActive.value).toBe(false);
  });

  it("stays inactive at expiry and cancels pending expiry work on stop", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T23:59:59.999Z"));
    const activeCampaign = createTimedCampaignState(
      new Date("2026-07-31T00:00:00Z"),
    );
    activeCampaign.start();
    expect(vi.getTimerCount()).toBe(1);
    activeCampaign.stop();
    expect(vi.getTimerCount()).toBe(0);

    vi.setSystemTime(new Date("2026-07-31T00:00:00Z"));
    const expiredCampaign = createTimedCampaignState(
      new Date("2026-07-31T00:00:00Z"),
    );
    expiredCampaign.start();
    expect(expiredCampaign.isActive.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
