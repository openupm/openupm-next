<script setup lang="ts">
import { computed } from "vue";
import { usePageFrontmatter } from "@vuepress/client";

import ParentLayout from "@/layouts/WideLayout.vue";
import {
  getContributorDiscoveredPackages,
  getContributorOwnedPackages,
  getContributorProfileStats,
  toContributorProfilePackageEntry,
} from "@/components/contributor-profile";
import { useDefaultStore } from "@/store";
import {
  getAvatarImageUrl,
} from "@openupm/common/build/urls.js";
import { PackageMetadataLocal } from "@openupm/types";

type ContributorProfileFrontmatter = {
  contributorProfile?: {
    githubUser: string;
    ownedCount: number;
    discoveredCount: number;
    totalSubmittedCount: number;
    profileUrl?: string;
    profileHost?: string;
  };
};

const frontmatter = usePageFrontmatter<ContributorProfileFrontmatter>();
const store = useDefaultStore();

const githubUser = computed(() => {
  return frontmatter.value.contributorProfile?.githubUser || "";
});

const githubUrl = computed(() => {
  return (
    frontmatter.value.contributorProfile?.profileUrl ||
    `https://github.com/${githubUser.value}`
  );
});

const contributorsLink = {
  text: "Contributors",
  link: "/contributors/",
};

const isGitHubProfileHost = function (profileHost: string): boolean {
  const hostname = profileHost.toLowerCase();
  return hostname === "github.com" || hostname.endsWith(".github.com");
};

const githubLink = computed(() => {
  const profileHost = frontmatter.value.contributorProfile?.profileHost || "github.com";
  const text = isGitHubProfileHost(profileHost)
    ? "GitHub profile"
    : `${profileHost} profile`;
  return {
    text,
    link: githubUrl.value,
  };
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

const ownedPackages = computed(() => {
  return getContributorOwnedPackages(
    metadataLocalList.value,
    githubUser.value,
  ).map(toContributorProfilePackageEntry);
});

const discoveredPackages = computed(() => {
  return getContributorDiscoveredPackages(
    metadataLocalList.value,
    githubUser.value,
  ).map(toContributorProfilePackageEntry);
});

const isLoading = computed(() => {
  return !metadataLocalList.value.length;
});
</script>

<template>
  <ParentLayout class="contributor-profile">
    <template #page-content-top>
      <ClientOnly>
        <main class="profile-content">
          <nav aria-label="Breadcrumb">
            <ul class="breadcrumb profile-breadcrumb">
              <li class="breadcrumb-item">
                <AutoLink :item="contributorsLink" />
              </li>
              <li class="breadcrumb-item">
                <a href="#">{{ githubUser }}</a>
              </li>
            </ul>
          </nav>
          <header class="profile-header">
            <LazyImage :src="avatarUrl" :alt="githubUser" class="avatar avatar-xl" />
            <div class="profile-header-text">
              <h1>{{ githubUser }}</h1>
              <div class="profile-stats">
                <span>{{ stats.ownedCount }} owned</span>
                <span>{{ stats.discoveredCount }} discovered</span>
              </div>
              <div class="profile-actions">
                <AutoLink class="nav-link external github-link" :item="githubLink" />
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
              <div v-else class="package-table-wrapper">
                <table class="table package-table">
                  <thead>
                    <tr>
                      <th>Display name</th>
                      <th class="package-name-column">Package name</th>
                      <th class="submitted-column">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="metadata in ownedPackages" :key="metadata.name">
                      <td>
                        <RouterLink :to="metadata.path">{{ metadata.displayName }}</RouterLink>
                        <code class="mobile-package-name">{{ metadata.name }}</code>
                      </td>
                      <td class="package-name-column">
                        <code>{{ metadata.name }}</code>
                      </td>
                      <td class="submitted-column">{{ metadata.createdAtText }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="discovered" class="package-section">
              <h2>Discovered packages</h2>
              <div v-if="!discoveredPackages.length" class="empty-state">
                No discovered packages.
              </div>
              <div v-else class="package-table-wrapper">
                <table class="table package-table">
                  <thead>
                    <tr>
                      <th>Display name</th>
                      <th class="package-name-column">Package name</th>
                      <th class="submitted-column">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="metadata in discoveredPackages" :key="metadata.name">
                      <td>
                        <RouterLink :to="metadata.path">{{ metadata.displayName }}</RouterLink>
                        <code class="mobile-package-name">{{ metadata.name }}</code>
                      </td>
                      <td class="package-name-column">
                        <code>{{ metadata.name }}</code>
                      </td>
                      <td class="submitted-column">{{ metadata.createdAtText }}</td>
                    </tr>
                  </tbody>
                </table>
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
    padding: 0;
  }
}

.profile-breadcrumb {
  margin-bottom: 0.8rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;

  h1 {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.1;
  }

  @media (max-width: $MQMobileNarrow) {
    align-items: flex-start;
  }
}

.profile-header-text {
  min-width: 0;
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
  margin-top: 0.35rem;
}

.package-section {
  margin-top: 1rem;

  h2 {
    margin: 0;
    font-size: 1.3rem;
  }
}

.package-table-wrapper {
  overflow-x: auto;
}

.package-table {
  width: 100%;

  code {
    white-space: normal;
    overflow-wrap: anywhere;
  }
}

.mobile-package-name {
  display: none;
  margin-top: 0.15rem;
}

.package-name-column {
  @media (max-width: $MQMobileNarrow) {
    display: none;
  }
}

.submitted-column {
  width: 7.5rem;
  white-space: nowrap;

  @media (max-width: $MQMobileNarrow) {
    width: 6.2rem;
  }
}

@media (max-width: $MQMobileNarrow) {
  .mobile-package-name {
    display: block;
  }
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
