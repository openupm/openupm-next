<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { addAdsenseInArticleAds } from '@/adsense';

const props = defineProps({
  content: {
    type: String,
    default: ""
  }
});

// The reference of the readme container element
const readmeContainerElement = ref<HTMLElement | null>(null);

function getCodeBlockLanguage(codeElement: HTMLElement): string {
  const languageClass = Array.from(codeElement.classList).find(className => {
    return className !== "hljs" && /^[a-zA-Z0-9_-]+$/.test(className);
  });
  if (!languageClass) return "text";
  return languageClass.replace(/^language-/, "") || "text";
}

function normalizeReadmeCodeBlocks(element: HTMLElement): void {
  element.querySelectorAll<HTMLElement>("pre > code.hljs").forEach(codeElement => {
    const preElement = codeElement.parentElement;
    const parentElement = preElement?.parentElement;
    if (!preElement || !parentElement || parentElement.className.includes("language-")) return;

    preElement.classList.add("readme-code-block");
    const wrapperElement = document.createElement("div");
    wrapperElement.className = `language-${getCodeBlockLanguage(codeElement)}`;
    parentElement.insertBefore(wrapperElement, preElement);
    wrapperElement.appendChild(preElement);
  });
}

function enhanceReadmeHtml(): void {
  void nextTick(() => {
    const element = readmeContainerElement.value;
    if (element) normalizeReadmeCodeBlocks(element);
  });
}

onMounted(() => {
  const element = readmeContainerElement.value;
  if (element)
    addAdsenseInArticleAds(element);
  enhanceReadmeHtml();
});

watch(() => props.content, enhanceReadmeHtml);
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div ref="readmeContainerElement" v-html="content"></div>
</template>
