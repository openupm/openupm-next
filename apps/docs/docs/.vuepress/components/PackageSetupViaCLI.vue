<script setup lang="ts">
import { capitalize } from 'lodash-es';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import highlightjs from "highlight.js";

import { getRegion } from '@openupm/common/build/utils.js';
import { Region } from '@openupm/types';
import { getNodeJsUrl, getOpenupmCliRepoUrl } from '@openupm/common/build/urls.js';

const { t } = useI18n();

const props = defineProps({
  name: { type: String, default: "" }
});

const bashScript = computed(() => {
  const cli = getRegion() == Region.CN ? "openupm-cn" : "openupm";
  return `# ${capitalize(t("install-openupm-cli"))}
npm install -g openupm-cli

# ${capitalize(t("go-to-unity-project"))}
cd YOUR_UNITY_PROJECT_DIR

# ${capitalize(t("install-package"))}: ${props.name}
${cli} add ${props.name}`;
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
  nodejs-link-text: Node.js 14.18 or above
</i18n>

<i18n locale="zh-CN" lang="yaml">
  install-via-command-line-interface: 安装方式：命令行工具
  install-openupm-cli: 安装 openupm-cli
  go-to-unity-project: 进入Unity工程目录
  install-package: 安装软件包
  nodejs-link-text: Node.js 14.18 或以上版本
</i18n>