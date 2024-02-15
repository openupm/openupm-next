// The back to top button is based on the @vuepress/plugin-back-to-top plugin and modified to support vue-virtual-scroll-grid.
import { debounce } from "ts-debounce";
import {
  computed,
  defineComponent,
  h,
  onUnmounted,
  ref,
  Transition,
  watchEffect,
} from "vue";

import "@/styles/back-to-top/vars.css";
import "@/styles/back-to-top/back-to-top.css";

export const BackToTop = defineComponent({
  name: "VueVirtualScrollGridBackToTop",
  props: {
    // eslint-disable-next-line vue/require-default-prop
    gridWrapper: {
      type: null,
      required: false,
    },
  },
  setup(props) {
    const scrollTop = ref(0);

    const getScrollTop = (): number =>
      props.gridWrapper ? props.gridWrapper.scrollTop : 0;

    const scrollToTop = (): void => {
      if (props.gridWrapper)
        props.gridWrapper.scrollTo({ top: 0, behavior: "smooth" });
    };

    const show = computed(() => scrollTop.value > 300);

    const onScroll = debounce(() => {
      scrollTop.value = getScrollTop();
    }, 100);

    const onScrollHandler = (): void => {
      onScroll();
    };

    watchEffect(() => {
      if (props.gridWrapper) {
        scrollTop.value = getScrollTop();
        props.gridWrapper.addEventListener("scroll", onScrollHandler);
      }
    });

    onUnmounted(() => {
      if (props.gridWrapper)
        props.gridWrapper.removeEventListener("scroll", onScrollHandler);
    });

    const backToTopEl = h("div", {
      class: "back-to-top",
      onClick: scrollToTop,
    });

    return (): JSX.Element =>
      h(
        Transition,
        {
          name: "back-to-top",
        },
        () => (show.value ? backToTopEl : null),
      );
  },
});

export default BackToTop;
