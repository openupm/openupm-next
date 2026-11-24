import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  KIE_AFFILIATE_URLS,
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

  it("shows the card immediately on every list page", () => {
    const source = readVuepressFile("layouts/PackageListLayout.vue");
    const gridInsertion = source.indexOf('items.push({ type: "kie" });');
    const packageLoop = source.indexOf("for (let i = 0; i < metadataEntries.value.length; i++)");
    const sidebarCard = source.indexOf(
      '<KieAffiliateAd variant="sidebar" :href="KIE_AFFILIATE_URLS.list" />',
    );
    const assetStoreSale = source.indexOf("<UnityAssetStoreSale />");

    expect(gridInsertion).toBeGreaterThan(-1);
    expect(gridInsertion).toBeLessThan(packageLoop);
    expect(sidebarCard).toBeGreaterThan(-1);
    expect(sidebarCard).toBeLessThan(assetStoreSale);
    expect(source).not.toContain("isKieCampaignActive");
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
      "const showKieAd = computed(() => isAiTopic.value);",
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
