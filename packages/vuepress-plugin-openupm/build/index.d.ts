import { Page } from '@vuepress/types';
declare const _default: () => {
    name: string;
    onInitialized(app: App): Promise<void>;
    extendsPage: (page: Page) => Promise<void>;
    onPrepared: (app: App) => Promise<void>;
};
export default _default;
