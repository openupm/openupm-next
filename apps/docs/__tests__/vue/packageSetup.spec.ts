import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const packageSetupPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/PackageSetup.vue",
    import.meta.url,
  ),
);

const packageCliPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/PackageSetupViaCLI.vue",
    import.meta.url,
  ),
);

const packageMetadataViewPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/PackageMetadataView.vue",
    import.meta.url,
  ),
);

describe("PackageSetup install version selector", () => {
  it("renders the selector only when stable and latest differ", () => {
    const source = readFileSync(packageSetupPath, "utf8");

    expect(source).toContain("v-if=\"hasInstallTargetSelector\"");
    expect(source).toContain("v-for=\"target in installTargets\"");
    expect(source).toContain("$t(target.kind)");
  });

  it("defaults to the first derived target and switches on button click", () => {
    const source = readFileSync(packageSetupPath, "utf8");

    expect(source).toContain("selectedInstallKind.value = targets[0]?.kind");
    expect(source).toContain("@click=\"selectedInstallKind = target.kind\"");
  });

  it("passes selected versions to copy command and both modals", () => {
    const setupSource = readFileSync(packageSetupPath, "utf8");
    const cliSource = readFileSync(packageCliPath, "utf8");
    const metadataSource = readFileSync(packageMetadataViewPath, "utf8");

    expect(metadataSource).toContain(":packument=\"packument\"");
    expect(setupSource).toContain("getInstallCliCommand(props.metadata.name, explicitCliVersion.value)");
    expect(setupSource).toContain(":version=\"selectedPackageManagerVersion\"");
    expect(setupSource).toContain(":version=\"explicitCliVersion\"");
    expect(cliSource).toContain("getInstallCliCommand(props.name, props.version)");
  });
});
