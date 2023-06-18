import { App } from 'vue';
import { capitalize } from 'lodash';

export const GlobalFilters = {
  install: (app: App) => {
    app.config.globalProperties.$capitalize = capitalize;
  },
};
