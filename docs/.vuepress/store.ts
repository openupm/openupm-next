import axios from "axios";
import urljoin from "url-join";
import { defineStore } from 'pinia'
import { useThemeData } from '@vuepress/plugin-theme-data/client';

import { SortType } from "@/constant";

export const useDefaultStore = defineStore('pinia-default', {
  persist: true,
  state() {
    return {
      packagesExtra: {} as any,
      recentPackages: [] as any[],
      preferHorizontalLayout: false,
      siteInfo: {} as any,
      packageListSort: SortType.updatedAt
    }
  },
  actions: {
    async fetchPackagesExtra() {
      const themeData = useThemeData();
      const openupmApiUrl = themeData.value.openupmApiUrl;
      try {
        const resp = await axios.get(
          urljoin(openupmApiUrl, "/packages/extra"),
          { headers: { Accept: "application/json" } }
        );
        resp.data.__time = new Date().getTime();
        this.packagesExtra = resp.data;
      } catch (error) {
        console.error(error);
      }
    },
    async fetchPackagesExtraWithCache() {
      const timeElapsed = new Date().getTime() - (this.packagesExtra.__time || 0);
      const cacheTime = 5 * 60 * 1000;
      if (timeElapsed > cacheTime) await this.fetchPackagesExtra();
    },
    async fetchRecentPackages() {
      const themeData = useThemeData();
      const openupmApiUrl = themeData.value.openupmApiUrl;
      try {
        const resp = await axios.get(
          urljoin(openupmApiUrl, "/packages/recent"),
          { headers: { Accept: "application/json" } }
        );
        this.recentPackages = resp.data;
      } catch (error) {
        console.error(error);
      }
    },
    async fetchSiteInfo() {
      const themeData = useThemeData();
      const openupmApiUrl = themeData.value.openupmApiUrl;
      try {
        const resp = await axios.get(
          urljoin(openupmApiUrl, "site/info"),
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
    setPreferHorizontalLayout(value) {
      this.preferHorizontalLayout = value;
    },
    setPackageListSort(value) {
      this.packageListSort = value;
    }
  }
});

