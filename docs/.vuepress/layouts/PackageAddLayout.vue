<script setup lang="ts">
import axios from "axios";
import Joi from "joi";
import querystring from "query-string";
import urlJoin from "url-join";
import yaml from "js-yaml";

import { capitalize, cloneDeep } from "lodash-es";
import { computed, watch, onMounted, ref, reactive } from "vue";
import { useI18n } from 'vue-i18n'
import VueScrollTo from "vue-scrollto";

import ParentLayout from "@/layouts/WideLayout.vue";
import { useDefaultStore } from '@/store';
import { FormFieldOption, License, Topic } from "@shared/types";
import { getPublicGenPath, getUnityRegistryUrl } from "@shared/urls";
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
      required: {},
      options: {
        topics: topicsWithAll.slice(1, topicsWithAll.length - 1).map((x: Topic) => ({
          key: x.slug,
          text: x.name,
          selected: false,
        })),
        branch: [],
        packageJson: [],
        readme: [],
      } as { [key: string]: FormFieldOption[] },
    },
    isSubmitting: false,
    hideMetaFields: true,
    repoInfo: {},
    packageJsonObj: {} as any,
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
  // Reset values, errors.
  // PackageFormSchema.describe() is not available in browser environment, so we have to use $_terms.
  for (const schemaKey of PackageFormSchema.$_terms.keys) {
    if (skipFields && skipFields.includes(schemaKey.key)) continue;
    if (schemaKey.schema.type === "array") {
      form.values[schemaKey.key] = cloneDeep(schemaKey.schema._flags.default);
    } else {
      form.values[schemaKey.key] = schemaKey.schema._flags.default;
    }
    form.errors[schemaKey.key] = "";
    form.required[schemaKey.key] = schemaKey.schema._flags.presence === "required";
  }
  // Reset form.options
  for (const topic of form.options.topics) topic.selected = false;
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

const repoOwner = computed(() => {
  if (state.repoInfo && state.repoInfo.owner && state.repoInfo.owner.login)
    return state.repoInfo.owner.login;
  return "openupm";
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
      urlJoin("https://api.github.com/repos/", state.form.values.repo),
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
      state.form.errors.repo = t("error-404");
    else if (errorObj.message.includes("403"))
      state.form.errors.repo = t("error-403");
    else state.form.errors.repo = errorObj.message;
  } finally {
    state.isSubmitting = false;
  }
};

const fetchBranches = async () => {
  state.form.options.branch = [];
  try {
    // Clean error message.
    state.form.errors.branch = "";
    let url =
      urlJoin("https://api.github.com/repos/", state.form.values.repo, "branches") +
      "?per_page=100";
    // Traversing with pagination
    while (true) {
      let resp = await axios.get(url, {
        headers: { Accept: "application/vnd.github.v3.json" },
      });
      const branches = resp.data
        .map((x: any) => x.name)
        .filter((x: string) => !x.startsWith("all-contributors/"));
      for (const item of branches) state.form.options.branch.push({ key: item, text: item });
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
    if (state.form.options.branch.some((x: any) => x.key == "master")) {
      state.form.values.branch = "master";
      onBranchChange();
    } else if (state.form.options.some((x: any) => x.key == "main")) {
      state.form.values.branch = "main";
      onBranchChange();
    }
  } catch (error) {
    const errorObj = error as Error;
    if (errorObj.message.includes("403"))
      state.form.errors.branch = t("error-403");
    else state.form.errors.branch = errorObj.message;
  }
};

const fetchGitTrees = async () => {
  if (!state.form.values.branch) return;
  state.form.options.packageJson = [];
  state.form.options.readme = [];
  try {
    // Clean error message.
    state.form.errors.packageJson = "";
    state.form.errors.readme = "";
    // Fetch.
    const url = urlJoin(
      "https://api.github.com/repos/",
      state.form.values.repo,
      "git/trees",
      state.form.values.branch
    );
    const resp = await axios.get(url, {
      params: { recursive: 1 },
      headers: { Accept: "application/vnd.github.v3.json" },
    });
    // Assign data to packageJson
    const paths = resp.data.tree
      .map((x: any) => x.path)
      .filter((x: string) => x.endsWith("package.json"));
    state.form.options.packageJson = paths.map((x: string) => ({ key: x, text: x }));
    state.form.values.packageJson = null;
    if (paths.length == 0) {
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
    state.form.options.readme = readmePaths.map((x: string) => ({ key: x, text: x }));
    if (readmePaths.length == 0) {
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
    const errorObj = error as Error;
    if (errorObj.message.includes("403"))
      state.form.errors.packageJson = t("error-403");
    else state.form.errors.packageJson = errorObj.message;
  }
};

const fetchPackageJson = async () => {
  try {
    // Clean error message.
    state.form.errors.packageJson = "";
    // Fetch.
    let url = urlJoin(
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
    if (errorObj.message.includes("403"))
      state.form.errors.packageJson = t("error-403");
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
    let url = urlJoin(getUnityRegistryUrl(), packageName);
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
    state.form.options.packageJson = [];
    state.form.options.readme = [];
    state.form.options.branch = [];
    state.packageJsonObj = {};
    fetchRepoInfo();
    fetchBranches();
    setTimeout(() => {
      VueScrollTo.scrollTo("#id_form", 500, { offset: -80 });
    }, 300);
  }
};

const onTopicsChange = () => {
  const form = state.form;
  form.values.topics = form.options.topics
    .filter((x: FormFieldOption) => x.selected)
    .map((x: FormFieldOption) => x.key);
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
    image: form.values.image,
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

const extraPackageNameWarning = computed(() => {
  let pkgName = (state.packageJsonObj.name || "").toLowerCase();
  if (pkgName) {
    if (isPackageRequiresManualVerification(pkgName))
      return t("package-name-manual-verification");
  }
});

const isLoading = computed(() => {
  return isLoadingBlockedScopes.value || isLoadingLicenses.value;
});

const metadata = computed(() => {
  return {
    name: state.packageJsonObj.name || "com.example.package",
    displayName: state.packageJsonObj.displayName || "Your Package Name",
    description: state.packageJsonObj.description || state.repoInfo.description || "",
    image: state.form.values.image || null,
    stars: state.repoInfo.stargazers_count || 0,
    owner: repoOwner.value,
  } as any;
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
      <form id="id_form" v-else novalidate @submit.prevent>
        <!-- A dummy button is needed here to capture any input field that triggers a keyboard "Enter" key pressed event. But why... -->
        <button class="hide" @click.prevent></button>
        <div class="columns">
          <div class="column col-6 col-sm-12 mb-1">
            <FormField class="pl-0 pr-0" :form="state.form" field="repo" :label='capitalize(t("repository"))'
              input-group-text="github.com/" type="text" :placeholder="$t('repository-placeholder')"
              @change="onRepoChange" @keyup.enter="onAnalyzeRepo">
              <template #inputgroupafter>
                <button class="btn btn-default input-group-btn btn-go" @click.prevent="onAnalyzeRepo">
                  {{ $t("go") }}
                </button>
              </template>
            </FormField>
          </div>
          <div class="column col-6 hide-sm">
          </div>
          <div class="column col-6 col-sm-12" :class="{ hide: state.hideMetaFields }">
            <div class="form-zone">
              <h5 class="form-zone-title">{{ $capitalize($t("basic")) }}</h5>
              <FormField :form="state.form" field="branch" :label='capitalize(t("branch"))' type="select" />
              <FormField :form="state.form" field="packageJson" :label='capitalize(t("select-package-json"))'
                type="select" :class="{ hide: !state.form.values.branch }" @change="onPackageJsonPathChange">
                <template #hintafter>
                  <div v-if="extraPackageNameWarning" class="form-input-hint">
                    {{ extraPackageNameWarning }}
                  </div>
                </template>
              </FormField>
              <FormField :form="state.form" field="readme" :label='capitalize(t("select-readme-md"))' type="select"
                :class="{ hide: !state.form.values.branch }" />
              <FormField :form="state.form" field="licenseName" :label='capitalize(t("license-name"))' type="text"
                :hint="t('license-name-desc')" />
              <FormField :form="state.form" field="hunter" :label='capitalize(t("discovered-by"))'
                :inputGroupText='t("hunter-input-group-text")' type="text" :hint="t('hunter-desc')"
                :placeholder="$t('hunter-placeholder')" />
            </div>
          </div>
          <div class="column col-6 col-sm-12" :class="{ hide: state.hideMetaFields }">
            <div class="form-zone">
              <h5 class="form-zone-title">
                {{ $t("advanced") }}
              </h5>
              <FormField :form="state.form" field="gitTagPrefix" :label='t("git-tag-prefix")' type="text"
                :hint="t('git-tag-prefix-desc')" :placeholder="$t('git-tag-prefix-placeholder')" />
              <FormField :form="state.form" field="gitTagIgnore" :label='t("git-tag-ignore")' type="text"
                :hint="t('git-tag-ignore-desc')" :placeholder="$t('git-tag-ignore-placeholder')">
                <template #hintafter>
                  <div v-if="state.form.values.gitTagIgnore" class="form-input-hint">
                    <code>/{{ state.form.values.gitTagIgnore }}/i</code>
                  </div>
                </template>
              </FormField>
              <FormField :form="state.form" field="minVersion" :label='t("min-version")' type="text"
                :hint="t('min-version-desc')" :placeholder="$t('min-version-placeholder')" />
            </div>
          </div>
          <div class="column col-6 col-sm-12" :class="{ hide: state.hideMetaFields }">
            <div class="form-zone">
              <h5 class="form-zone-title">
                {{ $capitalize($t("promotion")) }}
              </h5>
              <FormField :form="state.form" field="image" :label="t('cover-image')" type="text"
                :hint="t('cover-image-desc')" :placeholder="t('cover-image-placeholder')" />
              <FormField :form="state.form" field="topics" :label="capitalize(t('topics'))" type="checkboxes"
                @change="onTopicsChange" />
            </div>
          </div>
          <div class="column col-6 col-sm-12" :class="{ hide: state.hideMetaFields }">
            <div class="form-zone">
              <h5 class="form-zone-title">
                Preview
              </h5>
              <div class="columns package-card-columns">
                <div class="column col-2"></div>
                <div class="column col-8">
                  <PackageCard :metadata="metadata" :prefer-raw-avatar-url="true" />
                </div>
                <div class="column col-2"></div>
              </div>
            </div>
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

    .form-zone {
      margin: 0 0 0.8rem 0;
      border: 1px solid var(--c-border);

      h5.form-zone-title {
        font-size: $font-size-md;
        font-weight: bold;
        padding: 0.4rem 0.4rem;
        margin-bottom: 0.2rem;
        background-color: var(--c-bg-dark);
      }

      .package-card-columns {
        margin: 1rem 0 0.4rem 0;
      }
    }
  }
}
</style>

<i18n locale="en-US" lang="yaml">
  can-not-locate-the-path-of-pac: Can not locate the path of package.json in the selected branch
  cover-image: Cover image URL
  cover-image-desc: Set cover image on listing page with 2:1 aspect ratio (600x300px) and use raw image URL if hosted on GitHub.
  cover-image-placeholder: Leave empty to use the default image
  discovered-by: discovered by
  error-404: Repository not found
  error-403: GitHub API rate limit reached. Please wait and try again later. Thank you for your patience. Learn more at https://api.github.com/rate_limit.
  hunter-desc: Your GitHub username
  hunter-input-group-text: github.com/
  hunter-placeholder: hunter
  git-tag-ignore: Git tag ignore pattern
  git-tag-ignore-desc: 'The regular expression to exclude Git tags.'
  git-tag-ignore-placeholder: leave empty to include all tags
  git-tag-prefix: Git tag prefix
  git-tag-prefix-desc: "Filter Git tags for monorepo by using a prefix that separates the semver with a slash, hyphen, or underscore. Example: 'com.example.pkg/'."
  git-tag-prefix-placeholder: leave empty to include all tags
  license-name-desc: Only open source licenses are permitted.
  min-version: Minimal version to build
  min-version-desc: "The minimum version to build from. For example: '1.0.2'"
  min-version-placeholder: leave empty to build all versions
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
</i18n>