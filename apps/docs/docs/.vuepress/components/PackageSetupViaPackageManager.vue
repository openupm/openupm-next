<script setup lang="ts">
import { computed } from 'vue';
import highlightjs from "highlight.js";

import { getRegistryBaseUrl } from '@openupm/common/build/urls.js';

const props = defineProps({
  name: { type: String, default: "" },
  version: { type: String, default: "" },
  scopes: {
    type: Array<string>,
    default: () => [],
  },
});

const registryName = getRegistryBaseUrl().replace("https://", "");

const registryUrl = getRegistryBaseUrl();

const registryItems = computed(() => {
  const items = [
    { name: "Name", value: registryName },
    { name: "URL", value: registryUrl },
  ];
  const scopes = props.scopes || [];
  for (let i = 0; i < scopes.length; i++) {
    const scope = scopes[i];
    items.push({ name: i == 0 ? "Scope(s)" : "", value: scope });
  }
  return items;
});

const manifest = computed(() => {
  const jsonData = {
    scopedRegistries: [
      {
        name: registryName,
        url: registryUrl,
        scopes: props.scopes,
      },
    ],
    dependencies: {} as any,
  };
  jsonData.dependencies[props.name] = props.version;
  const jsonText = JSON.stringify(jsonData, null, 4);
  const highlighted = highlightjs.highlight(jsonText, { language: "json" }).value;
  return `<pre><code class="hljs json">${highlighted}</code></pre>`;
});

const upmManifestProjectLink = computed(() => {
  return {
    link: "https://docs.unity3d.com/Manual/upm-manifestPrj.html",
    text: "Packages/manifest.json",
  };
})

const modalId = "modal-manualinstallation";
</script>

<template>
  <Modal :id="modalId">
    <template #title>Install via Package Manager</template>
    <template #body>
      <p>Please follow the instrustions:</p>
      <ul>
        <li>open <strong>Edit/Project Settings/Package Manager</strong></li>
        <li>
          add a new Scoped Registry (or edit the existing OpenUPM entry)
          <dl class="setup-scoped-registry">
            <div v-for="(item, index) in registryItems" :key="index">
              <dt>{{ item.name }}</dt>
              <dd>
                <CopyWrapper :copy-text="item.value">
                  <code>{{ item.value }}</code>
                </CopyWrapper>
              </dd>
            </div>
          </dl>
        </li>
        <li>click <kbd>Save</kbd> or <kbd>Apply</kbd></li>
        <li>open <strong>Window/Package Manager</strong></li>
        <li>click <kbd>+</kbd></li>
        <li>
          select <kbd>Add package by name...</kbd> or
          <kbd>Add package from git URL...</kbd>
        </li>
        <li>
          paste
          <CopyWrapper :copy-text="name"><code>{{ name }}</code></CopyWrapper>
          into name
        </li>
        <li>
          paste
          <CopyWrapper :copy-text="version"><code>{{ version }}</code></CopyWrapper>
          into version
        </li>
        <li>click <kbd>Add</kbd></li>
      </ul>
      <div class="divider text-center" data-content="OR"></div>
      <p>
        Alternatively, merge the snippet to
        <AutoLink :item="upmManifestProjectLink" />
      </p>
      <div class="theme-default-content custom">
        <div class="language-json" v-html="manifest"></div>
      </div>
    </template>
  </Modal>
</template>

<style lang="scss">
dl.setup-scoped-registry {
  border: 1px solid var(--c-border);
  padding: 0.5rem 0.75rem;

  >div {
    padding-top: 0.1rem;
  }

  dt {
    display: inline-block;
    width: 3.3rem;
    word-wrap: break-word;
  }

  dd {
    display: inline;
    margin-left: 0;
    vertical-align: top;
  }

  &:after {
    content: '';
    display: block;
  }
}
</style>