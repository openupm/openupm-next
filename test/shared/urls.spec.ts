import { describe, it } from 'vitest';
import chai from "chai";
const assert = chai.assert;
chai.should();

import {
  isPackageDetailPath, isPackageListPath, parsePackageNameFromPackageDetailPath
} from "@shared/urls";

describe("@shared/urls.ts", function () {
  describe('isPackageDetailPath', () => {
    it('should return true for path included lowecase letters', () => {
      const result = isPackageDetailPath('/packages/com.example.package/');
      result.should.be.true;
    });

    it('should return true for path included uppercase letters', () => {
      const result = isPackageDetailPath('/packages/com.example.Package/');
      result.should.be.true;
    });

    it('should return true for path included dash', () => {
      const result = isPackageDetailPath('/packages/com.example.package-/');
      result.should.be.true;
    });

    it('should return true for path included underscore', () => {
      const result = isPackageDetailPath('/packages/com.example.package_/');
      result.should.be.true;
    });

    it('should return true for path included numbers', () => {
      const result = isPackageDetailPath('/packages/com.example.package123/');
      result.should.be.true;
    });

    it('should return false for invalid package detail path', () => {
      const result = isPackageDetailPath('/packages/topics/asset-management/');
      result.should.be.false;
    });

    it('should return false for non-package path', () => {
      const result = isPackageDetailPath('/about/');
      result.should.be.false;
    });
  });

  describe('isPackageListPath', () => {
    it('should return true for package list path', () => {
      const result = isPackageListPath('/packages/');
      result.should.be.true;
    });

    it('should return true for valid package topic path', () => {
      const result = isPackageListPath('/packages/topics/my-topic/');
      result.should.be.true;
    });

    it('should return false for invalid package topic path', () => {
      const result = isPackageListPath('/packages/topics/my-topic/invalid/');
      result.should.be.false;
    });

    it('should return false for non-package path', () => {
      const result = isPackageListPath('/about/');
      result.should.be.false;
    });
  });

  describe('parsePackageNameFromPackageDetailPath', () => {
    it('should return the package name from a valid package detail path', () => {
      const path = '/packages/com.example.mypackage/'
      const packageName = parsePackageNameFromPackageDetailPath(path);
      (packageName === null).should.be.false;
      packageName!.should.equal('com.example.mypackage');
    })

    it('should return null for an invalid package detail path', () => {
      const path = '/invalid/path/'
      const packageName = parsePackageNameFromPackageDetailPath(path);
      (packageName! === null).should.be.true;
    })

    it('should return null for a package topic path', () => {
      const path = '/packages/topics/2d/'
      const packageName = parsePackageNameFromPackageDetailPath(path);
      (packageName! === null).should.be.true;
    })

    it('should return null for a package list path', () => {
      const path = '/packages/'
      const packageName = parsePackageNameFromPackageDetailPath(path);
      (packageName! === null).should.be.true;
    })
  })
});
