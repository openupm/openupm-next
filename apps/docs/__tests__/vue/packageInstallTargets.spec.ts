import {
  getInstallCliCommand,
  getInstallTargets,
  getStableVersion,
} from "../../docs/.vuepress/components/package-install-targets";
import { describe, expect, it } from "vitest";

describe("package install targets", () => {
  it("returns one latest option when stable and latest are the same", () => {
    expect(
      getInstallTargets({
        "dist-tags": { latest: "1.2.3" },
        versions: {
          "1.2.2": {},
          "1.2.3": {},
        },
      }),
    ).toEqual([{ kind: "latest", version: "1.2.3" }]);
  });

  it("returns stable first when latest is a newer prerelease", () => {
    expect(
      getInstallTargets({
        "dist-tags": { latest: "2.0.0-preview.1" },
        versions: {
          "1.9.0": {},
          "2.0.0-preview.1": {},
        },
      }),
    ).toEqual([
      { kind: "stable", version: "1.9.0" },
      { kind: "latest", version: "2.0.0-preview.1" },
    ]);
  });

  it("returns only latest when only prerelease versions exist", () => {
    expect(
      getInstallTargets({
        "dist-tags": { latest: "1.0.0-preview.2" },
        versions: {
          "1.0.0-preview.1": {},
          "1.0.0-preview.2": {},
        },
      }),
    ).toEqual([{ kind: "latest", version: "1.0.0-preview.2" }]);
  });

  it("does not treat build metadata as a prerelease", () => {
    expect(getStableVersion(["1.0.0-preview.1", "1.0.0+build.2"])).toBe(
      "1.0.0+build.2",
    );
  });

  it("pins CLI commands only when an explicit version is provided", () => {
    expect(getInstallCliCommand("com.example.pkg")).toBe(
      "openupm add com.example.pkg",
    );
    expect(getInstallCliCommand("com.example.pkg", "1.2.3")).toBe(
      "openupm add com.example.pkg@1.2.3",
    );
  });
});
