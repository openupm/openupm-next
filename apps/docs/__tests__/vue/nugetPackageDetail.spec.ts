import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  getLatestNuGetVersion,
  getNuGetDependencies,
  getNuGetPackageVersions,
  getNuGetRepositoryUrl,
  getNuGetVersionInfo,
} from "../../docs/.vuepress/nugetPackageDetail";
import { Packument } from "@openupm/types";

const nugetLayoutPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/layouts/NuGetPackageDetailLayout.vue",
    import.meta.url,
  ),
);

const packageDependenciesViewPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/PackageDependenciesView.vue",
    import.meta.url,
  ),
);

describe("NuGet package detail UI", () => {
  const packument = {
    name: "org.nuget.newtonsoft.json",
    versions: {
      "13.0.3": {
        name: "org.nuget.newtonsoft.json",
        version: "13.0.3",
        unity: "2019.1",
        description: "Json.NET",
        displayName: "Json.NET (NuGet)",
        dependencies: { "org.nuget.system.buffers": "4.5.1" },
        readmeFilename: "",
        author: "James Newton-King",
        repository: { url: "https://github.com/JamesNK/Newtonsoft.Json" },
      },
    },
    time: { "13.0.3": "2023-03-08T07:42:54.647Z" },
    "dist-tags": { latest: "13.0.3" },
    readme: "",
  } as Packument;

  it("derives identity, latest version, dependencies, and version data from a packument", () => {
    const latestVersion = getLatestNuGetVersion(packument, "13.0.1");
    const versionInfo = getNuGetVersionInfo(packument, latestVersion);

    expect(latestVersion).toBe("13.0.3");
    expect(versionInfo.displayName).toBe("Json.NET (NuGet)");
    expect(versionInfo.author).toBe("James Newton-King");
    expect(getNuGetRepositoryUrl(versionInfo)).toBe(
      "https://github.com/JamesNK/Newtonsoft.Json",
    );
    expect(getNuGetDependencies(versionInfo)).toEqual([
      { name: "org.nuget.system.buffers", version: "4.5.1" },
    ]);
    expect(getNuGetPackageVersions(packument, latestVersion)[0]).toMatchObject({
      latest: true,
      unity: "2019.1",
      version: "13.0.3",
    });
  });

  it("drops unsafe repository URL schemes from packument metadata", () => {
    expect(
      getNuGetRepositoryUrl({
        repository: { url: "javascript:alert(document.domain)" },
      }),
    ).toBe("");
    expect(
      getNuGetRepositoryUrl({
        repository: { url: "https://github.com/JamesNK/Newtonsoft.Json" },
      }),
    ).toBe("https://github.com/JamesNK/Newtonsoft.Json");
  });

  it("fetches registry packument, package ads, and shows an unavailable state", () => {
    const source = readFileSync(nugetLayoutPath, "utf8");

    expect(source).toContain("const requestedPackageName = packageName.value");
    expect(source).toContain("getPackumentUrl(requestedPackageName)");
    expect(source).toContain("getPackageAdPlacementUrl(requestedPackageName)");
    expect(source).toContain("const store = useDefaultStore()");
    expect(source).toContain("fetchPackageDependencyMetadata()");
    expect(source).toContain("store.fetchCachedPackageMetadataLocalList()");
    expect(source).toContain("isCurrentRequest");
    expect(source).toContain("requestId === latestRequestId");
    expect(source).toContain("<UnityAssetAdPlacement");
    expect(source).toContain("AdsenseDisplayForPackageDetail");
    expect(source).toContain("state.isUnavailable = true");
    expect(source).toContain("UnityNuGet package data is unavailable");
  });

  it("does not include native OpenUPM-only sections", () => {
    const source = readFileSync(nugetLayoutPath, "utf8");

    expect(source).not.toContain("PackagePipelinesView");
    expect(source).not.toContain("PackageReadmeView");
    expect(source).not.toContain("PackageRelatedView");
    expect(source).not.toContain("PackageMetadataView");
  });

  it("uses the standard breadcrumb and install-only right meta column", () => {
    const source = readFileSync(nugetLayoutPath, "utf8");

    expect(source).toContain('<nav aria-label="Breadcrumb">');
    expect(source).toContain('<ul class="breadcrumb package-breadcrumb">');
    expect(source).toContain('<AutoLink :item="homeLink" />');
    expect(source).toContain('class="column column-meta col-4');
    expect(source).toContain("<PackageSetup");
    expect(source).toContain(':packument="state.packument"');
    expect(source).not.toContain('<p class="label label-primary">UnityNuGet</p>');
  });
});

describe("package dependency icons", () => {
  it("shows tooltip-up tooltips for dependency kind icons", () => {
    const source = readFileSync(packageDependenciesViewPath, "utf8");

    expect(source).toContain("UnityNuGet uplink dependency");
    expect(source).toContain("Git dependency with package page");
    expect(source).toContain("OpenUPM package dependency");
    expect(source).toContain("Unity package documentation");
    expect(source).toContain("Missing package dependency");
    expect(source).toContain("'tooltip', 'tooltip-up'");
    expect(source).toContain(':data-tooltip="entry.iconTooltip"');
  });

  it("links generated NuGet pages before applying OpenUPM existence checks", () => {
    const source = readFileSync(packageDependenciesViewPath, "utf8");

    expect(source).toContain("const isNuGet = name.startsWith(\"org.nuget.\")");
    expect(source).toContain("const openUpmPath = isNuGet || openUpmPackageExists");
    expect(source).toContain("getPackageDetailPagePath(name)");
  });

  it("links Unity dependencies to Unity documentation when OpenUPM has no package page", () => {
    const source = readFileSync(packageDependenciesViewPath, "utf8");

    expect(source).toContain("isPackageExist(name)");
    expect(source).toContain("name.startsWith(\"com.unity.\")");
    expect(source).toContain("https://docs.unity3d.com/Packages/");
    expect(source).toContain("name.startsWith(\"com.unity.modules.\")");
    expect(source).toContain("https://docs.unity3d.com/Manual/${name}.html");
    expect(source).toContain("getUnityPackageDocumentationVersion(version)");
    expect(source).toContain("^(\\d+\\.\\d+)(?:\\.|$)");
    expect(source).toContain("fab fa-unity");
    expect(source).toContain("unity-deps-documentation");
  });

  it("shows Google package detail ads in the left sidebar and right meta column", () => {
    const source = readFileSync(nugetLayoutPath, "utf8");

    expect(source).toContain("<template #sidebar-top>");
    expect(source).toContain('<div class="nuget-sidebar-ad">');
    expect(source).toContain('<section class="col-12 adsense-section">');
    expect(
      source.match(/<AdsenseDisplayForPackageDetail \/>/g) || [],
    ).toHaveLength(2);
  });
});
