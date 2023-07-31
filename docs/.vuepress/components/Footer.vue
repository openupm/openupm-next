<script setup lang="ts">
import { computed } from 'vue';
import { OpenUPMGitHubRepoUrl, getLocaleDocsPath, getWebBaseUrl, getAPIBaseUrl } from '@shared/urls';
import { useI18n } from 'vue-i18n';
import { getRegion } from '@shared/utils';
import { Region } from '@shared/constant';

const { t } = useI18n();

const isRegionCN = computed(() => {
  return getRegion() === Region.CN;
});

const aboutLinks = computed(() => [
  { link: getLocaleDocsPath("/docs/team"), text: t("team") },
  {
    link: getLocaleDocsPath("/docs/code-of-conduct"),
    text: t("code-of-conduct")
  },
  { link: getLocaleDocsPath("/docs/terms"), text: t("terms-of-use") },
  {
    link: getLocaleDocsPath("/docs/privacy"),
    text: t("privacy-policy")
  },
  {
    link: "https://openupm.github.io/upptime/",
    text: t("status")
  }
]);

const connectLinks = computed(() => {
  return [
    {
      link: OpenUPMGitHubRepoUrl,
      text: t("github"),
      icon: "fab fa-github",
      iconLeft: true
    },
    {
      link: "https://medium.com/openupm",
      text: t("medium"),
      icon: "fab fa-medium",
      iconLeft: true
    },
    {
      link: "https://twitter.com/openupmupdate",
      text: t("twitter"),
      icon: "fab fa-twitter",
      iconLeft: true
    },
    {
      text: t("discord"),
      link: "https://discord.gg/FnUgWEP",
      icon: "fab fa-discord",
      iconLeft: true
    },
    {
      link: "mailto:hello@openupm.com",
      text: t("contact-us"),
      icon: "fas fa-envelope",
      iconLeft: true
    },
    {
      link: `{getAPIBaseUrl()}/feeds/updates/rss`,
      text: t("package-updates"),
      icon: "fa fa-rss-square",
      raw: true,
      iconLeft: true
    }];
});

const description = computed(() => t("site-desc"));

const nismspLink = computed(() => ({
  link: "http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010502045830",
  text: "京公网安备 11010502045830号"
}));

const icpLink = computed(() => ({
  link: "https://beian.miit.gov.cn/#/Integrated/index",
  text: " 京ICP备18005908号-2"
}));

const regionLinks = computed(() => [
  {
    link: "https://openupm.com",
    text: t("region-us")
  },
  {
    link: "https://openupm.cn",
    text: t("region-cn")
  }
]);
</script>

<template>
  <div class="page-footer">
    <div class="page-footer-box">
      <div class="columns">
        <div class="column col-3 col-md-6 col-sm-12">
          <h5>OpenUPM</h5>
          <p>{{ description }}</p>
          <ul>
            <li>{{ $t("footer-copyright") }}</li>
            <template v-if="isRegionCN">
              <li>
                <AutoLink class :item="icpLink" />
              </li>
              <li class="icon-guohui">
                <AutoLink class :item="nismspLink" />
              </li>
            </template>
          </ul>
        </div>
        <div class="column col-4 col-md-6 col-sm-12">
          <div class="columns">
            <div class="column col-4 col-md-4 col-sm-6">
              <h5>{{ $t("about") }}</h5>
              <ul>
                <li v-for="(link, index) in aboutLinks" :key="index">
                  <AutoLink class :item="link" />
                </li>
              </ul>
            </div>
            <div class="column col-4 col-md-4 col-sm-6">
              <h5>{{ $t("connect") }}</h5>
              <ul>
                <li v-for="(link, index) in connectLinks" :key="index">
                  <AutoLink :item="link" />
                </li>
              </ul>
            </div>
            <div class="column col-4 col-md-4 col-sm-6">
              <h5>{{ $t("region") }}</h5>
              <ul>
                <li v-for="(link, index) in regionLinks" :key="index">
                  <AutoLink :item="link" />
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-if="!isRegionCN" class="column col-5 col-md-12 col-sm-12">
          <h5>&nbsp;</h5>
          <div>
            <ul>
              <li class="mb-2">
                <a href="https://m.do.co/c/50e7f9860fa9">
                  <img
                    src="https://opensource.nyc3.cdn.digitaloceanspaces.com/attribution/assets/PoweredByDO/DO_Powered_by_Badge_white.svg"
                    width="180px" />
                </a>
              </li>
              <li class="mb-2">
                <a href="https://www.netlify.com">
                  <img src="https://www.netlify.com/img/global/badges/netlify-dark.svg" alt="Deploys by Netlify" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.page-footer {
  --c-text-footer: #ccc;
  color: var(--c-text-footer);

  a {
    color: var(--c-text-footer);
  }

  .page-footer-box {
    position: absolute;
    left: 0;
    right: 0;
    background-color: $primary-color;
    padding: 1.5rem 0 1.5rem 2rem;

    h5 {
      font-weight: 600;
      margin-bottom: 1rem;
    }

    h5,
    p,
    ul,
    li {
      font-size: 0.7rem;
    }

    ul {
      list-style: none;
      margin: 0 0 0.7rem;

      li {
        margin-top: 0;
      }

      li.icon-guohui {
        background: url('/images/guohui.png') no-repeat left center;
        padding-left: 1.2rem;
      }
    }
  }
}

.dark {
  .page-footer {

    .page-footer-box {
      background-color: var(--c-bg-light);
    }
  }
}
</style>

<i18n locale="en-US" lang="yaml">
  site-desc: OpenUPM is a managed UPM registry that provides automatic build services for open-source Unity packages.
</i18n>

<i18n locale="zh-CN" lang="yaml">
  site-desc: OpenUPM是一个托管的开源UPM包管理器，提供了自动化的构建服务。
</i18n>