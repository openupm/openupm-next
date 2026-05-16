<script setup lang="ts">
import { computed } from "vue";
import { usePageFrontmatter } from "@vuepress/client";

import ParentLayout from "@/layouts/WideLayout.vue";
import {
  getContributorDiscoveredPackages,
  getContributorOwnedPackages,
  getContributorProfileStats,
  toPackageMetadata,
} from "@/components/contributor-profile";
import { useDefaultStore } from "@/store";
import {
  getAvatarImageUrl,
  getContributorProfilePagePath,
} from "@openupm/common/build/urls.js";
import {
  PackageMetadata,
  PackageMetadataLocal,
  PackageMetadataRemote,
} from "@openupm/types";

type ContributorProfileFrontmatter = {
  contributorProfile?: {
    githubUser: string;
    ownedCount: number;
    discoveredCount: number;
    totalSubmittedCount: number;
  };
};

const frontmatter = usePageFrontmatter<ContributorProfileFrontmatter>();
const store = useDefaultStore();

const githubUser = computed(() => {
  return frontmatter.value.contributorProfile?.githubUser || "";
});

const githubUrl = computed(() => {
  return `https://github.com/${githubUser.value}`;
});

const profilePath = computed(() => {
  return getContributorProfilePagePath(githubUser.value);
});

const avatarUrl = computed(() => {
  return githubUser.value ? getAvatarImageUrl(githubUser.value, 128) : "";
});

const metadataLocalList = computed(() => {
  return store.packageMetadataLocalList as PackageMetadataLocal[];
});

const stats = computed(() => {
  if (metadataLocalList.value.length) {
    return getContributorProfileStats(metadataLocalList.value, githubUser.value);
  }
  return (
    frontmatter.value.contributorProfile || {
      ownedCount: 0,
      discoveredCount: 0,
      totalSubmittedCount: 0,
    }
  );
});

const mapMetadata = (metadataLocal: PackageMetadataLocal): PackageMetadata => {
  const metadataRemote = store.packageMetadataRemoteDict[
    metadataLocal.name
  ] as PackageMetadataRemote | undefined;
  return toPackageMetadata(metadataLocal, metadataRemote);
};

const ownedPackages = computed(() => {
  return getContributorOwnedPackages(
    metadataLocalList.value,
    githubUser.value,
  ).map(mapMetadata);
});

const discoveredPackages = computed(() => {
  return getContributorDiscoveredPackages(
    metadataLocalList.value,
    githubUser.value,
  ).map(mapMetadata);
});

const isLoading = computed(() => {
  return !metadataLocalList.value.length;
});
</script>

<template>
  <ParentLayout class="contributor-profile">
    <template #sidebar-top>
      <ClientOnly>
        <section class="state-section">
          <ul class="menu">
            <li class="menu-item">
              Submitted
              <div class="menu-badge">
                <label class="label label-default">{{ stats.totalSubmittedCount }}</label>
              </div>
            </li>
            <li class="menu-item">
              Owned
              <div class="menu-badge">
                <a href="#owned" class="label label-default">{{ stats.ownedCount }}</a>
              </div>
            </li>
            <li class="menu-item">
              Discovered
              <div class="menu-badge">
                <a href="#discovered" class="label label-default">{{ stats.discoveredCount }}</a>
              </div>
            </li>
          </ul>
        </section>
      </ClientOnly>
    </template>

    <template #page-content-top>
      <ClientOnly>
        <main class="profile-content">
          <header class="profile-header">
            <LazyImage :src="avatarUrl" :alt="githubUser" class="avatar avatar-xl" />
            <div class="profile-header-text">
              <a class="profile-back" href="/contributors/">Contributors</a>
              <h1>{{ githubUser }}</h1>
              <div class="profile-stats">
                <span>{{ stats.ownedCount }} owned</span>
                <span>{{ stats.discoveredCount }} discovered</span>
                <span>{{ stats.totalSubmittedCount }} submitted</span>
              </div>
              <div class="profile-actions">
                <a class="btn btn-primary" :href="profilePath">OpenUPM profile</a>
                <a class="btn btn-link nav-link external" :href="githubUrl">GitHub</a>
              </div>
            </div>
          </header>

          <div v-if="isLoading" class="placeholder-loader-wrapper">
            <PlaceholderLoader />
          </div>
          <template v-else>
            <section id="owned" class="package-section">
              <h2>Owned packages</h2>
              <div v-if="!ownedPackages.length" class="empty-state">
                No owned packages.
              </div>
              <div v-else class="package-grid">
                <PackageCard v-for="metadata in ownedPackages" :key="metadata.name" :metadata="metadata" />
              </div>
            </section>

            <section id="discovered" class="package-section">
              <h2>Discovered packages</h2>
              <div v-if="!discoveredPackages.length" class="empty-state">
                No discovered packages.
              </div>
              <div v-else class="package-grid">
                <PackageCard v-for="metadata in discoveredPackages" :key="metadata.name" :metadata="metadata" />
              </div>
            </section>
          </template>
        </main>
      </ClientOnly>
    </template>
  </ParentLayout>
</template>

<style lang="scss" scoped>
@use "@/styles/palette" as *;

.profile-content {
  max-width: $package-grid-4c-width;
  margin: $navbar-height auto 3rem;
  padding: 1rem;

  @media (max-width: $MQMobileNarrow) {
    margin-top: $navbar-height-mobile;
    padding: 0.75rem 0.5rem;
  }
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 0 1.2rem;
  border-bottom: 1px solid var(--c-border);

  h1 {
    margin: 0;
    font-size: 2rem;
    line-height: 1.1;
  }

  @media (max-width: $MQMobileNarrow) {
    align-items: flex-start;

    h1 {
      font-size: 1.5rem;
    }
  }
}

.profile-header-text {
  min-width: 0;
}

.profile-back {
  display: inline-block;
  margin-bottom: 0.2rem;
  font-size: $font-size-sm;
}

.profile-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
  margin-top: 0.35rem;
  color: var(--c-text-light);
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.8rem;
}

.package-section {
  margin-top: 1.4rem;

  h2 {
    margin: 0 0 0.7rem;
    font-size: 1.3rem;
  }
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax($package-grid-column-width, 1fr));
  gap: $package-grid-column-hgap;
}

.empty-state {
  color: var(--c-text-light);
  padding: 0.6rem 0;
}

.placeholder-loader-wrapper {
  max-width: 25rem;
  margin-top: 1rem;
}
</style>
