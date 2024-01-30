// Types for Asset Store API

export type Publisher = {
  label_english: string;
  slug: string;
  url: string;
  id: string;
  label: string;
  support_email: string;
  support_url: string | null;
};

export type AssetStorePackageList = {
  name: string;
  slug_v2: string;
  slug: string;
  overlay: string;
};

export type AssetStorePackage = {
  icon: string;
  pubdate: string;
  rating: {
    count: number | null;
    average: number;
  };
  pubdate_iso: string;
  kategory: {
    name: string;
    slug: string;
    id: string;
  };
  weight: number;
  package_version_id: string;
  slug: string;
  hotness: string;
  id: string;
  category: {
    label_english: string;
    slug_v2: string;
    multiple: string;
    id: string;
    label: string;
  };
  publisher: Publisher;
  list: AssetStorePackageList[];
  link: { id: string; type: string };
  flags: {
    [key: string]: unknown;
  };
  version: string;
  keyimage: {
    icon: string;
    small: string | null;
    small_legacy: string | null;
    small_v2: string | null;
    big_legacy: string | null;
    icon75: string | null;
    big: string | null;
    facebook: string | null;
    medium: string | null;
    package_version_id: string;
    big_v2: string;
    icon25: string | null;
  };
  price_usd: string;
  title_english: string;
  title: string;
  overlay?: string;
};

export type AssetStoreSearchResult = {
  total: number;
  results: AssetStorePackage[];
};
