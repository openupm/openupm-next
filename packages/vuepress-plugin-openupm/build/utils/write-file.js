import { fs, path } from '@vuepress/utils';
import { PUBLIC_GEN_DIR } from 'openupm-types';
/**
 * Write file to public dir
 * @param app vuepress app
 * @param file file path relative to public dir
 * @param content file content
 */
export const writePublic = async function (app, file, content) {
    const dir = app.dir.public();
    const filePath = path.join(dir, file);
    await fs.outputFile(filePath, content);
};
/**
 * Write file to public gen dir
 * @param app vuepress app
 * @param file file path relative to public gen dir
 * @param content file content
 */
export const writePublicGen = async function (app, file, content) {
    await createGenDir(app);
    await writePublic(app, path.join(PUBLIC_GEN_DIR, file), content);
};
/**
 * Create gen dir
 * @param app vuepress app
 */
export const createGenDir = async function (app) {
    const dir = app.dir.public();
    const genDir = path.join(dir, PUBLIC_GEN_DIR);
    await fs.ensureDir(genDir);
};
//# sourceMappingURL=write-file.js.map