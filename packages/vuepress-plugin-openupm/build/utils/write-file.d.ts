/**
 * Write file to public dir
 * @param app vuepress app
 * @param file file path relative to public dir
 * @param content file content
 */
export declare const writePublic: (app: App, file: string, content: string) => Promise<void>;
/**
 * Write file to public gen dir
 * @param app vuepress app
 * @param file file path relative to public gen dir
 * @param content file content
 */
export declare const writePublicGen: (app: App, file: string, content: string) => Promise<void>;
/**
 * Create gen dir
 * @param app vuepress app
 */
export declare const createGenDir: (app: App) => Promise<void>;
