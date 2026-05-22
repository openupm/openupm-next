<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { paramCase } from "change-case";
import { ReleaseErrorCode } from "@openupm/types";

const troubleshootingUrl = "/docs/troubleshooting-build-errors.html";

const releaseErrorDescriptions: Partial<Record<ReleaseErrorCode, string>> = {
  [ReleaseErrorCode.None]:
    "OpenUPM could not classify the build failure. Check the build logs for the exact failure.",
  [ReleaseErrorCode.BadRequest]:
    "The registry rejected the publish request as invalid.",
  [ReleaseErrorCode.Unauthorized]:
    "The registry rejected the publish request because authentication failed.",
  [ReleaseErrorCode.Forbidden]:
    "The registry rejected the publish request because access was forbidden.",
  [ReleaseErrorCode.VersionConflict]:
    "A package with the same version is already published. Update package.json and create a new tag.",
  [ReleaseErrorCode.EntityTooLarge]:
    "The package is larger than the registry allows.",
  [ReleaseErrorCode.InternalError]:
    "The registry returned an internal server error.",
  [ReleaseErrorCode.BadGateway]:
    "A temporary upstream gateway error interrupted the release build.",
  [ReleaseErrorCode.ServiceUnavailable]:
    "A required upstream service was temporarily unavailable.",
  [ReleaseErrorCode.GatewayTimeout]:
    "A temporary upstream timeout interrupted the release build.",
  [ReleaseErrorCode.BuildTimeout]:
    "The release build did not finish before the queue timeout.",
  [ReleaseErrorCode.BuildCancellation]: "The release build was cancelled.",
  [ReleaseErrorCode.PackageNotFound]:
    "The build could not find a matching package.json.",
  [ReleaseErrorCode.Private]: "The source package is marked private.",
  [ReleaseErrorCode.PackageNameInvalid]:
    "The package name is not valid for OpenUPM.",
  [ReleaseErrorCode.PackageJsonParsingError]:
    "The package.json file could not be parsed.",
  [ReleaseErrorCode.RemoteBranchNotFound]:
    "The configured Git tag or branch was not found.",
  [ReleaseErrorCode.InvalidVersion]:
    "The package version is not a valid version string.",
  [ReleaseErrorCode.RemoteRepositoryUnavailable]:
    "The source repository could not be reached.",
  [ReleaseErrorCode.RemoteSubmoduleUnavailable]:
    "A required Git submodule repository could not be reached.",
  [ReleaseErrorCode.SubmoduleFetchingError]:
    "A Git submodule commit could not be fetched.",
  [ReleaseErrorCode.NpmHookError]:
    "An npm lifecycle hook failed while packing or publishing the package.",
  [ReleaseErrorCode.VersionMismatch]:
    "The package.json version does not match the version OpenUPM discovered from the Git tag or GitHub Release.",
  [ReleaseErrorCode.ConnectionTimeout]:
    "A network connection timed out during the release build.",
  [ReleaseErrorCode.HeapOutOfMemroy]: "The release build ran out of memory.",
  [ReleaseErrorCode.LfsBudgetExceeded]:
    "The source repository exceeded its Git LFS bandwidth quota.",
  [ReleaseErrorCode.LfsObjectNotFound]:
    "A required Git LFS object is missing from the source repository.",
  [ReleaseErrorCode.GitHubReleaseNotFound]:
    "The configured GitHub Release was not found.",
  [ReleaseErrorCode.GitHubReleaseAssetNotFound]:
    "The configured GitHub Release has no matching package asset.",
  [ReleaseErrorCode.GitHubReleaseAssetAmbiguous]:
    "The configured GitHub Release has multiple matching package assets.",
  [ReleaseErrorCode.GitHubReleaseApiError]:
    "The GitHub Release API failed during asset lookup.",
  [ReleaseErrorCode.GitHubReleaseAssetDownloadFailed]:
    "The GitHub Release asset failed to download during the build.",
};

const props = defineProps<{
  reasonCode?: number;
  reasonName?: string;
  buildUrl?: string;
}>();

const { t } = useI18n();
const isOpen = ref(false);

const reasonName = computed(() => {
  return (
    props.reasonName ||
    (props.reasonCode !== undefined
      ? String(ReleaseErrorCode[props.reasonCode] || "")
      : "")
  );
});

const resolvedReasonCode = computed(() => {
  if (props.reasonCode !== undefined) return props.reasonCode;
  const code = ReleaseErrorCode[
    reasonName.value as keyof typeof ReleaseErrorCode
  ] as number | undefined;
  return typeof code === "number" ? code : undefined;
});

const reasonText = computed(() => {
  const key = `release-reason-${paramCase(reasonName.value)}`;
  const value = t(key);
  return value === key ? reasonName.value : value;
});

const errorCodeText = computed(() => {
  return resolvedReasonCode.value !== undefined
    ? `E${resolvedReasonCode.value}`
    : "E?";
});

const title = computed(() => `${errorCodeText.value} ${reasonText.value}`);

const description = computed(() => {
  return (
    releaseErrorDescriptions[resolvedReasonCode.value as ReleaseErrorCode] ||
    "OpenUPM could not classify the build failure. Check the build logs for the exact failure."
  );
});

function openModal(): void {
  isOpen.value = true;
}

function closeModal(): void {
  isOpen.value = false;
}
</script>

<template>
  <span class="release-error-info">
    <button
      type="button"
      class="release-error-info__trigger"
      @click="openModal"
    >
      <span class="label label-warning">{{ errorCodeText }}</span>
      <span class="release-error-info__summary">{{ reasonText }}</span>
    </button>
    <Teleport to="body">
      <div v-if="isOpen" class="modal active release-error-info__modal">
        <button
          type="button"
          class="modal-overlay"
          aria-label="Close"
          @click="closeModal"
        ></button>
        <section
          class="modal-container release-error-info__dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <div class="modal-header">
            <button
              type="button"
              class="btn btn-clear float-right"
              aria-label="Close"
              @click="closeModal"
            ></button>
            <div class="modal-title h5">{{ title }}</div>
          </div>
          <div class="modal-body">
            <div class="content">
              <p>{{ description }}</p>
              <p>
                See
                <RouterLink :to="troubleshootingUrl" @click="closeModal">
                  Troubleshooting Build Errors
                </RouterLink>
                for more information.
              </p>
              <p v-if="buildUrl">
                <a :href="buildUrl" target="_blank" rel="noopener">
                  View Azure build logs
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </span>
</template>

<style lang="scss" scoped>
.release-error-info__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  padding: 0;
  border: 0;
  color: inherit;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.release-error-info__summary {
  text-decoration: underline;
  text-underline-offset: 0.12rem;
}

.release-error-info__dialog {
  color: var(--c-text);
  background: var(--c-bg);

  .modal-header,
  .modal-title,
  .modal-body {
    color: var(--c-text);
  }
}
</style>
