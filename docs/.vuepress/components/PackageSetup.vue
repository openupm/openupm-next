<script setup lang="ts">
import { PropType, computed } from 'vue';
import urljoin from "url-join";

import { getRegion } from '@shared/utils';
import { Region } from '@shared/constant';
import { PackageMetadata } from "@shared/types";

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: true,
  },
  hasNotSucceededBuild: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: Object as PropType<PackageMetadata>,
    default: () => { },
  },
  version: {
    type: String,
    default: "",
  },
  scopes: {
    type: Array<string>,
    default: () => [],
  },
});

const installCli = computed(() => {
  const region = getRegion();
  const cli = region == Region.CN ? "openupm-cn" : "openupm";
  return `${cli} add ${props.metadata.name}`;
});

const pipelinesLink = computed(() => {
  return { path: "", query: { subPage: "pipelines" } };
});

const repoTagsNavLink = computed(() => {
  return {
    link: urljoin(props.metadata.repoUrl, "tags"),
    text: urljoin(props.metadata.repoUrl, "tags").replace("https://github.com/", ""),
  };
});
</script>

<template>
  <section v-if="isLoading || version" class="col-12 install-section">
    <div v-if="isLoading">
      <PlaceholderLoader />
    </div>
    <div v-else>
      <div v-if="version">
        <div class="install-option">
          <h3>
            {{ $capitalize($t("install-via-package-manager")) }}
            <div class="package-installer-btn-wrap btn-group btn-group-block">
              <a href="#modal-manualinstallation" class="btn btn-default">{{ $capitalize($t("manual-installation")) }}</a>
            </div>
          </h3>
        </div>
        <PackageSetupViaPackageManager :name="metadata.name" :version="version" :scopes="scopes" />
        <div class="install-option last">
          <h3>
            <a href="#modal-commandlinetool">
              {{ $capitalize($t("install-via-command-line-interface")) }}
            </a>
          </h3>
          <div class="install-cli">
            <CopyWrapper :copy-text="installCli" :display-block="true">
              <code><i class="fas fa-angle-double-right"></i>{{ installCli }}</code>
            </CopyWrapper>
          </div>
        </div>
        <PackageSetupViaCLI :name="metadata.name" />
      </div>
    </div>
  </section>
  <div v-if="!isLoading && !version" class="custom-container warning">
    <div v-if="hasNotSucceededBuild">
      <p class="custom-container-title">{{ $capitalize($t("no-release-title")) }}</p>
      <p>{{ $t("no-release-desc") }}</p>
      <p>
        <RouterLink :to="pipelinesLink" :exact="false">{{ $capitalize($t("learn-more")) }}</RouterLink>
      </p>
    </div>
    <div v-else>
      <p class="custom-container-title">{{ $capitalize($t("no-valid-tag-title")) }}<br /></p>
      <p>{{ $t("no-valid-tag-desc") }}</p>
      <p>{{ $capitalize($t("learn-more")) }}:
        <AutoLink :item="repoTagsNavLink" />
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.install-section {
  padding: 0.5rem !important;
  border: 1px solid var(--c-border);
  border-radius: 3px;
  margin-bottom: 1rem !important;

  h3 {
    margin-bottom: 0.4rem;
    padding-top: 0;
    font-size: $font-size-md;
  }

  p {
    margin-bottom: 0.2rem;
  }

  .install-option {
    margin-bottom: 0.6rem;

    &.last {
      margin-bottom: -0.2rem;
    }

    .btn {
      max-width: 100%;
      text-overflow: ellipsis;
      overflow-x: hidden;
      font-size: $font-size-md;
    }

  }

  .package-installer-btn-wrap {
    margin-top: 0.5rem;
  }
}

.install-cli {
  position: relative;
  margin-bottom: 0.2rem;

  a {
    &:hover {
      text-decoration: none !important;
    }
  }

  code {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    padding: 0.6rem 0.5rem;
    font-size: 0.75rem;
    background-color: transparent;
    border: 1px solid var(--c-border-dark);
    color: var(--c-text-accent);
    cursor: pointer;

    &:hover {
      background-color: var(--c-bg-light);
    }

    &:before {
      color: #bcc3ce;
      content: attr(data-lang);
      font-size: 0.6rem;
      position: absolute;
      right: 0.2rem;
      top: 0.1rem;
    }

    .fa,
    .fas {
      margin-right: 0.4rem;
      position: relative;
      top: 0.07rem;
    }
  }
}
</style>

<i18n locale="en-US" lang="yaml">
  install-via-command-line-interface: install via Command-Line Interface
  install-via-package-manager: install via Package Manager
  no-valid-tag-title: no valid Git tag
  no-valid-tag-desc: OpenUPM only tracks Git tags that adhere to the semver convention. If a valid Git tag is not found, the package will not appear on the package listing.
  no-release-title: no releases published
  no-release-desc: This typically occurs when a repository is first imported. But if all builds have been processed and failed, the package will not appear on the package listing until a successful first release is built.
  manual-installation: manual installation
</i18n>

<i18n locale="zh-CN" lang="yaml">
  install-via-command-line-interface: 安装方式：命令行工具
  install-via-package-manager: 安装方式：包管理器
  no-valid-tag-title: 没有有效的Git标签
  no-valid-tag-desc: OpenUPM仅跟踪遵循semver约定的Git标签。如果未检测到有效的Git标签，则该软件包将不会列在软件包列表中。
  no-release-title: 没有版本发布
  no-release-desc: 这通常发生在首次导入软件仓库时。但是，如果所有构建都已处理并失败，则在构建成功的第一个版本发布之前，该软件包将不会出现在软件包列表中。
  manual-installation: 手动安装
</i18n>