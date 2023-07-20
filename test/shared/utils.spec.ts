import { describe, it } from 'vitest';
import chai from "chai";
const assert = chai.assert;
chai.should();

import {
  isPackageBlockedByScope,
  isValidPackageName,
  getCachedAvatarImageFilename,
  getEnv,
  parsePackageMetadataRemote,
  filterMetadatabyTopicSlug,
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

  describe("getEnv", function () {
    it("should return the correct value for node", function () {
      process.env.tempvar1 = "test";
      getEnv("tempvar1").should.equal("test");
      process.env.tempvar1 = undefined;
    });
  });


  describe('getCachedAvatarImageFilename', () => {
    it('should return the expected filename', () => {
      const username = 'JohnDoe';
      const size = 64;
      const expected = 'johndoe-64x64.png';
      const result = getCachedAvatarImageFilename(username, size);
      result.should.equal(expected);
    });

    it('should convert username to lowercase', () => {
      const username = 'JaneDoe';
      const size = 128;
      const expected = 'janedoe-128x128.png';
      const result = getCachedAvatarImageFilename(username.toUpperCase(), size);
      result.should.equal(expected);
    });
  });

  describe('parsePackageMetadataRemote', () => {
    it('should set ver to null if not defined', () => {
      const input = {
        stars: 10,
        pstars: 5,
        imageFilename: 'test.png',
        dl30d: 100,
        repoUnavailable: false,
      };
      const expected = null;
      const result = parsePackageMetadataRemote(input);
      assert.equal(result.ver, expected);
    });

    it('should set stars to 0 if not defined', () => {
      const input = {
        ver: '1.0.0',
        pstars: 5,
        imageFilename: 'test.png',
        dl30d: 100,
        repoUnavailable: false,
      };
      const expected = 0;
      const result = parsePackageMetadataRemote(input);
      result.stars.should.equal(expected);
    });

    it('should set pstars to 0 if not defined', () => {
      const input = {
        ver: '1.0.0',
        stars: 10,
        imageFilename: 'test.png',
        dl30d: 100,
        repoUnavailable: false,
      };
      const expected = 0;
      const result = parsePackageMetadataRemote(input);
      result.pstars.should.equal(expected);
    });

    it('should set imageFilename to null if not defined', () => {
      const input = {
        ver: '1.0.0',
        stars: 10,
        pstars: 5,
        dl30d: 100,
        repoUnavailable: false,
      };
      const expected = null;
      const result = parsePackageMetadataRemote(input);
      assert.equal(result.imageFilename, expected);
    });

    it('should set dl30d to 0 if not defined', () => {
      const input = {
        ver: '1.0.0',
        stars: 10,
        pstars: 5,
        imageFilename: 'test.png',
        repoUnavailable: false,
      };
      const expected = 0;
      const result = parsePackageMetadataRemote(input);
      result.dl30d.should.equal(expected);
    });

    it('should set repoUnavailable to false if not defined', () => {
      const input = {
        ver: '1.0.0',
        stars: 10,
        pstars: 5,
        imageFilename: 'test.png',
        dl30d: 100,
      };
      const expected = false;
      const result = parsePackageMetadataRemote(input);
      result.repoUnavailable.should.equal(expected);
    });
  });

  describe('filterMetadatabyTopicSlug', () => {
    const metadata = {
      excludedFromList: false,
      topics: ['javascript', 'typescript'],
    } as any;

    it('should return false if metadata is excluded from list', () => {
      const result = filterMetadatabyTopicSlug({ ...metadata, excludedFromList: true }, 'javascript');
      result.should.be.false;
    });

    it('should return true if metadata topics include the topic slug', () => {
      const result = filterMetadatabyTopicSlug(metadata, 'javascript');
      result.should.be.true;
    });

    it('should return false if metadata topics do not include the topic slug', () => {
      const result = filterMetadatabyTopicSlug(metadata, 'react');
      result.should.be.false;
    });

    it('should return false if metadata is excluded from list, even if topic slug is defined', () => {
      const result = filterMetadatabyTopicSlug({ ...metadata, excludedFromList: true }, 'javascript');
      result.should.be.false;
    });
  });
});
