import { mapValues } from 'lodash-es';
import axios from "axios";
import urljoin from "url-join";
import { defineStore } from 'pinia'

import { getAPIBaseUrl, getPublicGenPath } from "@shared/urls";
import { PackageMetadataLocal, PackageMetadataRemote, SiteInfo } from "@shared/types";
import { parsePackageMetadataRemote } from '@shared/utils';
import { METADATA_LOCAL_LIST_FILENAME } from '@shared/constant';
import numeral from 'numeral';

export const useDefaultStore = defineStore('pinia-default', {
  persist: __VUEPRESS_SSR__ ? false : true,
  state() {
    return {
      packageMetadataRemoteDict: {} as Record<string, PackageMetadataRemote>,
      packageMetadataLocalList: [] as PackageMetadataLocal[],
      recentPackages: [] as any[],
      siteInfo: { stars: 0 } as SiteInfo,
      __packageMetadataRemoteDictFetchTime: 0,
      __packageMetadataLocalListFetchTime: 0,
      __siteInfoFetchTime: 0,
    }
  },

  getters: {
    isMetadataReady: (state) => {
      return Object.keys(state.packageMetadataRemoteDict).length > 0 && state.packageMetadataLocalList.length > 0;
    },
    readyPackageCount: (state) => {
      let num = 0;
      for (var name in state.packageMetadataRemoteDict) {
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
      return numeral(value).format("1.1a");
    }
  },

  actions: {
    /**
     * Fetch package metadata remote dict into the store.
     */
    async fetchPackageMetadataRemoteDict() {
      const apiBaseUrl = getAPIBaseUrl();
      try {
        const resp = await axios.get(
          urljoin(apiBaseUrl, "/packages/extra"),
          { headers: { Accept: "application/json" } }
        );
        this.__packageMetadataRemoteDictFetchTime = new Date().getTime();
        this.packageMetadataRemoteDict = mapValues(resp.data, (value: any) => parsePackageMetadataRemote(value));;
      } catch (error) {
        console.error(error);
      }
    },
    /**
     * Fetch package metadata remote dict into the store with cache.
     */
    async fetchCachedPackageMetadataRemoteDict() {
      const timeElapsed = new Date().getTime() - (this.__packageMetadataRemoteDictFetchTime || 0);
      const cacheTime = 5 * 60 * 1000;
      if (timeElapsed > cacheTime) await this.fetchPackageMetadataRemoteDict();
    },
    /**
     * Fetch package metadata local list into the store.
    */
    async fetchPackageMetadataLocalList() {
      try {
        const resp = await axios.get(
          getPublicGenPath(METADATA_LOCAL_LIST_FILENAME),
          { headers: { Accept: "application/json" } }
        );
        this.__packageMetadataLocalListFetchTime = new Date().getTime();
        this.packageMetadataLocalList = resp.data as PackageMetadataLocal[];
      } catch (error) {
        console.error(error);
      }
    },
    /**
     * Fetch package metadata local list into the store with cache.
     */
    async fetchCachedPackageMetadataLocalList() {
      const timeElapsed = new Date().getTime() - (this.__packageMetadataLocalListFetchTime || 0);
      const cacheTime = 5 * 60 * 1000;
      if (timeElapsed > cacheTime) await this.fetchPackageMetadataLocalList();
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
