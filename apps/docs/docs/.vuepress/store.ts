import { defineStore } from "pinia";

import { getAPIBaseUrl, getPublicGenPath } from "@openupm/common/build/urls.js";
import {
  PackageMetadataLocal,
  PackageMetadataRemote,
  SiteInfo,
} from "@openupm/types";
import { METADATA_LOCAL_LIST_FILENAME } from "@openupm/types";

const joinApiPath = (baseUrl: string, path: string): string =>
  `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${url}`);
  }
  return (await response.json()) as T;
};

const parsePackageMetadataRemoteDict = async (
  data: Record<string, unknown>,
): Promise<Record<string, PackageMetadataRemote>> => {
  const { parsePackageMetadataRemote } = await import(
    "@openupm/common/build/utils.js"
  );
  return Object.fromEntries(
    Object.entries(data).map(([name, value]) => [
      name,
      parsePackageMetadataRemote(value),
    ]),
  );
};

const formatCompactNumber = (value: number): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}m`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return value.toString();
};

type StoreFetchPromises = {
  packageMetadataRemoteDict?: Promise<void> | null;
  packageMetadataLocalList?: Promise<void> | null;
  packageListData?: Promise<void> | null;
  siteInfo?: Promise<void> | null;
};

const storeFetchPromises = new WeakMap<object, StoreFetchPromises>();

const getStoreFetchPromises = (store: object): StoreFetchPromises => {
  let fetchPromises = storeFetchPromises.get(store);
  if (!fetchPromises) {
    fetchPromises = {};
    storeFetchPromises.set(store, fetchPromises);
  }
  return fetchPromises;
};

export const useDefaultStore = defineStore("pinia-default", {
  persist: __VUEPRESS_SSR__ ? false : true,
  state() {
    return {
      packageMetadataRemoteDict: {} as Record<string, PackageMetadataRemote>,
      packageMetadataLocalList: [] as PackageMetadataLocal[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentPackages: [] as any[],
      siteInfo: { stars: 0, readyPackageCount: 0 } as SiteInfo,
      __packageMetadataRemoteDictFetchTime: 0,
      __packageMetadataLocalListFetchTime: 0,
      __siteInfoFetchTime: 0,
    };
  },

  getters: {
    isMetadataReady: (state) => {
      return (
        Object.keys(state.packageMetadataRemoteDict).length > 0 &&
        state.packageMetadataLocalList.length > 0
      );
    },
    readyPackageCount: (state) => {
      if (state.siteInfo.readyPackageCount) {
        return state.siteInfo.readyPackageCount;
      }
      let num = 0;
      for (const name in state.packageMetadataRemoteDict) {
        const metadata = state.packageMetadataRemoteDict[name];
        if (metadata.ver) {
          num += 1;
        }
      }
      return num;
    },
    formattedStars: (state) => {
      const value = Number(state.siteInfo.stars);
      if (isNaN(value) || value == 0) return "...";
      return formatCompactNumber(value);
    },
  },

  actions: {
    /**
     * Fetch package metadata remote dict into the store.
     */
    async fetchPackageMetadataRemoteDict() {
      const apiBaseUrl = getAPIBaseUrl();
      try {
        const data = await fetchJson<Record<string, unknown>>(
          joinApiPath(apiBaseUrl, "/packages/extra"),
        );
        this.__packageMetadataRemoteDictFetchTime = new Date().getTime();
        this.packageMetadataRemoteDict = await parsePackageMetadataRemoteDict(
          data,
        );
      } catch (error) {
        console.error(error);
      }
    },
    /**
     * Fetch package metadata remote dict into the store with cache.
     */
    async fetchCachedPackageMetadataRemoteDict() {
      const timeElapsed =
        new Date().getTime() - (this.__packageMetadataRemoteDictFetchTime || 0);
      const cacheTime = 5 * 60 * 1000;
      if (timeElapsed <= cacheTime) return;
      const fetchPromises = getStoreFetchPromises(this);
      if (!fetchPromises.packageMetadataRemoteDict) {
        fetchPromises.packageMetadataRemoteDict =
          this.fetchPackageMetadataRemoteDict().finally(() => {
            fetchPromises.packageMetadataRemoteDict = null;
          });
      }
      await fetchPromises.packageMetadataRemoteDict;
    },
    /**
     * Fetch package metadata local list into the store.
     */
    async fetchPackageMetadataLocalList() {
      try {
        this.packageMetadataLocalList = await fetchJson<PackageMetadataLocal[]>(
          getPublicGenPath(METADATA_LOCAL_LIST_FILENAME),
        );
        this.__packageMetadataLocalListFetchTime = new Date().getTime();
      } catch (error) {
        console.error(error);
      }
    },
    /**
     * Fetch package metadata local list into the store with cache.
     */
    async fetchCachedPackageMetadataLocalList() {
      const timeElapsed =
        new Date().getTime() - (this.__packageMetadataLocalListFetchTime || 0);
      const cacheTime = 5 * 60 * 1000;
      if (timeElapsed <= cacheTime) return;
      const fetchPromises = getStoreFetchPromises(this);
      if (!fetchPromises.packageMetadataLocalList) {
        fetchPromises.packageMetadataLocalList =
          this.fetchPackageMetadataLocalList().finally(() => {
            fetchPromises.packageMetadataLocalList = null;
          });
      }
      await fetchPromises.packageMetadataLocalList;
    },
    /**
     * Fetch the package list data required by list/search views with cache.
     */
    async fetchCachedPackageListData() {
      const fetchPromises = getStoreFetchPromises(this);
      if (!fetchPromises.packageListData) {
        fetchPromises.packageListData = Promise.all([
          this.fetchCachedPackageMetadataRemoteDict(),
          this.fetchCachedPackageMetadataLocalList(),
        ]).then(() => undefined).finally(() => {
          fetchPromises.packageListData = null;
        });
      }
      await fetchPromises.packageListData;
    },
    /**
     * Fetch recent packages into the store.
     */
    async fetchRecentPackages() {
      const apiBaseUrl = getAPIBaseUrl();
      try {
        this.recentPackages = await fetchJson(
          joinApiPath(apiBaseUrl, "/packages/recent"),
        );
      } catch (error) {
        console.error(error);
      }
    },
    /**
     * Fetch site info into the store.
     */
    async fetchSiteInfo() {
      const apiBaseUrl = getAPIBaseUrl();
      try {
        const siteInfo = await fetchJson<SiteInfo>(
          joinApiPath(apiBaseUrl, "site/info"),
        );
        this.__siteInfoFetchTime = new Date().getTime();
        this.siteInfo = siteInfo;
      } catch (error) {
        console.error(error);
      }
    },
    /**
     * Fetch site info into the store with cache.
     */
    async fetchCachedSiteInfo() {
      const timeElapsed =
        new Date().getTime() - (this.__siteInfoFetchTime || 0);
      const cacheTime = 5 * 60 * 1000;
      if (timeElapsed <= cacheTime) return;
      const fetchPromises = getStoreFetchPromises(this);
      if (!fetchPromises.siteInfo) {
        fetchPromises.siteInfo = this.fetchSiteInfo().finally(() => {
          fetchPromises.siteInfo = null;
        });
      }
      await fetchPromises.siteInfo;
    },
  },
});
