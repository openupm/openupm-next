import axios from "axios";
// import createPersistedState from "vuex-persistedstate";
import urljoin from "url-join";
import { createStore } from 'vuex'

import { SortType } from "@/constant";

export const createVuexStore = function ({ openupmApiUrl }) {
  const store = createStore({
    // TOOD: plugins,
    state() {
      return {
        packagesExtra: {} as any,
        recentPackages: [],
        preferHorizontalLayout: false,
        siteInfo: {},
        packageListSort: SortType.updatedAt
      }
    },
    mutations: {
      setPackagesExtra: (state, value) => {
        state.packagesExtra = value;
      },
      setRecentPackages: (state, value) => {
        state.recentPackages = value;
      },
      setSiteInfo: (state, value) => {
        state.siteInfo = value;
      },
      setPreferHorizontalLayout: (state, value) => {
        state.preferHorizontalLayout = value;
      },
      setPackageListSort: (state, value) => {
        state.packageListSort = value;
      }
    },
    getters: {
      packagesExtra: state => state.packagesExtra,
      recentPackages: state => state.recentPackages,
      preferHorizontalLayout: state => state.preferHorizontalLayout,
      siteInfo: state => state.siteInfo,
      packageListSort: state => state.packageListSort
    },
    actions: {
      async fetchPackagesExtra({ commit }) {
        try {
          const resp = await axios.get(
            urljoin(openupmApiUrl, "/packages/extra"),
            { headers: { Accept: "application/json" } }
          );
          resp.data.__time = new Date().getTime();
          commit("setPackagesExtra", resp.data);
        } catch (error) {
          console.error(error);
        }
      },
      fetchPackagesExtraWithCache({ commit, state }) {
        const timeElapsed = new Date().getTime() - (this.getters.packagesExtra.__time || 0);
        const cacheTime = 5 * 60 * 1000;
        if (timeElapsed > cacheTime) this.dispatch("fetchPackagesExtra");
      },
      async fetchRecentPackages({ commit }) {
        try {
          const resp = await axios.get(
            urljoin(openupmApiUrl, "/packages/recent"),
            { headers: { Accept: "application/json" } }
          );
          commit("setRecentPackages", resp.data);
        } catch (error) {
          console.error(error);
        }
      },
      async fetchSiteInfo({ commit }) {
        try {
          const resp = await axios.get(
            urljoin(openupmApiUrl, "site/info"),
            { headers: { Accept: "application/json" } }
          );
          resp.data.__time = new Date().getTime();
          commit("setSiteInfo", resp.data);
        } catch (error) {
          console.error(error);
        }
      },
      fetchSiteInfoWithCache() {
        const timeElapsed = new Date().getTime() - (this.getters.siteInfo.__time || 0);
        const cacheTime = 5 * 60 * 1000;
        if (timeElapsed > cacheTime) this.dispatch("fetchSiteInfo");
      },
      setPreferHorizontalLayout({ commit }, { value }) {
        commit("setPreferHorizontalLayout", value);
      },
      setPackageListSort({ commit }, { value }) {
        commit("setPackageListSort", value);
      }
    },
  });
  return store;
}