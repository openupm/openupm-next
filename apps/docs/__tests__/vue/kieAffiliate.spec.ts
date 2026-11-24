import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  KIE_AFFILIATE_URLS,
  KIE_CAMPAIGN_END,
  KIE_CAMPAIGN_START,
  isKieCampaignActiveAt,
} from "../../docs/.vuepress/kieAffiliate";

const readVuepressFile = (path: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../../docs/.vuepress/${path}`, import.meta.url)),
    "utf8",
  );

describe("KIE affiliate placement", () => {
  it("uses a distinct short link per placement", () => {
    expect(KIE_AFFILIATE_URLS).toEqual({
      list: "https://link.littlebigfun.com/kie-list",
      grid: "https://link.littlebigfun.com/kie-grid",
      ai: "https://link.littlebigfun.com/kie-ai",
    });
  });

  it("runs from 2026-12-01 to 2026-12-31 in Singapore time", () => {
    expect(KIE_CAMPAIGN_START.toISOString()).toBe("2026-11-30T16:00:00.000Z");
    expect(KIE_CAMPAIGN_END.toISOString()).toBe("2026-12-30T16:00:00.000Z");

    expect(isKieCampaignActiveAt(KIE_CAMPAIGN_START.getTime() - 1)).toBe(false);
    expect(isKieCampaignActiveAt(KIE_CAMPAIGN_START.getTime())).toBe(true);
    expect(isKieCampaignActiveAt(KIE_CAMPAIGN_END.getTime() - 1)).toBe(true);
    expect(isKieCampaignActiveAt(KIE_CAMPAIGN_END.getTime())).toBe(false);
  });

  it("puts the KIE card first in the package grid and directly under the sidebar donation link", () => {
    const source = readVuepressFile("layouts/PackageListLayout.vue");
    const gridInsertion = source.indexOf('items.push({ type: "kie" });');
    const packageLoop = source.indexOf("for (let i = 0; i < metadataEntries.value.length; i++)");
    const sidebarCard = source.indexOf(
      '<KieAffiliateAd v-if="isKieCampaignActive" variant="sidebar" :href="KIE_AFFILIATE_URLS.list" />',
    );
    const assetStoreSale = source.indexOf("<UnityAssetStoreSale />");

    expect(gridInsertion).toBeGreaterThan(-1);
    expect(gridInsertion).toBeLessThan(packageLoop);
    expect(sidebarCard).toBeGreaterThan(-1);
    expect(sidebarCard).toBeLessThan(assetStoreSale);
    expect(source).toContain(
      '<KieAffiliateAd variant="grid" :style="style" :href="KIE_AFFILIATE_URLS.grid" />',
    );
  });

  it("shows the detail card only when the package has the ai topic", () => {
    const source = readVuepressFile("layouts/PackageDetailLayout.vue");
    const detailCard = source.indexOf(
      '<KieAffiliateAd v-if="showKieAd" variant="sidebar" :href="KIE_AFFILIATE_URLS.ai" />',
    );
    const subpageSection = source.indexOf('<section class="subpage-section">');

    expect(source).toContain(
      'const isAiTopic = computed(() => topics.value.some((topic) => topic.slug === "ai"));',
    );
    expect(source).toContain(
      "const showKieAd = computed(() => isKieCampaignActive.value && isAiTopic.value);",
    );
    expect(detailCard).toBeGreaterThan(-1);
    expect(detailCard).toBeLessThan(subpageSection);
  });

  it("labels the card as an affiliate placement, leads with the discount and blocks SEO weight", () => {
    const source = readVuepressFile("components/KieAffiliateAd.vue");

    expect(source).toContain("Affiliate");
    expect(source).not.toContain("Sponsor");
    expect(source).not.toContain("Ad · Affiliate");
    expect(source).toContain("Up to 88% off official AI API prices");
    expect(source).toContain("80 free credits");
    expect(source).toContain('src="/images/ads/kie-logo.png"');
    expect(
      existsSync(
        fileURLToPath(
          new URL(
            "../../docs/.vuepress/public/images/ads/kie-logo.png",
            import.meta.url,
          ),
        ),
      ),
    ).toBe(true);
    expect(source).toContain(
      'rel="sponsored nofollow noopener"',
    );
    expect(source).toContain('target="_blank"');
    expect(source).not.toContain("?ref=");
  });
});
