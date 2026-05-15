import { PackageMetadata } from '@openupm/types';
import { getPackageDetailPageUrl } from '@openupm/common/build/urls.js';

export type PackageAliasNavLink = {
  link: string;
  text: string;
};

export function getPackageAliasNavLinks(
  metadata: Pick<PackageMetadata, 'aliases'>,
): PackageAliasNavLink[] {
  return metadata.aliases.map((alias) => ({
    link: getPackageDetailPageUrl(alias),
    text: alias,
  }));
}
