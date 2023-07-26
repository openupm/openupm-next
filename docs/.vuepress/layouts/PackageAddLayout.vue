<script setup lang="ts">
import axios from "axios";
import Joi from "joi";
import querystring from "query-string";
import urljoin from "url-join";
import yaml from "js-yaml";

import { capitalize, cloneDeep } from "lodash-es";
import { computed, watch, onMounted, ref, reactive } from "vue";
import { useI18n } from 'vue-i18n'
import VueScrollTo from "vue-scrollto";

import ParentLayout from "@/layouts/WideLayout.vue";
import AutoLink from "@/components/AutoLink.vue";
import PackageCard from "@/components/PackageCard.vue";
import PlaceholderLoader from '@/components/PlaceholderLoader.vue';
import { useDefaultStore } from '@/store';
import { License, Topic } from "@shared/types";
import { getGitHubRawFileUrl, getPublicGenPath, getUnityRegistryUrl } from "@shared/urls";
import { isPackageBlockedByScope, isPackageRequiresManualVerification, validPackageName } from "@shared/utils";
import { topicsWithAll } from '@temp/topics.js';
import { BLOCKED_SCOPES_FILENAME, SDPXLIST_FILENAME } from "@shared/constant";

const store = useDefaultStore();
const { t } = useI18n();

const PackageFormSchema = Joi.object({
  repo: Joi.string().required().default(""),
  branch: Joi.string().required().default(""),
  packageJson: Joi.string().required().default(""),
  readme: Joi.string().allow("").default(""),
  licenseId: Joi.string().allow("").default(""),
  licenseName: Joi.string().required().default(""),
  hunter: Joi.string().required().default(""),
  gitTagPrefix: Joi.string().allow("").default(""),
  gitTagIgnore: Joi.string().allow("").default(""),
  minVersion: Joi.string().allow("").default(""),
  topics: Joi.array().min(1).required().default([]),
  image: Joi.string().allow("").default(""),
});

const initState = function () {
  const obj = {
    form: {
      errors: {},
      values: {},
      prompts: {},
      options: {
        topics: topicsWithAll.slice(1, topicsWithAll.length - 1).map((x: Topic) => ({
          slug: x.slug,
          name: x.name,
          value: false,
        })),
      },
    },
    isSubmitting: false,
    hideMetaFields: true,
    repoInfo: {},
    packageJsonPaths: {},
    packageJsonObj: {} as any,
    readmePaths: {},
    branches: [] as string[],
  } as any;
  resetForm(obj.form);
  return obj;
};

/**
 * Reset form data to default values.
 * @param form form data
 * @param skipFields fields to skip
 */
const resetForm = (form: any, skipFields?: string[]) => {
  // Reset values, errors and prompts.
  // PackageFormSchema.describe() is not available in browser environment, so we have to use $_terms.
  for (const schemaKey of PackageFormSchema.$_terms.keys) {
    if (skipFields && skipFields.includes(schemaKey.key)) continue;
    if (schemaKey.schema.type === "array") {
      form.values[schemaKey.key] = cloneDeep(schemaKey.schema._flags.default);
    } else {
      form.values[schemaKey.key] = schemaKey.schema._flags.default;
    }
    form.errors[schemaKey.key] = "";
    form.prompts[schemaKey.key] = "";
  }
  // Reset form.options
  for (const topic of form.options.topics) topic.value = false;
};

/**
 * Reset form errors.
 */
const resetFormErrors = (skipFields?: string[]) => {
  const errors = state.form.errors;
  Object.keys(errors).forEach((key) => {
    if (skipFields && skipFields.includes(key)) return;
    errors[key] = "";
  });
};

const state = reactive(initState());

const blockedScopes = ref([] as string[]);
const isLoadingBlockedScopes = ref(true);

const licenses = ref([] as License[]);
const isLoadingLicenses = ref(true);

const existedPackageNames = computed(() => {
  return store.packageMetadataLocalList.map((x) => x.name);
});

const uploadLink = computed(() => {
  const qs = querystring.stringify({
    filename: state.packageJsonObj.name + ".yaml",
    value: genYaml(),
    message: `chore(data): new package ${state.packageJsonObj.name}`,
  });
  return {
    link: "https://github.com/openupm/openupm/new/master/data/packages/?" + qs,
    text: capitalize(t("submit-metadata")),
  };
});

const fetchRepoInfo = async () => {
  try {
    // Clean error message.
    resetFormErrors();
    // Fetch.
    const resp = await axios.get(
      urljoin("https://api.github.com/repos/", state.form.values.repo),
      {
        headers: { Accept: "application/vnd.github.v3.json" },
      }
    );
    // Show all fields.
    state.hideMetaFields = false;
    // Assign data.
    const repoInfo = resp.data;
    state.repoInfo = repoInfo;
    if (
      repoInfo.license &&
      repoInfo.license.spdx_id != "NOASSERTION" &&
      repoInfo.license.key != "other"
    ) {
      state.form.values.licenseId = repoInfo.license.spdx_id;
      state.form.values.licenseName = repoInfo.license.name;
    }
  } catch (error) {
    const errorObj = error as Error;
    if (errorObj.message.includes("404"))
      state.form.errors.repo = "Repository not found";
    else state.form.errors.repo = errorObj.message;
  } finally {
    state.isSubmitting = false;
  }
};

const fetchBranches = async () => {
  state.branches = [];
  try {
    // Clean error message.
    state.form.errors.branch = "";
    let url =
      urljoin("https://api.github.com/repos/", state.form.values.repo, "branches") +
      "?per_page=100";
    // Traversing with pagination
    while (true) {
      let resp = await axios.get(url, {
        headers: { Accept: "application/vnd.github.v3.json" },
      });
      const branches = resp.data
        .map((x: any) => x.name)
        .filter((x: string) => !x.startsWith("all-contributors/"));
      for (const item of branches) state.branches.push(item);
      // parse next url from resp.headers.link, refs https://docs.github.com/en/rest/guides/traversing-with-pagination
      let nextUrl = null;
      if (resp.headers.link) {
        const links = resp.headers.link.split(",");
        for (let link of links) {
          link = link.trim();
          const re = /<(https.*)>; rel=\"next\"/g;
          const match = re.exec(link);
          if (match) nextUrl = match[1];
        }
      }
      if (nextUrl) url = nextUrl;
      else break;
    }
    // Assign the default branch
    if (state.branches.includes("master")) {
      state.form.values.branch = "master";
      onBranchChange();
    } else if (state.branches.includes("main")) {
      state.form.values.branch = "main";
      onBranchChange();
    }
  } catch (error) {
    state.form.errors.branch = (error as Error).message;
  }
};

const fetchGitTrees = async () => {
  if (!state.form.values.branch) return;
  try {
    // Clean error message.
    state.form.errors.packageJson = "";
    state.form.errors.readme = "";
    // Fetch.
    const url = urljoin(
      "https://api.github.com/repos/",
      state.form.values.repo,
      "git/trees",
      state.form.values.branch
    );
    state.form.prompts.packageJson = t("loading-package-json-path");
    state.form.prompts.readme = t("loading-readme-md-path");
    const resp = await axios.get(url, {
      params: { recursive: 1 },
      headers: { Accept: "application/vnd.github.v3.json" },
    });
    // Assign data to packageJson
    const paths = resp.data.tree
      .map((x: any) => x.path)
      .filter((x: string) => x.endsWith("package.json"));
    state.packageJsonPaths = paths;
    state.form.values.packageJson = null;
    if (paths.length == 0) {
      state.form.prompts.packageJson = "";
      state.form.errors.packageJson = t("can-not-locate-the-path-of-pac");
    } else if (paths.length == 1) {
      state.form.values.packageJson = paths[0];
    } else if (paths.includes("package.json")) {
      state.form.values.packageJson = "package.json";
    }
    if (state.form.values.packageJson) {
      onPackageJsonPathChange();
    }
    // Assign data to readme
    const markdownRe = /.(md|markdown)$/i;
    const readmePaths = resp.data.tree
      .map((x: any) => x.path)
      .filter((x: string) => markdownRe.test(x));
    state.readmePaths = readmePaths;
    if (readmePaths.length == 0) {
      state.form.prompts.readme = "";
      state.form.errors.readme = t("no-markdown-file-found-fallbacks");
    } else if (readmePaths.length == 1) {
      state.form.values.readme = readmePaths[0];
    } else if (readmePaths.includes("README.md")) {
      state.form.values.readme = "README.md";
    } else {
      const filteredPath = readmePaths.filter((x: any) => x.endsWith("README.md"));
      if (filteredPath.length > 0) {
        state.form.values.readme = filteredPath[0];
      }
    }
  } catch (error) {
    state.form.errors.packageJson = (error as Error).message;
  }
};

const fetchPackageJson = async () => {
  try {
    // Clean error message.
    state.form.errors.packageJson = "";
    // Fetch.
    let url = urljoin(
      "https://api.github.com/repos/",
      state.form.values.repo,
      "contents",
      state.form.values.packageJson,
      "?ref=" + state.form.values.branch
    );
    let resp = await axios.get(url, {
      headers: { Accept: "application/vnd.github.v3.json" },
    });
    // Assign data.
    let content = atob(resp.data.content);
    state.packageJsonObj = JSON.parse(content);
    let packageName = state.packageJsonObj.name;
    // Verify private
    if (state.packageJsonObj.private)
      throw new Error(t("private-repository-error"));
    // Verify blocked scopes
    for (const scope of blockedScopes.value) {
      if (isPackageBlockedByScope(packageName, scope))
        throw new Error(t("package-name-blocked", { scope }));
    }
    // Verify package existence
    if (existedPackageNames.value.includes(packageName))
      throw new Error(t("package-name-already-exists-error"));
    // Verify package naming
    validPackageName(packageName);
    // License
    if (state.packageJsonObj.license && !state.form.values.licenseName) {
      state.form.values.licenseName = state.packageJsonObj.license;
    }
    // Verify unity registry
    // Unity registry didn't enable the cross origin requests, then the check cannot be done in a browser.
    // await verifyPackageExistInUnityRegistry(packageName);
  } catch (error) {
    const errorObj = error as Error;
    if (errorObj.message.includes("404"))
      state.form.errors.packageJson = t("package-json-not-found-error");
    else state.form.errors.packageJson = errorObj.message;
  }
};

const fetchBlockedScopes = async () => {
  try {
    isLoadingBlockedScopes.value = true;
    const resp = await axios.get(
      getPublicGenPath(BLOCKED_SCOPES_FILENAME),
      { headers: { Accept: "application/json" } }
    );
    blockedScopes.value = resp.data as string[];
  } catch (error) {
    console.error(error);
  } finally {
    isLoadingBlockedScopes.value = false;
  }
}

const fetchLicenses = async () => {
  try {
    isLoadingLicenses.value = true;
    const resp = await axios.get(
      getPublicGenPath(SDPXLIST_FILENAME),
      { headers: { Accept: "application/json" } }
    );
    licenses.value = resp.data as License[];
  } catch (error) {
    console.error(error);
  } finally {
    isLoadingLicenses.value = false;
  }
}

const verifyPackageExistInUnityRegistry = async (packageName: string) => {
  try {
    let url = urljoin(getUnityRegistryUrl(), packageName);
    let resp = await axios.get(url);
    throw new Error(t("package-already-exists-in-unity-registry"));
  } catch (error) { }
};

/**
 * Verify package form.
 * @returns true if the form is clean.
 */
const verifyPackage = () => {
  // Verify form except a few already verified fields.
  resetFormErrors(["repo", "branch", "readme", "packageJson"]);
  const result = PackageFormSchema.validate(state.form.values, {
    abortEarly: false,
  });
  // Fill error messages.
  if (result.error) {
    result.error.details.forEach((error) => {
      state.form.errors[error.path[0]] = error.message;
    });
  }
  // Scroll to the first error field.
  for (const field in state.form.errors) {
    if (state.form.errors[field]) {
      VueScrollTo.scrollTo("#id_" + field, 500, { offset: -80 });
      return false;
    }
  }
  // Guess license id.
  guessLicenseId();
  return true;
};

/**
 * Whether the form has error.
 * @returns true if the form has error.
 */
const hasFormError = computed(() => {
  return Object.values(state.form.errors).some((x) => x);
});

/**
 * Try to fill license id field if license name is provided.
 */
const guessLicenseId = () => {
  if (state.form.values.licenseName.value) {
    const items = licenses.value.filter((x) =>
      x.name.toLowerCase() == state.form.values.licenseName.toLowerCase() ||
      x.id.toLowerCase() == state.form.values.licenseName.toLowerCase()
    );
    if (items) {
      const item = items[0];
      state.form.values.licenseId = item.id;
      state.form.values.licenseName.value = item.name;
    }
  }
};

const onRepoChange = () => {
  // Cleanify repo
  let repo = state.form.values.repo;
  state.form.values.repo = repo
    .replace(/^\//i, "")
    .replace(/https:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/$/i, "");
  state.hideMetaFields = true;
};

const onBranchChange = () => {
  fetchGitTrees();
};

const onPackageJsonPathChange = () => {
  if (state.form.values.packageJson) {
    fetchPackageJson();
  }
};

const onAnalyzeRepo = () => {
  let repo = state.form.values.repo;
  if (repo) {
    resetForm(state.form, ["repo"]);
    state.isSubmitting = true;
    state.hideMetaFields = true;
    state.repoInfo = {};
    state.packageJsonPaths = {};
    state.packageJsonObj = {};
    state.readmePaths = {};
    state.branches = [];
    fetchRepoInfo();
    fetchBranches();
  }
};

const onTopicsChange = () => {
  const form = state.form;
  form.values.topics = form.options.topics
    .filter((x: any) => x.value)
    .map((x: any) => x.slug);
};

const onUpload = (event: Event) => {
  verifyPackage();
  // Prevent the link from opening if the form is not clean.
  if (hasFormError.value) event.preventDefault();
  // Return undefined to allow the link to continue.
};

const genYaml = () => {
  const form = state.form;
  const repoInfo = state.repoInfo;
  const packageJsonObj = state.packageJsonObj;
  const content = {
    name: packageJsonObj.name,
    displayName: packageJsonObj.displayName,
    description: packageJsonObj.description || repoInfo.description || "",
    repoUrl: repoInfo.html_url,
    parentRepoUrl: repoInfo.parent ? repoInfo.parent.html_url : null,
    licenseSpdxId: form.values.licenseId,
    licenseName: form.values.licenseName,
    topics: form.values.topics,
    hunter: form.values.hunter,
    gitTagPrefix: form.values.gitTagPrefix,
    gitTagIgnore: form.values.gitTagIgnore,
    minVersion: form.values.minVersion,
    readme: form.values.readme
      ? form.values.branch + ":" + form.values.readme
      : "master:README.md",
    createdAt: new Date().getTime(),
  };
  return yaml.dump(content);
};

const extraPackageNameWarning = () => {
  let pkgName = (state.packageJsonObj.name || "").toLowerCase();
  if (pkgName) {
    if (isPackageRequiresManualVerification(pkgName))
      return t("package-name-manual-verification");
  }
};

const isLoading = computed(() => {
  return isLoadingBlockedScopes.value || isLoadingLicenses.value;
});

// Hooks
onMounted(() => {
  // Fetch blocked scopes.
  fetchBlockedScopes();
  // Fetch licenses.
  fetchLicenses();
});
</script>

<template>
  <ParentLayout class="package-add">
    <template #page-content-bottom>
      <div v-if="isLoading">
        <div class="placeholder-loader-wrapper">
          <PlaceholderLoader />
        </div>
      </div>
      <form v-else novalidate @submit.prevent>
        <!-- A dummy button is needed here to capture any input field that triggers a keyboard "Enter" key pressed event. But why... -->
        <button class="hide" @click.prevent></button>
        <div class="columns">
          <div class="column col-6 col-sm-12 mb-1">
            <div id="id_repo" class="form-group pl-0 pr-0" :class="{ 'has-error': state.form.errors.repo }">
              <label class="form-label required">{{ $capitalize($t("repository")) }}</label>
              <div class="input-group">
                <span class="input-group-addon">github.com/</span>
                <input v-model.trim="state.form.values.repo" class="form-input" type="text"
                  :placeholder="$t('repository-placeholder')" @change="onRepoChange" @keyup.enter="onAnalyzeRepo" />
                <button class="btn btn-default input-group-btn btn-go" @click.prevent="onAnalyzeRepo">
                  {{ $t("go") }}
                </button>
              </div>
              <div v-if="state.form.errors.repo" class="form-input-hint">
                {{ state.form.errors.repo }}
              </div>
            </div>
          </div>
          <div class="column col-6 hide-sm">
          </div>
          <div class="column col-6 col-sm-12" :class="{ hide: state.hideMetaFields }">
            <div class="form-zone">
              <h5 class="form-zone-title">{{ $capitalize($t("basic")) }}</h5>
              <div id="id_branch" class="form-group" :class="{
                'has-error': state.form.errors.branch,
              }">
                <label class="form-label required">{{ $capitalize($t("branch")) }}</label>
                <select v-model="state.form.values.branch" class="form-select" @change="onBranchChange">
                  <option v-if="!state.branches.length" disabled selected value="">
                    {{ $t("loading-branches") }}
                  </option>
                  <option v-for="branch in state.branches" :key="branch" :value="branch">
                    {{ branch }}
                  </option>
                </select>
                <div v-if="state.form.errors.branch" class="form-input-hint">
                  {{ state.form.errors.branch }}
                </div>
              </div>
              <div id="id_packageJson" class="form-group" :class="{
                hide: !state.form.values.branch,
                'has-error': state.form.errors.packageJson,
              }">
                <label class="form-label required">
                  {{ $t("select-package-json") }}
                </label>
                <select v-model="state.form.values.packageJson" class="form-select" @change="onPackageJsonPathChange">
                  <option v-if="!state.packageJsonPaths.length" disabled selected value="">
                    {{ state.form.prompts.packageJson }}
                  </option>
                  <option v-for="path in state.packageJsonPaths" :key="path" :value="path">
                    {{ path }}
                  </option>
                </select>
                <div v-if="state.packageJsonObj" class="form-input-hint display-block">
                  package name: <code>{{ state.packageJsonObj.name }}</code>
                </div>
                <div v-if="extraPackageNameWarning" class="form-input-hint">
                  {{ extraPackageNameWarning() }}
                </div>
                <div v-if="state.form.errors.packageJson" class="form-input-hint">
                  {{ state.form.errors.packageJson }}
                </div>
              </div>
              <div id="id_readme" class="form-group" :class="{
                hide: !state.form.values.branch,
                'has-error': state.form.errors.readme,
              }">
                <label class="form-label">
                  {{ $t("select-readme-md") }}
                </label>
                <select v-model="state.form.values.readme" class="form-select">
                  <option v-if="!state.readmePaths.length" disabled selected value="">
                    {{ state.form.prompts.readme }}
                  </option>
                  <option v-for="path in state.readmePaths" :key="path" :value="path">
                    {{ path }}
                  </option>
                </select>
                <div v-if="state.form.errors.readme" class="form-input-hint">
                  {{ state.form.errors.readme }}
                </div>
              </div>
              <div id="id_licenseName" class="form-group" :class="{
                'has-error': state.form.errors.licenseName,
              }">
                <label class="form-label required">{{
                  $t("license-name")
                }}</label>
                <input v-model="state.form.values.licenseName" class="form-input" type="text" />
                <div class="form-input-hint">
                  {{ $t("license-name-desc") }}
                </div>
                <div v-if="state.form.errors.licenseName" class="form-input-hint">
                  {{ state.form.errors.licenseName }}
                </div>
              </div>
              <div id="id_hunter" class="form-group" :class="{
                'has-error': state.form.errors.hunter,
              }">
                <label class="form-label required">{{ $capitalize($t("discovered-by")) }}</label>
                <div class="input-group">
                  <span class="input-group-addon">github.com/</span>
                  <input v-model="state.form.values.hunter" class="form-input" type="text"
                    :placeholder="$t('discovered-by-placeholder')" />
                </div>
                <div class="form-input-hint">
                  {{ $t("your-github-username") }}
                </div>
                <div v-if="state.form.errors.hunter" class="form-input-hint">
                  {{ state.form.errors.hunter }}
                </div>
              </div>
            </div>
          </div>
          <div class="column col-6 col-sm-12" :class="{ hide: state.hideMetaFields }">
            <div class="form-zone">
              <h5 class="form-zone-title">
                {{ $t("advanced") }}
              </h5>
              <div id="id_gitTagPrefix" class="form-group">
                <label class="form-label">{{
                  $t("git-tag-prefix")
                }}</label>
                <input v-model="state.form.values.gitTagPrefix" class="form-input" type="text"
                  :placeholder="$t('git-tag-prefix-placeholder')" />
                <div class="form-input-hint">{{ $t('git-tag-prefix-desc') }}</div>
                <div v-if="state.form.errors.gitTagPrefix" class="form-input-hint">
                  {{ state.form.errors.gitTagPrefix }}
                </div>
              </div>
              <div id="id_gitTagIgnore" class="form-group">
                <label class="form-label">{{
                  $t("git-tag-ignore-pattern")
                }}</label>
                <input v-model="state.form.values.gitTagIgnore" class="form-input" type="text"
                  :placeholder="$t('git-tag-ignore-pattern-placeholder')" />
                <div class="form-input-hint">
                  {{ $t("git-tag-ignore-pattern-desc") }}
                  <br />
                  <code v-if="state.form.values.gitTagIgnore">/{{ state.form.values.gitTagIgnore }}/i</code>
                </div>
                <div v-if="state.form.errors.gitTagIgnore" class="form-input-hint">
                  {{ state.form.errors.gitTagIgnore }}
                </div>
              </div>
              <div id="id_minVersion" class="form-group">
                <label class="form-label">{{
                  $t("minimal-version-to-build")
                }}</label>
                <input v-model="state.form.values.minVersion" class="form-input" type="text" :placeholder="$t('minimal-version-to-build-placeholder')
                  " />
                <div class="form-input-hint">
                  {{ $t("minimal-version-to-build-desc") }}
                </div>
                <div v-if="state.form.errors.minVersion" class="form-input-hint">
                  {{ state.form.errors.minVersion }}
                </div>
              </div>
            </div>
          </div>
          <div class="column col-6 col-sm-12" :class="{ hide: state.hideMetaFields }">
            <div class="form-zone">
              <h5 class="form-zone-title">
                {{ $capitalize($t("promotion")) }}
              </h5>
              <div id="id_topics" class="form-group" :class="{ 'has-error': state.form.errors.topics }">
                <label class="form-label required">{{ $capitalize($t("topics")) }}</label>
                <div class="columns">
                  <div v-for="item in state.form.options.topics" :key="item.slug" class="column col-6">
                    <label class="form-checkbox">
                      <input v-model="item.value" type="checkbox" @change="onTopicsChange" /><i class="form-icon"></i>
                      {{ item.name }}
                    </label>
                  </div>
                  <div v-if="state.form.errors.topics" class="form-input-hint">
                    {{ state.form.errors.topics }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="column col-6 col-sm-12" :class="{ hide: state.hideMetaFields }">
          </div>
          <div class="column col-6 col-sm-12" :class="{ hide: state.hideMetaFields }">
            <div class="form-group text-right">
              <a :href="uploadLink.link" class="btn btn-default" target="_blank" @click="onUpload">
                {{ uploadLink.text }}
              </a>
            </div>
          </div>
        </div>
      </form>
    </template>
  </ParentLayout>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.placeholder-loader-wrapper {
  width: 32rem;
}

.package-add {
  .page {
    .btn-go {
      width: 3rem;
    }

    .pkg-img-columns {
      padding-top: 0.6rem;

      .pkg-img-wrap {
        position: relative;
        overflow: hidden;
        padding-bottom: 100%;
        border: 2px solid white;

        &.selected {
          border-color: var(--c-accent);
        }

        &:hover {
          cursor: pointer;
        }

        .pkg-img {
          position: absolute;
          max-width: 100%;
          max-height: 100%;
          top: 50%;
          left: 50%;
          transform: translateX(-50%) translateY(-50%);
        }
      }
    }

    .theme-default-content {
      max-width: auto;
      margin: 0;
      padding: 0 0 2.5rem;

      :first-child {
        margin-top: 0;
      }
    }

    .tile-title {
      font-weight: bold;
    }

    .form-group {
      padding: 0 0.4rem;
    }

    .form-label,
    .form-input-hint,
    .form-group,
    .form-group input,
    .form-group select,
    .tile {
      font-size: $font-size-md;
    }

    .form-group:last-child {
      margin-bottom: 0.4rem;
    }

    .timeline {
      .timeline-item {
        margin-bottom: 0;
      }
    }

    .form-zone {
      margin: 0 0 0.8rem 0;
      border: 1px solid #eee;

      h5.form-zone-title {
        font-size: $font-size-md;
        font-weight: bold;
        padding: 0.4rem 0.4rem;
        margin-bottom: 0.2rem;
        background-color: var(--c-bg-dark);
      }
    }
  }
}
</style>

<i18n locale="en-US" lang="yaml">
  can-not-locate-the-path-of-pac: Can not locate the path of package.json in the selected branch
  cover-image: cover image
  discovered-by-placeholder: hunter
  discovered-by: discovered by
  git-tag-ignore-pattern-desc: 'The regular expression to exclude Git tags.'
  git-tag-ignore-pattern-placeholder: leave empty to include all tags
  git-tag-ignore-pattern: Git tag ignore pattern
  git-tag-prefix-placeholder: leave empty to include all tags
  git-tag-prefix: Git tag prefix
  git-tag-prefix-desc: "Filter Git tags for monorepo by using a prefix that separates the semver with a slash, hyphen, or underscore. Example: 'com.example.pkg/'."
  license-name-desc: Only open source licenses are permitted.
  loading-branches: Loading branches...
  loading-package-json-path: Loading package.json path...
  loading-readme-md-path: Loading README.md path...
  minimal-version-to-build-placeholder: leave empty to build all versions by default
  minimal-version-to-build: Minimal version to build
  minimal-version-to-build-desc: "The minimum version to build from. For example: '1.0.2'"
  no-markdown-file-found-fallbacks: No markdown file found, fallbacks to README.md
  package-already-exists-in-unity-registry: The package already exists in Unity registry
  package-json-not-found-error: "File not found: package.json."
  package-name-already-exists-error: The package name already exists in OpenUPM registry.
  package-name-blocked: The package name is blocked by scope {scope}.
  package-name-manual-verification: Major tech company package names require manual review during merge.
  select-package-json: Select package.json
  select-readme-md: Select README.md
  private-repository-error: "Refuse to publish a private repository (\"private\": true in the package.json)."
  repository-placeholder: owner/project-name
  submit-metadata: submit metadata
  your-github-username: Your GitHub username
</i18n>