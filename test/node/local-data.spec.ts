import { describe, it } from 'vitest';
import chai from "chai";
const assert = chai.assert;
chai.should();

import {
  collectPackageHuntersAndOwners,
  loadBlockedScopes,
  loadBuiltinPackageNames,
  loadPackageNames,
  loadPackage,
  packageExists,
} from "@node/local-data";
import { PackageMeta } from "@shared/types";


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
      const pkg = await loadPackage("com.littlebigfun.addressable-importer");
      pkg.name.should.equal("com.littlebigfun.addressable-importer");
      pkg.readme.should.equal("main:README.md");
      pkg.readmeBranch.should.equal("main");
      pkg.readmeBase.should.equal("main");
    });
  });

  describe("packageExists()", function () {
    it("should return true if package exists", async function () {
      const exists = await packageExists("com.littlebigfun.addressable-importer");
      exists.should.equal(true);
    });
    it("should return false if package doesn't exists", async function () {
      const exists = await packageExists("com.myorg.package-not-exists");
      exists.should.equal(false);
    });
  });

  describe("collectPackageHuntersAndOwners", function () {
    it("should return package hunters and owners", async function () {
      const packages = [
        { hunter: "bob", owner: "jane", } as PackageMeta,
        { hunter: "bob", owner: "jane", } as PackageMeta,
        { hunter: "bob", owner: "jane", } as PackageMeta,
        { hunter: "bob", owner: "john", } as PackageMeta,
        { hunter: "peter", owner: "john", parentOwner: "bill", parentOwnerUrl: "https://github.com/bill" } as PackageMeta,
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
