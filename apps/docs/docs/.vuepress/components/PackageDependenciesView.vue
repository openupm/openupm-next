<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { getPackageDetailPagePath } from "@openupm/common/build/urls.js";
import { PackageDependency } from '@openupm/types';

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

const dependencyList = computed(() => {
  if (!props.dependencies) return [];
  else
    return props.dependencies.map(({ name, version }: PackageDependency) => {
      const nameWithVersion = `${name}@${version}`;
      const isNuGet = name.startsWith("org.nuget.");
      const isGit = version.startsWith("git");
      const path = getPackageDetailPagePath(name);
      let helpText = null;
      let icon = null;
      // TODO: verify org.nuget.* packages
      if (isNuGet) {
        helpText = t('git-deps-nuget');
        icon = "fa fa-arrow-up";
      } else if (isGit) {
        if (path) {
          helpText = t("git-deps-replaced");
          icon = "fab fa-git text-warning";
        } else {
          helpText = t("git-deps-missing");
          icon = "fab fa-git text-error";
        }
      } else if (path) {
        icon = "fa fa-box-open";
      } else {
        helpText = t("deps-missing");
        icon = "fas fa-exclamation-triangle text-error";
      }
      return {
        icon,
        name,
        nameWithVersion,
        helpText,
        link: path
          ? {
            link: path,
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
          <td class="td-icon"><i :class="entry.icon"></i></td>
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

<i18n locale="en-US" lang="yaml">
  name-at-version: name{'@'}version
  git-deps-nuget: The package may exist in uplinked UnityNuGet registry.
  git-deps-missing: Please install the Git dependency manually.
  git-deps-replaced: The Git dependency can be replaced by a version available on OpenUPM.
  deps-missing: Please install the missing dependency manually.
</i18n>

<i18n locale="zh-CN" lang="yaml">
  name-at-version: 名称{'@'}版本
  git-deps-nuget: NuGet依赖包可能存在于uplink的UnityNuGet仓库中。
  git-deps-missing: Git依赖包，请手动安装。
  git-deps-replaced: Git依赖包可以被替换为一个已在OpenUPM上发布的同名软件包。
  deps-missing: 缺失的依赖包，请手动安装。
</i18n>