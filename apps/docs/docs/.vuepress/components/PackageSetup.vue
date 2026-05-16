<script setup lang="ts">
import { PropType, computed, ref, watch } from 'vue';
import urlJoin from "url-join";

import { PackageMetadata, Packument } from "@openupm/types";
import { getInstallCliCommand, getInstallTargets, InstallTargetKind } from './package-install-targets';

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
  packument: {
    type: Object as PropType<Partial<Packument>>,
    default: () => { },
  },
  scopes: {
    type: Array<string>,
    default: () => [],
  },
});

const selectedInstallKind = ref<InstallTargetKind | null>(null);

const installTargets = computed(() => {
  return getInstallTargets(props.packument);
});

watch(installTargets, (targets) => {
  selectedInstallKind.value = targets[0]?.kind || null;
}, { immediate: true });

const selectedInstallTarget = computed(() => {
  return installTargets.value.find((target) => target.kind === selectedInstallKind.value) || installTargets.value[0] || null;
});

const hasInstallTargetSelector = computed(() => {
  return installTargets.value.length > 1;
});

const selectedPackageManagerVersion = computed(() => {
  return selectedInstallTarget.value?.version || props.version;
});

const explicitCliVersion = computed(() => {
  return hasInstallTargetSelector.value ? selectedPackageManagerVersion.value : "";
});

const installCli = computed(() => {
  return getInstallCliCommand(props.metadata.name, explicitCliVersion.value);
});

const pipelinesLink = computed(() => {
  return { path: "", query: { subPage: "pipelines" } };
});

const repoTagsNavLink = computed(() => {
  return {
    link: urlJoin(props.metadata.repoUrl, "tags"),
    text: urlJoin(props.metadata.repoUrl, "tags").replace("https://github.com/", ""),
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
        <div v-if="hasInstallTargetSelector" class="install-version-selector btn-group btn-group-block">
          <button v-for="target in installTargets" :key="target.kind" type="button" class="btn btn-sm"
            :class="{ active: selectedInstallTarget?.kind === target.kind }" @click="selectedInstallKind = target.kind">
            <span class="install-version-label">{{ $capitalize($t(target.kind)) }}</span>
            <span class="install-version-number">{{ target.version }}</span>
          </button>
        </div>
        <div class="install-option">
          <h3>
            {{ $capitalize($t("install-via-package-manager")) }}
            <div class="package-installer-btn-wrap btn-group btn-group-block">
              <a href="#modal-manualinstallation" class="btn btn-default">{{ $capitalize($t("manual-installation")) }}</a>
            </div>
          </h3>
        </div>
        <PackageSetupViaPackageManager :name="metadata.name" :version="selectedPackageManagerVersion" :scopes="scopes" />
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
        <PackageSetupViaCLI :name="metadata.name" :version="explicitCliVersion" />
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

  .install-version-selector {
    margin-bottom: 0.75rem;

    .btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      height: auto;
      line-height: 1.15;
      min-height: 2.4rem;
      padding: 0.25rem 0.3rem;
      white-space: normal;
    }

    .install-version-label,
    .install-version-number {
      display: block;
      max-width: 100%;
      overflow-wrap: anywhere;
    }

    .install-version-number {
      font-size: 0.65rem;
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
