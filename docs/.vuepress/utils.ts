import { isDate } from "lodash-es";
import { formatDistanceToNow } from "date-fns";
import { enUS, zhCN } from 'date-fns/locale';

import { useDefaultStore } from "@/store";
import { Region } from "@shared/constant";
import { getRegion } from "@shared/utils";
import { DailyDownload } from "@shared/types";

/**
 * Return whether the package exists
 * @param name package name
 * @returns whether the package exists
 */
export const isPackageExist = function (name: string): boolean {
  const store = useDefaultStore();
  return name in store.packageMetadataRemoteList;
}

// Return time since string for the given date
export const timeAgoFormat = function (date: Date | string): string {
  if (!isDate(date)) date = new Date(date);
  if (isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, {
    locale: getRegion() == Region.CN ? zhCN : enUS
  });
}

/**
 * Fill in missing dates in a list of discrete stats objects with a downloads value of 0.
 * @param {DailyDownload[]} discreteStats
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns array of discrete stats objects with missing dates filled in
 */
export const fillMissingDates = function (discreteStats: DailyDownload[], startDate: Date, endDate: Date): DailyDownload[] {
  const filledStats = [];
  let currentDate = startDate;
  let currentIndex = 0;
  while (currentDate <= endDate) {
    const currentDay = currentDate.toISOString().substring(0, 10);
    if (currentIndex < discreteStats.length && discreteStats[currentIndex].day === currentDay) {
      filledStats.push(discreteStats[currentIndex]);
      currentIndex++;
    } else {
      filledStats.push({ day: currentDay, downloads: 0 });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return filledStats;
}