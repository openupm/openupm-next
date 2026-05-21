import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const vuepressFile = (path: string): string =>
  fileURLToPath(new URL(`../../docs/.vuepress/${path}`, import.meta.url));

const readVuepressFile = (path: string): string =>
  readFileSync(vuepressFile(path), "utf8");

describe("docs runtime payload fetch behavior", () => {
  it("keeps PageSpeed resource hints for Google font and script chains", () => {
    const configSource = readVuepressFile("config.ts");
    const regionConfigSource = readVuepressFile("config-us.ts");

    expect(configSource).toContain('href: "https://fonts.googleapis.com"');
    expect(configSource).toContain('href: "https://fonts.gstatic.com"');
    expect(configSource).toContain('crossorigin: ""');
    expect(regionConfigSource).toContain(
      'href: "https://www.googletagmanager.com"',
    );
    expect(regionConfigSource).toContain(
      'href: "https://pagead2.googlesyndication.com"',
    );
    expect(regionConfigSource).toContain(
      'href: "https://fundingchoicesmessages.google.com"',
    );
  });

  it("keeps global client fetches route-aware", () => {
    const source = readVuepressFile("client.ts");

    expect(source).toContain("isPackageListPath(path)");
    expect(source).toContain("store.fetchCachedSiteInfo()");
    expect(source).toContain("store.fetchCachedPackageListData()");
    expect(source).toContain("defineAsyncComponent");
    expect(source).toContain('import("@/layouts/PackageListLayout.vue")');
    expect(source).toContain('import("@/layouts/PackageDetailLayout.vue")');
    expect(source).toContain('import("@/layouts/NuGetPackageDetailLayout.vue")');
    expect(source).not.toContain(
      'import PackageListLayout from "@/layouts/PackageListLayout.vue";',
    );
    expect(source).not.toContain(
      'import PackageDetailLayout from "@/layouts/PackageDetailLayout.vue";',
    );
    expect(source).not.toContain(
      'import NuGetPackageDetailLayout from "@/layouts/NuGetPackageDetailLayout.vue";',
    );
    expect(source).not.toContain("store.fetchCachedPackageMetadataRemoteDict();");
    expect(source).not.toContain("store.fetchCachedPackageMetadataLocalList();");
  });

  it("hydrates full package-list metadata only from routes and layouts that need it", () => {
    const storeSource = readVuepressFile("store.ts");
    const packageListSource = readVuepressFile("layouts/PackageListLayout.vue");
    const homeSource = readVuepressFile("layouts/HomeLayout.vue");

    expect(storeSource).toContain(
      "const storeFetchPromises = new WeakMap<object, StoreFetchPromises>();",
    );
    expect(storeSource).toContain("getStoreFetchPromises(this)");
    expect(storeSource).not.toContain(
      "let packageMetadataRemoteDictFetchPromise",
    );
    expect(storeSource).not.toContain(
      "let packageMetadataLocalListFetchPromise",
    );
    expect(storeSource).not.toContain("let packageListDataFetchPromise");
    expect(storeSource).not.toContain("let siteInfoFetchPromise");
    expect(storeSource).toContain("async fetchCachedPackageListData()");
    expect(storeSource).toContain("Promise.all([");
    expect(packageListSource).toContain("store.fetchCachedPackageListData()");
    expect(homeSource).toContain("readyPackageCountFallback");
    expect(homeSource).not.toContain("store.fetchCachedPackageMetadataRemoteDict()");
    expect(homeSource).not.toContain("store.fetchCachedPackageMetadataLocalList()");
    expect(storeSource).not.toContain('from "axios"');
    expect(storeSource).not.toContain('from "lodash-es"');
    expect(storeSource).not.toContain('from "url-join"');
  });

  it("loads package detail payloads without a serial all-data waterfall", () => {
    const source = readVuepressFile("layouts/PackageDetailLayout.vue");

    expect(source).toContain("await Promise.all([");
    expect(source).toContain("fetchPackageInfo()");
    expect(source).toContain("fetchPackument()");
    expect(source).toContain("fetchMonthlyDownloads()");
    expect(source).toContain("fetchPackageMetadata()");
    expect(source).toContain("store.fetchCachedPackageMetadataRemoteDict()");
    expect(source).toContain("store.fetchCachedPackageMetadataLocalList()");
    expect(source).toContain("const fetchCurrentSubPageData = (): void => {");
    expect(source).toContain("currentSubPageSlug.value === SubPageSlug.related");
    expect(source).toContain("if (state.__sameScopePackagesFetched) return;");
    expect(source).toContain(
      "count: state.__sameScopePackagesFetched ? relatedPackages.value.length : undefined",
    );
  });
});
