import { describe, it } from 'vitest';
import chai from "chai";
const assert = chai.assert;
chai.should();

import {
  convertRepoUrl,
  getNamespace,
  // isValidPackageName
} from "@node/utils/package";

describe("@node/utils/package.ts", function () {
  describe("convertRepoUrl()", function () {
    it("should return https when src=https and format=https ", function () {
      assert.equal(
        convertRepoUrl("https://github.com/username/repo", "https"),
        "https://github.com/username/repo"
      );
    });
    it("should return https when src=https and format=default ", function () {
      assert.equal(
        convertRepoUrl("https://github.com/username/repo"),
        "https://github.com/username/repo"
      );
    });
    it("should return https when src=git + and format=https ", function () {
      assert.equal(
        convertRepoUrl("git@github.com:username/repo", "https"),
        "https://github.com/username/repo"
      );
    });
    it("should return git when src=git and format=git", function () {
      assert.equal(
        convertRepoUrl("git@github.com:username/repo.git", "git"),
        "git@github.com:username/repo.git"
      );
    });
    it("should return git when src=https and format=git ", function () {
      assert.equal(
        convertRepoUrl("https://github.com/username/repo.git", "git"),
        "git@github.com:username/repo.git"
      );
    });
  });
  describe("getNamespace()", function () {
    it("should handle x.y", async function () {
      const namespace = getNamespace("com.littlebigfun");
      namespace.should.equal("com.littlebigfun");
    });
    it("should handle x.y.z", async function () {
      const namespace = getNamespace("com.littlebigfun.addressable-importer");
      namespace.should.equal("com.littlebigfun");
    });
    it("should handle x.y.z.sub", async function () {
      const namespace = getNamespace("com.littlebigfun.addressable-importer.sub");
      namespace.should.equal("com.littlebigfun");
    });
  });
});
