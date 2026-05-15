import { PackageMetadata } from '@openupm/types';
import { getPackageDetailPagePath } from '@openupm/common/build/urls.js';

export type PackageAliasNavLink = {
  link: string;
  text: string;
};

export function getPackageAliasNavLinks(
  metadata: Pick<PackageMetadata, 'aliases'>,
): PackageAliasNavLink[] {
  return metadata.aliases.map((alias) => ({
    link: getPackageDetailPagePath(alias),
    text: alias,
  }));
}
