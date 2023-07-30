import type { PageHeader } from '@vuepress/shared'
import { computed } from 'vue'
import { isQueryMatched } from '@node_modules/@vuepress/plugin-search/lib/client/utils'
import { isPackageDetailPath, parsePackageNameFromPackageDetailPath } from '@shared/urls'
import { SearchIndex, SearchIndexItem } from '@vuepress/plugin-search'

export interface PackageSearchSuggestion {
  name: string
}

export const usePackageSearchSuggestions = (searchIndex: SearchIndex, query: string, maxSuggestions?: number): PackageSearchSuggestion[] => {
  // filter search index of package detail pages
  const packageSearchIndex = computed(() =>
    searchIndex.filter((item: SearchIndexItem) => isPackageDetailPath(item.path)));

  // if query is empty, return empty suggestions
  const searchStr = query.trim().toLowerCase();
  if (!searchStr) return [];

  const suggestions: PackageSearchSuggestion[] = [];

  for (const searchIndexItem of packageSearchIndex.value) {
    if (maxSuggestions !== undefined && suggestions.length >= maxSuggestions)
      break;

    // match page title and extra fields
    if (isQueryMatched(searchStr, [searchIndexItem.title, ...searchIndexItem.extraFields])) {
      const packageName = parsePackageNameFromPackageDetailPath(searchIndexItem.path);
      if (packageName)
        suggestions.push({
          name: parsePackageNameFromPackageDetailPath(searchIndexItem.path)!,
        });
      else
        console.warn(`Failed to parse package name from path ${searchIndexItem.path}`);
    }
  }

  return suggestions;
}
