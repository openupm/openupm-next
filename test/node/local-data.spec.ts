import { describe, it } from 'vitest';
import chai from "chai";
const assert = chai.assert;
chai.should();

import {
  collectPackageHuntersAndOwners,
  loadBlockedScopes,
  loadBuiltinPackageNames,
  loadPackageNames,
  loadPackageMetadataLocal,
  packageMetadataLocalExists,
} from "@node/local-data";
import { PackageMetadataLocal } from "@shared/types";


describe("@node/local-data.ts", function () {
  describe("loadBlockedScopes()", function () {
    it("should load blocked scopes", async function () {
      const scopes = await loadBlockedScopes();
      scopes.should.contains("com.unity.burst");
    });
  });

  describe("loadBuiltinPackageNames()", function () {
    it("should load builtin package names", async function () {
      const names = await loadBuiltinPackageNames();
      names.should.contains("com.unity.burst");
    });
  });

  describe("loadPackageNames()", function () {
    it("should load package names", async function () {
      const names = await loadPackageNames();
      names.should.contains("com.littlebigfun.addressable-importer");
    });
  });

  describe("loadPackage()", function () {
    it("should load package", async function () {
      const temp = await loadPackageMetadataLocal("com.littlebigfun.addressable-importer");
      const metadataLocal = temp as PackageMetadataLocal;
      metadataLocal.should.not.equal(null);
      metadataLocal.name.should.equal("com.littlebigfun.addressable-importer");
      metadataLocal.readme.should.equal("master:README.md");
      metadataLocal.readmeBranch.should.equal("master");
      metadataLocal.readmeBase.should.equal("master");
    });
  });

  describe("packageExists()", function () {
    it("should return true if package exists", async function () {
      const exists = await packageMetadataLocalExists("com.littlebigfun.addressable-importer");
      exists.should.equal(true);
    });
    it("should return false if package doesn't exists", async function () {
      const exists = await packageMetadataLocalExists("com.myorg.package-not-exists");
      exists.should.equal(false);
    });
  });

  describe("collectPackageHuntersAndOwners", function () {
    it("should return package hunters and owners", async function () {
      const packages = [
        { hunter: "bob", owner: "jane", } as PackageMetadataLocal,
        { hunter: "bob", owner: "jane", } as PackageMetadataLocal,
        { hunter: "bob", owner: "jane", } as PackageMetadataLocal,
        { hunter: "bob", owner: "john", } as PackageMetadataLocal,
        { hunter: "peter", owner: "john", parentOwner: "bill", parentOwnerUrl: "https://github.com/bill" } as PackageMetadata,
      ];
      const expectedHunters = [
        { githubUser: "bob", score: 4 },
        { githubUser: "peter", score: 1 },
      ];
      const expectedOwners = [
        { githubUser: "jane", score: 3 },
        { githubUser: "john", score: 2 },
        { githubUser: "bill", score: 1 },
      ];
      const { hunters, owners } = await collectPackageHuntersAndOwners(packages);
      hunters.should.deep.equal(expectedHunters);
      owners.should.deep.equal(expectedOwners);
    });
  });
});
