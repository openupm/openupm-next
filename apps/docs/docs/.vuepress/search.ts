import { computed } from "vue";
import {
  isPackageDetailPath,
  parsePackageNameFromPackageDetailPath,
} from "@openupm/common/build/urls.js";
import { SearchIndex, SearchIndexItem } from "@vuepress/plugin-search";

export interface PackageSearchSuggestion {
  displayName: string;
  name: string;
  title: string;
}

export const isUnityNuGetPackageName = (packageName: string): boolean =>
  packageName.startsWith("org.nuget.");

export const getPackageSearchResultDisplayName = (
  pageTitle: string,
  packageName: string,
): string => {
  const titleParts = pageTitle.split(" | ");
  return titleParts[0]?.trim() || packageName;
};

export const getPackageSearchResultTitle = (
  pageTitle: string,
  packageName: string,
): string => {
  const displayName = getPackageSearchResultDisplayName(
    pageTitle,
    packageName,
  );

  if (!displayName) return packageName;
  if (displayName === packageName) return packageName;
  return `${displayName} | ${packageName}`;
};

export const getPackageNameFromSearchSuggestionLink = (
  link: string,
): string | null => {
  const path = link.split(/[?#]/, 1)[0];
  return parsePackageNameFromPackageDetailPath(path);
};

export const normalizeSearchQuery = (query: string): string =>
  query
    .trim()
    .split(/\s+/)
    .map((token) =>
      token.replace(/^[^\p{L}\p{N}_@.-]+|[^\p{L}\p{N}_@.-]+$/gu, ""),
    )
    .filter(Boolean)
    .join(" ");

const hasNonAscii = (str: string): boolean =>
  Array.from(str).some((char) => (char.codePointAt(0) ?? 0) > 0x7f);

const splitSearchQuery = (query: string): string[] =>
  query
    .split(/\s+/gu)
    .map((token) => token.trim())
    .filter(Boolean);

const escapeRegExp = (str: string): string =>
  str.replaceAll(/[-/\\^$*+?.()|[\]{}]/gu, String.raw`\$&`);

const isQueryMatched = (query: string, toMatch: string[]): boolean => {
  const matchText = toMatch.join(" ");
  const queryTokens = splitSearchQuery(query);
  if (hasNonAscii(query)) {
    // Match @vuepress/plugin-search behavior for non-ASCII queries.
    return queryTokens.some((token) =>
      matchText.toLowerCase().includes(token),
    );
  }

  const hasTrailingSpace = query.endsWith(" ");
  return RegExp(
    `${queryTokens
      .map((token, index) =>
        queryTokens.length === index + 1 && !hasTrailingSpace
          ? `(?=.*\\b${escapeRegExp(token)})`
          : `(?=.*\\b${escapeRegExp(token)}\\b)`,
      )
      .join("")}.+`,
    "giu",
  ).test(matchText);
};

export const usePackageSearchSuggestions = (
  searchIndex: SearchIndex,
  query: string,
  maxSuggestions?: number,
): PackageSearchSuggestion[] => {
  // filter search index of package detail pages
  const packageSearchIndex = computed(() =>
    searchIndex.filter((item: SearchIndexItem) =>
      isPackageDetailPath(item.path),
    ),
  );
  // if query is empty, return empty suggestions
  const searchStr = cleanToken(normalizeSearchQuery(query).toLowerCase());
  if (!searchStr) return [];
  // search tokens
  const suggestions: PackageSearchSuggestion[] = [];
  for (const searchIndexItem of packageSearchIndex.value) {
    if (maxSuggestions !== undefined && suggestions.length >= maxSuggestions)
      break;
    // match page title and extra fields
    if (
      isQueryMatched(searchStr, [
        searchIndexItem.title,
        ...searchIndexItem.extraFields,
      ])
    ) {
      const packageName = parsePackageNameFromPackageDetailPath(
        searchIndexItem.path,
      );
      if (packageName)
        suggestions.push({
          displayName: getPackageSearchResultDisplayName(
            searchIndexItem.title,
            packageName,
          ),
          name: packageName,
          title: getPackageSearchResultTitle(searchIndexItem.title, packageName),
        });
      else
        console.warn(
          `Failed to parse package name from path ${searchIndexItem.path}`,
        );
    }
  }
  return suggestions;
};

/**
 * Clean a token by removing a few plural cases that can benefit from being singularized
 * (e.g. "ses", "xes", "zes", "ches", "shes", or just "s" for the rest). Because
 * `isQueryMatched` is a very basic search algorithm that does not support pluralization,
 * but it does support startsWith"-like matching, this function can help improve search
 * results.
 * See more in: [isQueryMatched.ts](https://github.com/vuepress/vuepress-next/blob/main/ecosystem/plugin-search/src/client/utils/isQueryMatched.ts)
 * @param searchStr search string
 * @returns cleaned search string
 */
const cleanToken = (searchStr: string): string => {
  searchStr = searchStr.trim().toLowerCase();
  const tokens = searchStr.split(/\s+/);
  const cleanedTokens = tokens.map((token) => {
    if (
      token.endsWith("ses") ||
      token.endsWith("xes") ||
      token.endsWith("zes") ||
      token.endsWith("ches") ||
      token.endsWith("shes")
    )
      return token.slice(0, -2);
    // If token ends in "s", remove the "s"
    else if (token.endsWith("s")) token = token.slice(0, -1);
    return token;
  });
  return cleanedTokens.join(" ");
};
