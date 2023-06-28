import { mapValues } from 'lodash-es';
import axios from "axios";
import urljoin from "url-join";
import { defineStore } from 'pinia'

import { SortType } from "@/constant";
import { getAPIBaseUrl } from "@shared/urls";
import { PackageExtraMetadata } from "@shared/types";
import { parsePackageExtraMetadata } from '@shared/utils';

export const useDefaultStore = defineStore('pinia-default', {
  persist: true,
  state() {
    return {
      allPackageExtraMetadata: {} as Record<string, PackageExtraMetadata>,
      __allPackageExtraFetchTime: 0,
      recentPackages: [] as any[],
      preferHorizontalLayout: false,
      siteInfo: {} as any,
      packageListSortType: SortType.updatedAt
    }
  },

  actions: {
    async fetchAllPackageExtraMetadata() {
      const apiBaseUrl = getAPIBaseUrl();
      try {
        const resp = await axios.get(
          urljoin(apiBaseUrl, "/packages/extra"),
          { headers: { Accept: "application/json" } }
        );
        this.__allPackageExtraFetchTime = new Date().getTime();
        this.allPackageExtraMetadata = mapValues(resp.data, (value: any) => parsePackageExtraMetadata(value));;
      } catch (error) {
        console.error(error);
      }
    },
    async fetchAllPackageExtraMetadataWithCache() {
      const timeElapsed = new Date().getTime() - (this.__allPackageExtraFetchTime || 0);
      const cacheTime = 5 * 60 * 1000;
      if (timeElapsed > cacheTime) await this.fetchAllPackageExtraMetadata();
    },
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
    async fetchSiteInfo() {
      const apiBaseUrl = getAPIBaseUrl();
      try {
        const resp = await axios.get(
          urljoin(apiBaseUrl, "site/info"),
          { headers: { Accept: "application/json" } }
        );
        resp.data.__time = new Date().getTime();
        this.siteInfo = resp.data;
      } catch (error) {
        console.error(error);
      }
    },
    async fetchSiteInfoWithCache() {
      const timeElapsed = new Date().getTime() - (this.siteInfo.__time || 0);
      const cacheTime = 5 * 60 * 1000;
      if (timeElapsed > cacheTime) await this.fetchSiteInfo();
    },
    setPreferHorizontalLayout(value: boolean) {
      this.preferHorizontalLayout = value;
    },
    setPackageListSort(value: string) {
      this.packageListSortType = value;
    }
  }
});
