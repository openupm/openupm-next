import { describe, it } from 'vitest';
import chai from "chai";
const assert = chai.assert;
chai.should();

import { fillMissingDates } from "@/utils";

describe("@/utils.ts", function () {

  describe('fillMissingDates', () => {
    it('should fill in missing dates with 0 downloads', () => {
      const startDate = new Date('2021-01-01');
      const endDate = new Date('2021-01-05');
      const discreteStats = [
        { day: '2021-01-01', downloads: 10 },
        { day: '2021-01-03', downloads: 20 },
        { day: '2021-01-05', downloads: 30 },
      ];
      const expected = [
        { day: '2021-01-01', downloads: 10 },
        { day: '2021-01-02', downloads: 0 },
        { day: '2021-01-03', downloads: 20 },
        { day: '2021-01-04', downloads: 0 },
        { day: '2021-01-05', downloads: 30 },
      ];
      const result = fillMissingDates(discreteStats, startDate, endDate);
      result.should.deep.equal(expected);
    });

    it('should return an empty array if startDate is after endDate', () => {
      const startDate = new Date('2021-01-05');
      const endDate = new Date('2021-01-01');
      const discreteStats = [];
      const expected = [];
      const result = fillMissingDates(discreteStats, startDate, endDate);
      result.should.deep.equal(expected);
    });

    it('should return the original array if it contains all dates', () => {
      const startDate = new Date('2021-01-01');
      const endDate = new Date('2021-01-05');
      const discreteStats = [
        { day: '2021-01-01', downloads: 10 },
        { day: '2021-01-02', downloads: 20 },
        { day: '2021-01-03', downloads: 30 },
        { day: '2021-01-04', downloads: 40 },
        { day: '2021-01-05', downloads: 50 },
      ];
      const expected = [
        { day: '2021-01-01', downloads: 10 },
        { day: '2021-01-02', downloads: 20 },
        { day: '2021-01-03', downloads: 30 },
        { day: '2021-01-04', downloads: 40 },
        { day: '2021-01-05', downloads: 50 },
      ];
      const result = fillMissingDates(discreteStats, startDate, endDate);
      result.should.deep.equal(expected);
    });
  });
})
