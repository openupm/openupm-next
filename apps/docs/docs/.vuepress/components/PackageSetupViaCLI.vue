<script setup lang="ts">
import { capitalize } from 'lodash-es';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import highlightjs from "highlight.js";

import { getNodeJsUrl, getOpenupmCliRepoUrl } from '@openupm/common/build/urls.js';

const { t } = useI18n();

const props = defineProps({
  name: { type: String, default: "" }
});

const bashScript = computed(() => {
  return `# ${capitalize(t("install-openupm-cli"))}
npm install -g openupm-cli

# ${capitalize(t("go-to-unity-project"))}
cd YOUR_UNITY_PROJECT_DIR

# ${capitalize(t("install-package"))}: ${props.name}
openupm add ${props.name}`;
});

const highlighted = computed(() => {
  const highlighted = highlightjs.highlight(bashScript.value, { language: "sh" }).value;
  return `<pre><code class="hljs sh">${highlighted}</code></pre>`;
});

const modalId = computed(() => "modal-commandlinetool");

const nodejsLink = computed(() => ({
  link: getNodeJsUrl(),
  text: t("nodejs-link-text")
}));

const openupmCliRepoLink = computed(() => ({
  link: getOpenupmCliRepoUrl(),
  text: "openupm-cli"
}));
</script>

<template>
  <Modal :id="modalId">
    <template #title>
      {{ $capitalize($t("install-via-command-line-interface")) }}
    </template>
    <template #body>
      <p>
        {{ $capitalize($t("prerequisites")) }}
        :
        <AutoLink :item="nodejsLink" /> {{ $t("and") }}
        <AutoLink :item="openupmCliRepoLink" />.
      </p>
      <div class="theme-default-content custom">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="language-sh" v-html="highlighted">
        </div>
      </div>
    </template>
  </Modal>
</template>

<i18n locale="en-US" lang="yaml">
  install-openupm-cli: install openupm-cli
  install-via-command-line-interface: install via Command-Line Interface
  go-to-unity-project: go to your Unity project directory
  install-package: Install package
  nodejs-link-text: Node.js v16 or above
</i18n>
