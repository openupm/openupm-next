import { isDate } from "lodash-es";
import { formatDistanceToNow } from "date-fns";
import { enUS, zhCN } from 'date-fns/locale';

import { useDefaultStore } from "@/store";
import { Region } from "@shared/constant";
import { getRegion } from "@shared/utils";
import { DailyDownload } from "@shared/types";
import { ComposerTranslation } from "vue-i18n";

/**
 * Return whether the package exists
 * @param name package name
 * @returns whether the package exists
 */
export const isPackageExist = function (name: string): boolean {
  const store = useDefaultStore();
  return name in store.packageMetadataRemoteDict;
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

/**
 * Generate a hue value from a string within a specified range.
 * @param {string} str - The input string to generate the hue from.
 * @param {number} rangeMin - The minimum value of the hue range (must be >= 0).
 * @param {number} rangeMax - The maximum value of the hue range (must be <= 255).
 * @returns {number} - The value within the specified range.
 */
export const generateHueFromStringInRange = function (str: string, rangeMin: number, rangeMax: number): number {
  if (rangeMin < 0) {
    rangeMin = 0;
  }
  if (rangeMax > 255) {
    rangeMax = 255;
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 2) - hash);
  }
  const hue = Math.abs(hash % (rangeMax - rangeMin + 1)) + rangeMin;
  return hue;
};

/**
 * Translate a string with fallback.
 * @param t translation function
 * @param tkey translation key
 * @param fallback fallback string if translation failed
 */
export const translateFallback = function (t: ComposerTranslation, tkey: string, fallback: string) {
  const tvalue = t(tkey);
  if (tvalue == tkey) return fallback;
  return tvalue;
}