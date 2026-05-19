import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const vuepressFile = (path: string): string =>
  fileURLToPath(new URL(`../../docs/.vuepress/${path}`, import.meta.url));

const readVuepressFile = (path: string): string =>
  readFileSync(vuepressFile(path), "utf8");

describe("docs runtime payload fetch behavior", () => {
  it("keeps global client fetches route-aware", () => {
    const source = readVuepressFile("client.ts");

    expect(source).toContain("isPackageListPath(path)");
    expect(source).toContain("store.fetchCachedSiteInfo()");
    expect(source).toContain("store.fetchCachedPackageListData()");
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
    expect(homeSource).toContain("store.fetchCachedPackageMetadataRemoteDict()");
    expect(homeSource).not.toContain("store.fetchCachedPackageMetadataLocalList()");
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
  });
});
