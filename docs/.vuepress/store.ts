import { mapValues } from 'lodash-es';
import axios from "axios";
import urljoin from "url-join";
import { defineStore } from 'pinia'

import { SortType } from "@/constant";
import { getAPIBaseUrl } from "@shared/urls";
import { PackageMetadataRemote, SiteInfo } from "@shared/types";
import { parsePackageMetadataRemote } from '@shared/utils';

export const useDefaultStore = defineStore('pinia-default', {
  persist: __VUEPRESS_SSR__ ? false : true,
  state() {
    return {
      packageMetadataRemoteList: {} as Record<string, PackageMetadataRemote>,
      recentPackages: [] as any[],
      siteInfo: { stars: 0 } as SiteInfo,
      __packageMetadataRemoteListFetchTime: 0,
      __siteInfoFetchTime: 0,
    }
  },

  actions: {
    /**
     * Fetch package metadata remote list into the store.
     */
    async fetchPackageMetadataRemoteList() {
      const apiBaseUrl = getAPIBaseUrl();
      try {
        const resp = await axios.get(
          urljoin(apiBaseUrl, "/packages/extra"),
          { headers: { Accept: "application/json" } }
        );
        this.__packageMetadataRemoteListFetchTime = new Date().getTime();
        this.packageMetadataRemoteList = mapValues(resp.data, (value: any) => parsePackageMetadataRemote(value));;
      } catch (error) {
        console.error(error);
      }
    },
    /**
     * Fetch package metadata remote list into the store with cache.
     */
    async fetchCachedPackageMetadataRemoteList() {
      const timeElapsed = new Date().getTime() - (this.__packageMetadataRemoteListFetchTime || 0);
      const cacheTime = 5 * 60 * 1000;
      if (timeElapsed > cacheTime) await this.fetchPackageMetadataRemoteList();
    },
    /**
     * Fetch recent packages into the store.
     */
    async fetchRecentPackages() {
      const apiBaseUrl = getAPIBaseUrl();
      try {
        const resp = await axios.get(
          urljoin(apiBaseUrl, "/packages/recent"),
          { headers: { Accept: "application/json" } }
        );
        this.recentPackages = resp.data;
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
        const resp = await axios.get(
          urljoin(apiBaseUrl, "site/info"),
          { headers: { Accept: "application/json" } }
        );
        this.__siteInfoFetchTime = new Date().getTime();
        this.siteInfo = resp.data as SiteInfo;
      } catch (error) {
        console.error(error);
      }
    },
    /**
     * Fetch site info into the store with cache.
     */
    async fetchCachedSiteInfo() {
      const timeElapsed = new Date().getTime() - (this.__siteInfoFetchTime || 0);
      const cacheTime = 5 * 60 * 1000;
      if (timeElapsed > cacheTime) await this.fetchSiteInfo();
    },
  }
});
