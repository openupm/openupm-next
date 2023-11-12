/**
 * Modified from @vuepress/plugin-search
 * https://github.com/vuepress/vuepress-next/blob/main/ecosystem/plugin-search/src/client/components/SearchBox.ts
 * - add a custom search entry.
 * - hardcoded configurations for locales, hotkeys, maxSuggestions.
 * - change the component name to MySearchBox.
 * - fix: search index not reset when press escape key.
 */
import { useRouteLocale } from "@vuepress/client";
import { computed, defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import {
  useHotKeys,
  useSearchIndex,
  useSearchSuggestions,
  useSuggestionsFocus,
  SearchSuggestion,
} from "@node_modules/@vuepress/plugin-search/lib/client/composables";

export default defineComponent({
  name: "MySearchBox",

  setup() {
    const locales = computed(() => ({
      "/": {
        placeholder: "Search ctrl+k",
      },
      "/zh/": {
        placeholder: "搜索 ctrl+k",
      },
    }));
    const hotKeys = computed(() => [{ key: "k", ctrl: true }]);
    const maxSuggestions = computed(() => 10);

    const router = useRouter();
    const routeLocale = useRouteLocale();
    const searchIndex = useSearchIndex();

    const input = ref<HTMLInputElement | null>(null);
    const isActive = ref(false);
    const query = ref("");
    const locale = computed(() => locales.value[routeLocale.value] ?? {});

    const originalSuggestions = useSearchSuggestions({
      searchIndex,
      routeLocale,
      query,
      maxSuggestions,
    });

    const suggestions = computed(() => {
      if (query.value) {
        return (
          [
            {
              link: "/packages/?q=" + query.value,
              title: "Search the package list...",
            },
          ] as SearchSuggestion[]
        ).concat(originalSuggestions.value);
      }
      return originalSuggestions.value;
    });

    const { focusIndex, focusNext, focusPrev } =
      useSuggestionsFocus(suggestions);
    useHotKeys({ input, hotKeys });

    const showSuggestions = computed(
      () => isActive.value && !!suggestions.value.length,
    );
    const onArrowUp = (): void => {
      if (!showSuggestions.value) {
        return;
      }
      focusPrev();
    };
    const onArrowDown = (): void => {
      if (!showSuggestions.value) {
        return;
      }
      focusNext();
    };
    const onEscape = (): void => {
      focusIndex.value = 0;
    };
    const goTo = (index: number): void => {
      if (!showSuggestions.value) {
        return;
      }

      const suggestion = suggestions.value[index];
      if (!suggestion) {
        return;
      }

      router.push(suggestion.link).then(() => {
        query.value = "";
        focusIndex.value = 0;
      });
    };

    return (): JSX.Element =>
      h(
        "form",
        {
          class: "search-box",
          role: "search",
        },
        [
          h("input", {
            ref: input,
            type: "search",
            placeholder: locale.value.placeholder,
            autocomplete: "off",
            spellcheck: false,
            value: query.value,
            onFocus: () => (isActive.value = true),
            onBlur: () => (isActive.value = false),
            onInput: (event) => (query.value = event.target.value),
            onKeydown: (event) => {
              switch (event.key) {
                case "ArrowUp": {
                  onArrowUp();
                  break;
                }
                case "ArrowDown": {
                  onArrowDown();
                  break;
                }
                case "Enter": {
                  event.preventDefault();
                  goTo(focusIndex.value);
                  break;
                }
                case "Escape": {
                  onEscape();
                  break;
                }
              }
            },
          }),
          showSuggestions.value &&
            h(
              "ul",
              {
                class: "suggestions",
                onMouseleave: () => (focusIndex.value = -1),
              },
              suggestions.value.map(({ link, title, header }, index) =>
                h(
                  "li",
                  {
                    class: [
                      "suggestion",
                      {
                        focus: focusIndex.value === index,
                      },
                    ],
                    onMouseenter: () => (focusIndex.value = index),
                    onMousedown: () => goTo(index),
                  },
                  h(
                    "a",
                    {
                      href: link,
                      onClick: (event) => event.preventDefault(),
                    },
                    [
                      h(
                        "span",
                        {
                          class: "page-title",
                        },
                        title,
                      ),
                      header &&
                        h("span", { class: "page-header" }, `> ${header}`),
                    ],
                  ),
                ),
              ),
            ),
        ],
      );
  },
});
