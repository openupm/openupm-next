import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const vuepressFile = (path: string): string =>
  fileURLToPath(new URL(`../../docs/.vuepress/${path}`, import.meta.url));

const readVuepressFile = (path: string): string =>
  readFileSync(vuepressFile(path), "utf8");

describe("UnityAiTrialAd", () => {
  const source = readVuepressFile("components/UnityAiTrialAd.vue");

  it("uses the Unity AI affiliate trial URL until July 1, 2026", () => {
    const packageListSource = readVuepressFile("layouts/PackageListLayout.vue");

    expect(source).toContain(
      'const unityAiTrialUrl = "https://unity.com/features/ai?aid=1011lJJH";',
    );
    expect(source).toContain(
      'const campaignEnd = new Date("2026-07-01T00:00:00");',
    );
    expect(source).toContain("new Date() < campaignEnd");
    expect(source).toContain("Try Unity AI FREE ✨");
    expect(source).toContain("border: 1px solid rgba($primary-color, 0.25);");
    expect(packageListSource).toContain(
      'const unityAiTrialCampaignEnd = new Date("2026-07-01T00:00:00");',
    );
    expect(packageListSource).toContain('title: "Unity AI FREE"');
    expect(packageListSource).toContain(
      'image: "/images/ads/unity-ai-trial-600.jpg"',
    );
    expect(packageListSource).toContain(
      'publisher: "Project-aware Assistant, AI Gateway, and MCP Server"',
    );
    expect(packageListSource).toContain(
      "const isUnityAiTrialAdActive = computed(() => new Date() < unityAiTrialCampaignEnd);",
    );
    expect(packageListSource).toContain(
      'items.push({ type: "ad", value: unityAiTrialAdPlacementData });',
    );
  });

  it("is shown next to the navbar brand only", () => {
    const donationSource = readVuepressFile("components/DonationSidebarAd.vue");
    const navbarBrandSource = readVuepressFile("theme/NavbarBrand.vue");
    const packageCardSource = readVuepressFile("components/PackageCard.vue");
    const adWidgetSource = readVuepressFile(
      "components/UnityAssetAdPlacementForPackageList.vue",
    );

    expect(donationSource).toContain(
      "Donate to OpenUPM with love! ❤️",
    );
    expect(donationSource).toContain("donation-sidebar-link");
    expect(donationSource).not.toContain("UnityAiTrialAd");
    expect(navbarBrandSource).toContain(
      '<UnityAiTrialAd variant="navbar" />',
    );
    expect(adWidgetSource).toContain('v-if="data.publisher"');
    expect(adWidgetSource).toContain("hasPriceCurrency");
    expect(adWidgetSource).toContain("'fas fa-gift'");
    expect(adWidgetSource).toContain("padding-left: unset;");
    expect(packageCardSource).toContain(".chip:first-child");
    expect(packageCardSource).toContain("padding-left: unset;");
    expect(adWidgetSource).toContain("no-external-link-icon");
    expect(adWidgetSource).toContain(
      ":global(.external-link-icon .ad-placement a.no-external-link-icon::after)",
    );
  });
});
