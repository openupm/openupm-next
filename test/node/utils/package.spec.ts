import { describe, it } from 'vitest';
import chai from "chai";
const assert = chai.assert;
chai.should();

import {
  convertRepoUrl,
  parsePackageMetadata,
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
  describe('parsePackageMetadata', () => {
    it('should parse owner from repoUrl', () => {
      const doc = {
        repoUrl: 'git://github.com/user/repo.git',
      };
      const expected = {
        owner: 'user',
      };
      const result = parsePackageMetadata(doc);
      result.owner.should.equal(expected.owner);
    });
    it('should parse ownerUrl from repoUrl', () => {
      const doc = {
        repoUrl: 'https://github.com/user/repo',
      };
      const expected = {
        ownerUrl: 'https://github.com/user',
      };
      const result = parsePackageMetadata(doc);
      result.ownerUrl.should.equal(expected.ownerUrl);
    });
    it('should parse repo from repoUrl', () => {
      const doc = {
        repoUrl: 'git://github.com/user/repo.git',
      };
      const expected = {
        repo: 'repo',
      };
      const result = parsePackageMetadata(doc);
      result.repo.should.equal(expected.repo);
    });
    it('should parse hunterUrl from hunter', () => {
      const doc = {
        repoUrl: 'git://github.com/user/repo.git',
        hunter: 'hunter',
      };
      const expected = {
        hunterUrl: 'https://github.com/hunter',
      };
      const result = parsePackageMetadata(doc);
      result.hunterUrl!.should.equal(expected.hunterUrl);
    });
    it('should set hunterUrl to null if hunter is not defined', () => {
      const doc = {
        repoUrl: 'git://github.com/user/repo.git',
      };
      const expected = {
        hunter: '',
        hunterUrl: null,
      };
      const result = parsePackageMetadata(doc);
      result.hunter.should.equal(expected.hunter);
      assert.equal(result.hunterUrl, expected.hunterUrl);
    });
    it('should parse licenseName from licenseSpdxId', () => {
      const doc = {
        repoUrl: 'git://github.com/user/repo.git',
        licenseSpdxId: 'MIT',
      };
      const expected = {
        licenseName: 'MIT License',
      };
      const result = parsePackageMetadata(doc);
      result.licenseName.should.equal(expected.licenseName);
    });
    it('should set licenseSpdxId to null if not defined', () => {
      const doc = {
        repoUrl: 'git://github.com/user/repo.git',
      };
      const expected = {
        licenseSpdxId: null,
      };
      const result = parsePackageMetadata(doc);
      assert.equal(result.licenseSpdxId, expected.licenseSpdxId);
    });
    it('should set licenseName to null if licenseSpdxId is not defined', () => {
      const doc = {
        repoUrl: 'git://github.com/user/repo.git',
      };
      const expected = {
        licenseName: null,
      };
      const result = parsePackageMetadata(doc);
      assert.equal(result.licenseName, expected.licenseName);
    });
    it('should parse parentOwner from parentRepoUrl', () => {
      const doc = {
        repoUrl: 'git://github.com/user/repo.git',
        parentRepoUrl: 'git://github.com/user/parent-repo.git',
      };
      const expected = {
        parentOwner: 'user',
      };
      const result = parsePackageMetadata(doc);
      result.parentOwner!.should.equal(expected.parentOwner);
    });
    it('should parse parentOwnerUrl from parentRepoUrl', () => {
      const doc = {
        repoUrl: 'git://github.com/user/repo.git',
        parentRepoUrl: 'git://github.com/user/parent-repo.git',
      };
      const expected = {
        parentOwnerUrl: 'https://github.com/user',
      };
      const result = parsePackageMetadata(doc);
      result.parentOwnerUrl!.should.equal(expected.parentOwnerUrl);
    });
  });
});
