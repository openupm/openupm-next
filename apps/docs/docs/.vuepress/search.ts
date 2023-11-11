import { computed } from "vue";
import { isQueryMatched } from "@node_modules/@vuepress/plugin-search/lib/client/utils";
import {
  isPackageDetailPath,
  parsePackageNameFromPackageDetailPath,
} from "@openupm/common/build/urls.js";
import { SearchIndex, SearchIndexItem } from "@vuepress/plugin-search";

export interface PackageSearchSuggestion {
  name: string;
}

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
  const searchStr = cleanToken(query.trim().toLowerCase());
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
          name: parsePackageNameFromPackageDetailPath(searchIndexItem.path)!,
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
