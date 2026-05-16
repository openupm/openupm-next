import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const packageDetailLayoutPath = fileURLToPath(
  new URL("../../docs/.vuepress/layouts/PackageDetailLayout.vue", import.meta.url),
);
const modalPath = fileURLToPath(
  new URL("../../docs/.vuepress/components/Modal.vue", import.meta.url),
);

describe("package setup modal deep links", () => {
  it("opens async-rendered modals when the browser hash already targets them", () => {
    const source = readFileSync(modalPath, "utf8");

    expect(source).toContain('import { computed, onMounted, onUnmounted, ref } from "vue";');
    expect(source).toContain("currentHash.value === `#${props.id}`");
    expect(source).toContain('window.addEventListener("hashchange", syncCurrentHash);');
    expect(source).toContain('window.removeEventListener("hashchange", syncCurrentHash);');
    expect(source).toContain(':class="{ active: isActiveHashTarget }"');
  });

  it("renders the installation subpage for setup modal hashes on narrow screens", () => {
    const source = readFileSync(packageDetailLayoutPath, "utf8");

    expect(source).toContain("const packageSetupModalHashes = new Set([");
    expect(source).toContain("const getCurrentHash = (): string => {");
    expect(source).toContain('"#modal-manualinstallation"');
    expect(source).toContain("shouldShowMetadataSubpageEntry.value");
    expect(source).toContain("packageSetupModalHashes.has(getCurrentHash())");
    expect(source).toContain("return SubPageSlug.metadata;");
  });
});
