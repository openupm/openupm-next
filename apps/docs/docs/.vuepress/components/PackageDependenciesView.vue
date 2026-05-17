<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { getPackageDetailPagePath } from "@openupm/common/build/urls.js";
import { PackageDependency } from '@openupm/types';
import { isPackageExist } from '@/utils';

const { t } = useI18n();

const props = defineProps({
  dependencies: {
    type: Array<PackageDependency>,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: true
  }
});

const getUnityPackageDocumentationVersion = (version: string): string => {
  const match = /^(\d+\.\d+)(?:\.|$)/.exec(version);
  return match ? match[1] : version;
};

const getUnityPackageDocumentationUrl = (name: string, version: string): string => {
  if (name.startsWith("com.unity.modules.")) {
    return `https://docs.unity3d.com/Manual/${name}.html`;
  }
  const documentationVersion = getUnityPackageDocumentationVersion(version);
  return `https://docs.unity3d.com/Packages/${name}@${encodeURIComponent(documentationVersion)}/`;
};

const dependencyList = computed(() => {
  if (!props.dependencies) return [];
  else
    return props.dependencies.map(({ name, version }: PackageDependency) => {
      const nameWithVersion = `${name}@${version}`;
      const isNuGet = name.startsWith("org.nuget.");
      const isUnityPackage = name.startsWith("com.unity.");
      const isGit = version.startsWith("git");
      const openUpmPackageExists = isPackageExist(name);
      const openUpmPath = isNuGet || openUpmPackageExists
        ? getPackageDetailPagePath(name)
        : null;
      const unityDocumentationUrl = !openUpmPath && isUnityPackage
        ? getUnityPackageDocumentationUrl(name, version)
        : null;
      let helpText = null;
      let icon = null;
      let iconTooltip = null;
      // TODO: verify org.nuget.* packages
      if (isNuGet) {
        helpText = t('git-deps-nuget');
        icon = "fa fa-arrow-up";
        iconTooltip = "UnityNuGet uplink dependency";
      } else if (isGit) {
        if (openUpmPath) {
          helpText = t("git-deps-replaced");
          icon = "fab fa-git text-warning";
          iconTooltip = "Git dependency with package page";
        } else {
          helpText = t("git-deps-missing");
          icon = "fab fa-git text-error";
          iconTooltip = "Git dependency without package page";
        }
      } else if (openUpmPath) {
        icon = "fa fa-box-open";
        iconTooltip = "OpenUPM package dependency";
      } else if (unityDocumentationUrl) {
        icon = "fab fa-unity";
        iconTooltip = "Unity package documentation";
        helpText = t("unity-deps-documentation");
      } else {
        helpText = t("deps-missing");
        icon = "fas fa-exclamation-triangle text-error";
        iconTooltip = "Missing package dependency";
      }
      return {
        icon,
        iconTooltip,
        name,
        nameWithVersion,
        helpText,
        link: openUpmPath
          ? {
            link: openUpmPath,
            text: nameWithVersion
          }
          : unityDocumentationUrl
            ? {
            link: unityDocumentationUrl,
            text: nameWithVersion
          }
          : null,
        version
      };
    });
});
</script>

<template>
  <div v-if="isLoading">
    <PlaceholderLoader />
  </div>
  <div v-else class="subpage-deps">
    <h2>
      {{ $capitalize($t("dependencies")) }}
      <sup>{{ dependencyList.length }}</sup>
    </h2>
    <table v-if="dependencyList.length" class="table">
      <thead>
        <tr>
          <th class="td-icon"></th>
          <th class="td-name">{{ $capitalize($t("name-at-version")) }}</th>
          <th class="td-note">{{ $capitalize($t("note")) }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in dependencyList" :key="entry.name">
          <td class="td-icon">
            <i :class="[entry.icon, 'tooltip', 'tooltip-up']" :data-tooltip="entry.iconTooltip"></i>
          </td>
          <td class="td-name">
            <AutoLink v-if="entry.link" :item="entry.link" class="dep-text" />
            <span v-else>{{ entry.nameWithVersion }}</span>
          </td>
          <td class="td-note">
            <div class="inner">{{ entry.helpText }}</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.subpage-deps {
  .table {
    .td-icon {
      width: 1rem;
    }

    .td-name {
      word-break: break-all;
    }

    .td-note {
      .inner {
        max-width: 18rem;
      }
    }
  }
}
</style>
