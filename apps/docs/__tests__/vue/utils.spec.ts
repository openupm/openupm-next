import { describe, it } from "vitest";
import chai from "chai";
chai.should();

import { DailyDownload } from "@openupm/types";
import {
  decodeGitHubBase64Content,
  fillMissingDates,
  generateHueFromStringInRange,
  stripLeadingBom,
} from "@/utils";

describe("@/utils.ts", function () {
  describe("fillMissingDates", () => {
    it("should fill in missing dates with 0 downloads", () => {
      const startDate = new Date("2021-01-01");
      const endDate = new Date("2021-01-05");
      const discreteStats = [
        { day: "2021-01-01", downloads: 10 },
        { day: "2021-01-03", downloads: 20 },
        { day: "2021-01-05", downloads: 30 },
      ];
      const expected = [
        { day: "2021-01-01", downloads: 10 },
        { day: "2021-01-02", downloads: 0 },
        { day: "2021-01-03", downloads: 20 },
        { day: "2021-01-04", downloads: 0 },
        { day: "2021-01-05", downloads: 30 },
      ];
      const result = fillMissingDates(discreteStats, startDate, endDate);
      result.should.deep.equal(expected);
    });

    it("should return an empty array if startDate is after endDate", () => {
      const startDate = new Date("2021-01-05");
      const endDate = new Date("2021-01-01");
      const discreteStats = [] as DailyDownload[];
      const expected = [] as DailyDownload[];
      const result = fillMissingDates(discreteStats, startDate, endDate);
      result.should.deep.equal(expected);
    });

    it("should return the original array if it contains all dates", () => {
      const startDate = new Date("2021-01-01");
      const endDate = new Date("2021-01-05");
      const discreteStats = [
        { day: "2021-01-01", downloads: 10 },
        { day: "2021-01-02", downloads: 20 },
        { day: "2021-01-03", downloads: 30 },
        { day: "2021-01-04", downloads: 40 },
        { day: "2021-01-05", downloads: 50 },
      ];
      const expected = [
        { day: "2021-01-01", downloads: 10 },
        { day: "2021-01-02", downloads: 20 },
        { day: "2021-01-03", downloads: 30 },
        { day: "2021-01-04", downloads: 40 },
        { day: "2021-01-05", downloads: 50 },
      ];
      const result = fillMissingDates(discreteStats, startDate, endDate);
      result.should.deep.equal(expected);
    });
  });

  describe("generateHueFromStringInRange", () => {
    it("should return a number within the specified range", () => {
      const str = "test";
      const rangeMin = 0;
      const rangeMax = 255;
      const result = generateHueFromStringInRange(str, rangeMin, rangeMax);
      result.should.be.a("number");
      result.should.be.within(rangeMin, rangeMax);
    });

    it("should return a number within the specified range, even if rangeMin is negative", () => {
      const str = "test";
      const rangeMin = -10;
      const rangeMax = 255;
      const result = generateHueFromStringInRange(str, rangeMin, rangeMax);
      result.should.be.a("number");
      result.should.be.within(0, rangeMax);
    });

    it("should return a number within the specified range, even if rangeMax is greater than 255", () => {
      const str = "test";
      const rangeMin = 0;
      const rangeMax = 300;
      const result = generateHueFromStringInRange(str, rangeMin, rangeMax);
      result.should.be.a("number");
      result.should.be.within(rangeMin, 255);
    });
  });

  describe("stripLeadingBom", () => {
    it("removes a leading UTF-8 BOM", () => {
      stripLeadingBom('\uFEFF{"name":"package-a"}').should.equal(
        '{"name":"package-a"}',
      );
    });

    it("leaves text without a leading UTF-8 BOM unchanged", () => {
      stripLeadingBom('{"name":"package-a"}').should.equal(
        '{"name":"package-a"}',
      );
    });
  });

  describe("decodeGitHubBase64Content", () => {
    it("decodes UTF-8 GitHub content and strips a leading BOM", () => {
      const content = Buffer.from(
        '\uFEFF{"name":"package-a","displayName":"\\u6e2c\\u8a66"}',
        "utf8",
      ).toString("base64");

      const decoded = decodeGitHubBase64Content(content);

      JSON.parse(decoded).should.deep.equal({
        name: "package-a",
        displayName: "測試",
      });
    });
  });
});
