import { PackageMetadataLocal } from '@openupm/types';
import { getPackageDetailPagePath } from '@openupm/common/build/urls.js';

export const PACKAGE_ALIAS_REDIRECTS_HEADER =
  '# Package rename redirects generated from package aliases.';

export function buildPackageAliasRedirects(
  metadataLocalList: PackageMetadataLocal[],
): string {
  return metadataLocalList
    .flatMap((metadataLocal) =>
      metadataLocal.aliases.map(
        (alias) =>
          `${getPackageDetailPagePath(alias)} ${getPackageDetailPagePath(
            metadataLocal.name,
          )} 301`,
      ),
    )
    .join('\n');
}

export function mergePackageAliasRedirects(
  staticRedirects: string,
  packageAliasRedirects: string,
): string {
  const staticContent = staticRedirects
    .split(`\n\n${PACKAGE_ALIAS_REDIRECTS_HEADER}\n`)[0]
    .trimEnd();
  const generatedContent = packageAliasRedirects.trim();
  if (!generatedContent) return `${staticContent}\n`;
  return `${staticContent}\n\n${PACKAGE_ALIAS_REDIRECTS_HEADER}\n${generatedContent}\n`;
}
