import { App } from "vue";
import { capitalize } from "lodash-es";

export const GlobalFilters = {
  install: (app: App): void => {
    app.config.globalProperties.$capitalize = capitalize;
  },
};
