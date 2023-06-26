import { describe, it } from 'vitest';
import chai from "chai";
const assert = chai.assert;
chai.should();

import {
  isPackageBlockedByScope,
  isValidPackageName,
  getCachedAvatarImageFilename,
} from "@shared/utils";

describe("@shared/utils.ts", function () {
  describe("isValidPackageName()", function () {
    it("should fail with com.company.UPPERCASE", async function () {
      isValidPackageName("com.company.UPPERCASE")[0].should.be.false;
    });
    it("should be ok with com.company.lowercase", async function () {
      isValidPackageName("com.company.lowercase")[0].should.be.true;
    });
    it("should be ok with com.company.lowercase.sub", async function () {
      isValidPackageName("com.company.lowercase.sub")[0].should.be.true;
    });
    it("should fail with com.company", async function () {
      isValidPackageName("com.company")[0].should.be.false;
    });
    it("should fail with com", async function () {
      isValidPackageName("com")[0].should.be.false;
    });
    it("should conform max length", async function () {
      const prefix = "com.company.";
      isValidPackageName("com.company." + "a".repeat(214 - prefix.length))[0].should.be.true;
      isValidPackageName("com.company." + "a".repeat(214 - prefix.length + 1))[0].should.be.false;
    });
    it("should fail with empty name", async function () {
      isValidPackageName("")[0].should.be.false;
    });
  });

  describe("getCachedAvatarImageFilename", function () {
    it("should return the correct filename for a given username and size", function () {
      const username = "JohnDoe";
      const size = 100;
      const expectedFilename = "johndoe-100x100.png";
      const actualFilename = getCachedAvatarImageFilename(username, size);
      actualFilename.should.equal(expectedFilename);
    });
  });

  describe("isPackageBlockedByScope", function () {
    it("should return true if the package name is blocked by the given block scope", function () {
      const packageName = "com.myorg.mypackage";
      const scope = "^com.myorg.";
      const result = isPackageBlockedByScope(packageName, scope);
      result.should.be.true;
    });

    it("should return false if the package name is not blocked by the given block scope", function () {
      const packageName = "com.myorg.mypackage";
      const scope = "^com.anotherorg.";
      const result = isPackageBlockedByScope(packageName, scope);
      result.should.be.false;
    });

    it("should return true if the package name is equal to the given block scope", function () {
      const packageName = "com.myorg.mypackage";
      const scope = "com.myorg.mypackage";
      const result = isPackageBlockedByScope(packageName, scope);
      result.should.be.true;
    });

    it("should return false if the package name is not equal to the given block scope", function () {
      const packageName = "com.myorg.mypackage";
      const scope = "com.anotherorg.mypackage";
      const result = isPackageBlockedByScope(packageName, scope);
      result.should.be.false;
    });
  });
});
